## Install packages

At the root directory

    npm install

## Run the worker

    node .
or

    node worker.js

This will spawn a number of workers according to number of your CPU

## Testing the worker

To test the worker, run the test script seeder.js on separate shell

    node seeder.js

## How it works

The seeder will push a payload to beanstalked, and will delay in 3 and 60 seconds every after fail and success respectively.
The worker will pull the payload and will do the work: (worker will also have delay of 3 and 60 seconds every after fail and success respectively).
The seeding will stop if it tries 10 times regardless if fail or success.
    
    1. Parse the payload (currency), it will scrape to xe.com's currency converter to check the current rate
    2. In case with multiple currency, it will asynchronously scrapes to xe.com's currency converter
    3. Upon every successful getting the exchange rate, it will be saved to mongodb
    4. Sample data saved to mongolab:
    {
        "_id": {
            "$oid": "54c3ca99854ae193fbc7be6d"
        },
        "from": "HKD",
        "to": "SGD",
        "created_at": "Sun Jan 25 2015 00:38:49 GMT+0800 (PHT)",
        "rate": "0.17",
        "__v": 0
    }


