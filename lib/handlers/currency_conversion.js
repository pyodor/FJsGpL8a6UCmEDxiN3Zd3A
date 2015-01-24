module.exports = function()
{
    var scraperjs = require('scraperjs');
    var querystring = require('querystring');
    var mongoose = require('mongoose');
    var url = 'http://www.xe.com/currencyconverter/convert/?';
    var ExchangeRate;

    function CurrencyConversionHandler()
    {
        this.type = 'currency_conversion';
    }

    function _convert(amount, from, to, callback) {
        var qs = querystring.stringify({Amount: amount, From: from, To: to});
        scraperjs.StaticScraper.create(url + qs)
        .scrape(function($) {
            return $(".uccRes .rightCol").map(function() {
                return $(this).text();
            }).get();
        }, function(result) {
            result = result[0].split(/\s/)[0];
            result = parseFloat(result).toFixed(2);
            callback(result);
        });
    }

    CurrencyConversionHandler.prototype.work = function(payload, callback)
    {
        mongoose.connect('mongodb://aftership:qazwsx@ds031541.mongolab.com:31541/aftership-challenge');
        if(undefined === ExchangeRate) {
            ExchangeRate = mongoose.model('ExchangeRate', {
                from: String,
                to: String,
                created_at: String,
                rate: String
            });
        }

        var async = require('async');
        async.each(payload.currency, function(currency, callback) {
            _convert(1, currency.from, currency.to, function(result) {
                currency['created_at'] = new Date(Date.now());
                currency['rate'] = result;
                var exchange_rate = new ExchangeRate(currency);
                exchange_rate.save(function(err){
                    mongoose.connection.close();
                });
                callback();
            });
        }, function(err) {
            if(err) {
                callback('error in conversion')
            }
            else {
                callback('success');
            }
        });
    };

    var handler = new CurrencyConversionHandler();
    return handler;
};
