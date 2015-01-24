var fivebeans = require('fivebeans');
var querystring = require('querystring');
var http = require('http');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var tube = 'pyodor';
var seed_client;

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

    this.startJobWorkers = function(id) {
        var worker_id = 'worker_' + id;
        _beanstalkd(function(host, port) {
            var BeanWorker = fivebeans.worker;
            var options = {
                id: worker_id,
                host: host,
                port: port,
                handlers: {
                    currency_conversion: require('./handlers/currency_conversion')()
                },
                ignoreDefault: true
            };
            var worker = new BeanWorker(options);
            worker.on('info', function(info) {
                _success(info);
            }).on('error', function() {
                _fail('worker error')
            }).on('started', function() {
                _success('Worker ' + id + ' started...');
            }).on('job.reserved', function(info) {
                _success('Worker ' + id + ' reserved ' + info.toString());
            }).on('job.handled', function(info) {
                _success('Worker ' + id + ' handled ' + info.id + ' in ' + info.elapsed + ' ms with ' + info.action);
            }).on('warning', function(info) {
                _success(info);
            }).start([tube]);
        });
    };

};

util.inherits(AftershipChallenge, EventEmitter);
module.exports = AftershipChallenge;
