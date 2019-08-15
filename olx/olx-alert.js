var mysql = require('mysql');
var BlynkLib = require('blynk-library');

var options = {
  addr: "blynk-cloud.com",
  port: 9443
}
var blynk = new BlynkLib.Blynk('9eb2b8ba1d67471ba741b8f98569c081', options);

blynk.on('connect', function() {
  console.log("Blynk ready.");
  notify();
});

blynk.on('disconnect', function() {
  console.log("Blynk disconnected.");
  process.exit();
});

function notify() {
  console.log('Starting olx alert..');

  var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'olx'
  });

  connection.query("SELECT * FROM ads WHERE notified='N'", function(error, results, fields) {
    if (error) throw error;
    var V1 = new blynk.VirtualPin(1);
    V1.write(["clr"]);
    var rowIndex = 1;
    var msg = results.length + " new ads\r\n";
    results.forEach(function(row) {
      console.log(`${row.title} @ Rs.${row.price}`);
      V1.write(["add",rowIndex++,row.title,row.price]);
      
      var itemId=row.title.replace(' ','-') + '-iid-' + row.id;
      
      msg += `<p><a href="https://www.olx.in/item/${itemId}">${row.title}&nbsp;Rs.${row.price}&nbsp;${row.state}</a></p>`;
      connection.query("UPDATE ads SET notified='Y' WHERE id=?", [row.id], function(error, results, fields) {
         if (error) throw error;
      })
    });
    connection.end(function(err) {
      // The connection is terminated now
      blynk.disconnect(false);
    });
    if(results.length > 0) {
      blynk.notify(msg.slice(0,120));
      blynk.email("kiliyani.sajeesh@gmail.com", "New OLX Ads!", msg);
    }

  });

}
