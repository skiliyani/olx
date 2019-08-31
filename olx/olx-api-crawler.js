var Request = require("request");
var mysql = require('mysql');
var md5 = require('md5');

Request.get({"headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36" }, 
	"url":"https://www.olx.in/api/relevance/search?facet_limit=1&location=1000001&query=airtel%20wifi&page=0"}, 
	(error, response, body) => {
	    if(error) {
	        return console.log(error);
	    }
	    var json = JSON.parse(body);
	    //console.log(json);
	    
	    for(var ad of json.data) {
	    	console.log(ad.title);
	    	var connection = mysql.createConnection({
		          host: '127.0.0.1',
		          user: 'root',
		          password: 'root',
		          database: 'olx'
		     	});
	    	
	    	var price = 0;
	    	if(ad.price) {
	    		price = ad.price.value.raw;
	    	}
	    	
	    	connection.query('INSERT IGNORE INTO ads(id,title,description,state,price) values (?, ?, ? , ?, ?)', [ad.id, ad.title, ad.description, ad.locations_resolved.ADMIN_LEVEL_1_name,price], function(error, results, fields) {
	            if (error) throw error
	            console.log(ad.price.value.raw);
	            connection.end(function(err) {
	              // The connection is terminated now
	            	process.exit();
	            });
	         });
	    }
	}
);

