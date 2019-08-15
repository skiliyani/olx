var Crawler = require("crawler");
var url = require('url');
var mysql = require('mysql');
var md5 = require('md5');
var schedule = require('node-schedule');

var c = new Crawler({
  rateLimit: 2000,
  maxConnections: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
  // This will be called for each crawled page
  callback: function(error, res, done) {

    console.log(res.request.uri.href);

    if (error) {
      console.log(error);
    } else {

      var $ = res.$;
      // $ is Cheerio by default
      //console.log($.html());
      if($('li[data-aut-id=itemBox]').length == 0 ) {
          console.log('No more ads, exiting!');
          return;
      }

      $('ul[data-aut-id="itemsList"]').find('li[data-aut-id="itemBox"]').each(function() {
        var ad = $(this);
        var title = ad.find('span[data-aut-id="itemTitle"]').text();
        var link = ad.find('li > a').attr('href').replace(/#.*/g, "");
        var price = ad.find('span[data-aut-id="itemPrice"]').text().trim().replace(/,/g,"").match(/\d+/);

        console.log(title + ' - ' + link + ' - ' + price);
        var connection = mysql.createConnection({
          host: '127.0.0.1',
          user: 'root',
          password: 'root',
          database: 'olx'
        });
        connection.query('INSERT IGNORE INTO ads(hash,title,link,price) values (?, ?, ? , ?)', [md5(link + price), title, link, price], function(error, results, fields) {
          if (error) throw error
          connection.end(function(err) {
            // The connection is terminated now
          });
        });

      })

      var page = 2;
      var nextURL;
      if (res.request.uri.query) {
        page = parseInt(res.request.uri.query.split('=')[1]) + 1;
        nextURL = res.request.uri.href.replace(res.request.uri.query, `page=${page}`);
      } else {
        nextURL = res.request.uri.href + `?page=${page}`;
      }

      if ($('button[data-aut-id=btnLoadMore]')) {
        //console.log(res.request.uri.href.replace(res.request.uri.query,`page=${page}`));
        c.queue(nextURL);
      }

    }
    done();
  }
});

//console.log("Scheduling olx crawler...");
//schedule.scheduleJob('*/1 * * * *', function() {
  console.log('Starting olx crawler..');
  c.queue('https://www.olx.in/items/q-surface-pro/?page=1');
  //c.queue('https://www.olx.in/items/q-nexus-5x/?page=1');
//});
