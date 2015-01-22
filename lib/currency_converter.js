module.exports = function(amount, from, to) {
    return {
        convert: function(cb) {
            var url = 'http://www.xe.com/currencyconverter/convert/?';
            var scraperjs = require('scraperjs'),
                querystring = require('querystring');

            // if parameters not specified defaults to 1, HKD & USD
            amount = typeof amount !== 'undefined' ? amount : 1;
            from = typeof from !== 'undefined' ? from : 'HKD';
            to = typeof to !== 'undefined' ? to : 'USD';

            var qs = querystring.stringify({Amount: amount, From: from, To: to});
            scraperjs.StaticScraper.create(url + qs)
            .scrape(function($) {
                return $(".uccRes .rightCol").map(function() {
                    return $(this).text();
                }).get();
            }, function(result) {
                result = result[0].split(/\s/)[0];
                result = parseFloat(result).toFixed(2);
                cb(result);
            });
        }
    }
}
