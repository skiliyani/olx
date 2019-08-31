const mysql = require('mysql');
const schedule = require('node-schedule');
const request = require("request");
const nodemailer = require('nodemailer');

var pool  = mysql.createPool({
	  connectionLimit : 10,
	  host            : '127.0.0.1',
	  user            : 'root',
	  password        : 'root',
	  database        : 'olx',
	  connectTimeout  : 60 * 60 * 1000,
	  acquireTimeout  : 60 * 60 * 1000,
	  timeout         : 60 * 60 * 1000
});

var j = schedule.scheduleJob('*/1 * * * *', function(){
	
	console.log('Starting OLX search at ' + new Date());
	
	pool.getConnection(function(error, connection) {
		if(error) throw error;
		
		connection.query('select * from search where active=true',
				function(error, results, fields) {
					results.forEach(function(row) {
						console.log("Searching %s",row.search_term);
						search(row.id,row.search_term, 0);
					});
				
				connection.query("SELECT * FROM ads WHERE notified='N'", function(error, results, fields) {
					connection.release();
					
					if (error) throw error;
					
					if(results.length > 0) {
						var msg = results.length + " new ads\r\n";
						results.forEach(function(row) {
							var itemId=row.title.replace(' ','-') + '-iid-' + row.id;
							msg += `<p><a href="https://www.olx.in/item/${itemId}">${row.title}&nbsp;Rs.${row.price}&nbsp;${row.state}</a></p>`;
							pool.query("UPDATE ads SET notified='Y' WHERE id=?", [row.id], function(error, results, fields) {
								if (error) throw error;
							});
						});
						console.log("Sending email with %d ads", results.length);
						mail(msg);
					}
					
				});
		});
	});
});

function search(searchId, searchTerm, page) {
	
	if(page > 49) {
		console.log("Page limit reached: %d", page);
		return;
	}
	
	request.get({"headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36" }, 
		"url":"https://www.olx.in/api/relevance/search?facet_limit=1&location=1000001&query=" + searchTerm + "&page=" + page}, 
			(error, response, body) => {
				if(error) throw error;
				
				console.log("Olx: search_term: %s, page: %d", searchTerm, page);
				
			    var json = JSON.parse(body);
			    
			    if(json.data && json.data.length == 0) {
			    	return;
			    }
			    
			    for(var ad of json.data) {
			    	save(searchId, ad);
			    }
			    
			    search(searchId, searchTerm, ++page);

			}
		);
}

function save(searchId, ad) {
	var price = 0;
	if(ad.price) {
		price = ad.price.value.raw;
	}
	pool.getConnection(function(err, connection) {
		if(err) throw err;
		connection.query('INSERT IGNORE INTO ads(id,search_id,title,description,state,price) values (?,?, ?, ? , ?, ?)', [ad.id,searchId, ad.title, ad.description, ad.locations_resolved.ADMIN_LEVEL_1_name,price], 
			function(error, result) {
				connection.release();
				if(result.affectedRows > 0) {
					console.log('New ad: %s', ad.title);
				}
				if(error) throw error;
		});
		
	});
}

function mail(htmlMessage) {

	// create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtpout.asia.secureserver.net',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: '', // generated ethereal user
            pass: '' // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = transporter.sendMail({
        from: '"OLX Notifier" <olx-notifier@sayanispace.com>', // sender address
        to: 'kiliyani.sajeesh@gmail.com', // list of receivers
        subject: 'New OLX Ads', // Subject line
        html: htmlMessage // html body
    });

}
