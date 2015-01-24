var fivebeans = require('fivebeans');
var scraperjs = require('scraperjs');
var querystring = require('querystring');
var http = require('http');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var tube = 'pyodor';
var seed_client, consume_client;

var AftershipChallenge = function(aftership_api_key) {
    var self = this;

    function _fail(args) {
        self.emit('fail', args);
    }

    function _success(info) {
        self.emit('success', info);
    }

    function _beanstalkd(callback) {
        var post_data = querystring.stringify({});
        var post_options = {
            host: 'challenge.aftership.net',
            port: '9578',
            path: '/v1/beanstalkd',
            method: 'POST',
            headers: {
                'aftership-api-key': aftership_api_key,
            }
        };

        var post_request = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                var js = JSON.parse(chunk);
                callback(js.data.host, js.data.port);
            });
        });

        post_request.on('error', function(err) {
            _fail(err);
        });
        post_request.write(post_data);
        post_request.end();
    };

    this.stop = function() {
        if(seed_client) seed_client.end();
        if(consume_client) consume_client.end();
    };

    this.jobSeed = function(jobs) {
        _beanstalkd(function(host, port) {
            seed_client = new fivebeans.client(host, port);
            seed_client.on('connect', function() {
                seed_client.use(tube, function(err, tubename) {
                    if(err) _fail(err);
                    _success('use tube ' + tubename);
                });
                seed_client.put(0, 0, 60, JSON.stringify(jobs), function(err, jobid) {
                    if(err) _fail(err);
                    _success('queued with jobid ' + jobid);
                })
            }).on('error', function(err) {
                _fail(err);
            }).connect();
        });
    };

    this.jobConsume = function() {
        _beanstalkd(function(host, port) {
            consume_client = new fivebeans.client(host, port);
            consume_client.on('connect', function() {
                consume_client.watch(tube, function(err, numwatched) {
                    if(err) _fail(err);
                    _success(numwatched + ' tube/s being watched');
                });
                consume_client.reserve(function(err, jobid, payload) {
                    if(err) _fail(err);
                    //payload = JSON.parse(payload.toString());
                    _success('reserved ' + jobid + ' with payload ' + payload.toString())
                    // TODO: convert currency and save to mongo, destroy for now
                    consume_client.destroy(jobid, function(err) {
                        if(err) _fail(err);
                        _success('destroyed job ' + jobid);
                        _success('full success');
                    });
                });
            }).on('error', function(err) {
                _fail(err);
            }).connect();
        });
    }
};

util.inherits(AftershipChallenge, EventEmitter);
module.exports = AftershipChallenge;
