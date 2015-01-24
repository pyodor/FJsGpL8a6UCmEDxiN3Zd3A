var AftershipChallenge = require('./lib/aftership_challenge');
var challenge = new AftershipChallenge('a6403a2b-af21-47c5-aab5-a2420d20bbec');
var jobs = {
    "from": "HKD",
    "to": "USD"
};

var try_limit = 10;
var delay_fail = 3;
var delay_success = 60;
var number_of_try = 1;
var fail_time_id, success_time_id;

var work = function() {
    console.log('start work...')
    console.log('number of try ' + number_of_try);
    if(fail_time_id) clearTimeout(fail_time_id);
    if(success_time_id) clearTimeout(success_time_id);

    if(number_of_try <= try_limit) {
        challenge.jobSeed(jobs);
        challenge.jobConsume();
    }
    else {
        challenge.stop();
        console.log('try limit reached, stopping...')
    }
    number_of_try += 1;
}

challenge.on('success', function(info) {
    console.log(info);
    if('full success' === info) {
        console.info('delay success for ' + delay_success + ' seconds')
        success_time_id = setTimeout(function() {
            work();
        }, delay_success*1000);
    }
});

challenge.on('fail', function(err) {
    //console.log(err);
    console.info('delay fail for ' + delay_fail + ' seconds')
    fail_time_id = setTimeout(function() {
        work();
    }, delay_fail*1000);
});

work();
