var AftershipChallenge = require('./lib/aftership_challenge');
var challenge = new AftershipChallenge('a6403a2b-af21-47c5-aab5-a2420d20bbec');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var try_limit = 10;
var delay_fail = 3;
var number_of_try = 1;
var fail_time_id;

var startWorker = function(id) {
    console.log('Worker ' + id + ' about to start...')
    if(fail_time_id) clearTimeout(fail_time_id);

    if(number_of_try <= try_limit) {
        challenge.startJobWorkers(id);
    }
    else {
        challenge.stop();
        console.log('try limit reached, stopping...')
    }
    number_of_try += 1;
}

challenge.on('success', function(info) {
    console.log(info);
});

challenge.on('fail', function(err) {
    console.log(err);
    console.info('delay fail for ' + delay_fail + ' seconds')
    fail_time_id = setTimeout(function() {
        startWorker();
    }, delay_fail*1000);
});

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
} else {
    startWorker(cluster.worker.id);
}
