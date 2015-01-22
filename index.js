var currency_converter = require('./lib/currency_converter');
var currency = currency_converter(1, 'USD', 'PHP');
currency.convert(function(r) {
    console.log(r);
});
