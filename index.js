#!/usr/bin/env node

const DataFetcher = require('./lib/fetcher.js');

var program = require('commander');

program
    .version('0.1.0')
    .option('-s, --start <n>', 'start scanning at given block height', parseInt)
    .option('-e, --end <n>', 'stop scanning at given block height', parseInt)
    .option('-t, --test', 'test mode')
    .parse(process.argv);

var start, end;

// Global Variables
const HEARTBEAT_INTERVAL = 2;
const HEARTBEAT_REQUEST_DELAY = 5;

const configData = {
    platforms: [{
        name: "block",
        statusFields: {
            lastSuccess: true,
            res: null,
            time: 0
        }
    }, {
        name: "tx",
        statusFields: {
            lastSuccess: true,
            res: null,
            time: 0
        }
    }]
};

function DataLogic() {
    const self = this;

    // Data Fetching Queues
    this.blockQueue = DataFetcher.blockQueue;
    this.txQueue = DataFetcher.txQueue;
    this.locked = true;

    // Event Interfaces
    this.eventEmitter = DataFetcher.eventEmitter;
    this.eventEmitter.on('tx', function(data) { self.txEventHandler(data) });
    this.eventEmitter.on('block', function(data) { self.blockEventHandler(data) });
    this.eventEmitter.on('heartbeat', function(data) { self.heartbeatHandler(data) });

    // Begin Heartbeat
    setInterval(() => {
       this.eventEmitter.emit('heartbeat', HEARTBEAT_REQUEST_DELAY);
    }, HEARTBEAT_INTERVAL*1000);

    // Status Interface
    let status = {};
    let initStatus = function(platforms) {
        for (let i = 0; i < platforms.length; i++) {
            status[platforms[i].name] = platforms[i].statusFields;
        }
    };

    // Public Interfaces
    this.setStatus = function(name, data) {
        status[name] = data;
        return status[name];
    };

    this.getStatus = function(name) {
        return status[name]
    };

    // TODO - Fetch Config
    initStatus(configData.platforms);

    this.locked = false;
}

DataLogic.prototype.parseTxData = function(data) {

    let validator = false;

    // Soft Error Handler
    if (typeof data.err !== 'undefined' && data.err) {
        return this.setStatus('tx', {
            valid: validator,
            res: data.err,
            time: Math.floor(Date.now() / 1000)
        });
    }

    if (typeof data.res !== 'undefined' && data.res) {

        // Assume Valid Data
        validator = true;

        // Parsing Logic


        // Return status
        return this.setStatus('tx', {
            valid: validator,
            res: data.res,
            time: Math.floor(Date.now() / 1000)
        });

    } else {

        // Hard Error Handler
        throw new Error(data);

    }
};

DataLogic.prototype.txEventHandler = function(data) {

    const result = this.parseTxData(data);

    if (result.valid) {
        console.log('> TX Request Succeeded at', result.time);

        // TODO - write to DB

    } else {
        console.log("> Request Failed at:", Math.floor(Date.now() / 1000));
        throw new Error(result.err);

    }

};

DataLogic.prototype.parseBlockData = function(data) {
    let validator = false;

    // Soft Error Handler
    if (typeof data.err !== 'undefined' && data.err) {
        return this.setStatus('block', {
            valid: validator,
            res: data.err,
            time: Math.floor(Date.now() / 1000)
        });
    }

    if (typeof data.res !== 'undefined' && data.res) {

        // Assume Valid Data
        validator = true;

        // Parsing Logic
        if (data.res === 'Not found') {
            validator = false;
        }

        // Return status
        return this.setStatus('block', {
            valid: validator,
            res: data.res,
            time: Math.floor(Date.now() / 1000)
        });

    } else {

        // Hard Error Handler
        throw new Error(data);

    }
};

DataLogic.prototype.blockEventHandler = function(data) {

    const result = this.parseBlockData(data);

    if (result.valid) {
        console.log('> Block Request Succeeded at', result.time);

        // TODO - write to DB

    } else {
        console.log("> Request Failed at:", Math.floor(Date.now() / 1000));
        throw new Error(result.err);
    }

};

DataLogic.prototype.heartbeatHandler = function(queryRate) {

    const currentTime = Math.floor(Date.now() / 1000);

    // TODO - fetch config

    let txStatus = this.getStatus('tx');
    let blockStatus = this.getStatus('block');

    if (!this.locked) {

        if ((currentTime - txStatus.time) > queryRate) {

            // TODO - do stuff

            // this.txQueue.push(700007);

        }

        if ((currentTime - blockStatus.time) > queryRate) {

            // TODO - do stuff

            // TODO - query database for most recent data
            let status = dataLogic.getStatus('block');
            this.blockQueue.push(parseInt(status.res.height) + 1);


        }

        console.log('> heartbeat triggered, last txTime: ' + txStatus.time);
    }

};

// Begin Program

let dataLogic = new DataLogic();

if (program.start && program.end) {
    start = program.start;
    end = program.end;

    for (start; start < end; start++) {

        dataLogic.blockQueue.push(start);

    }

} else {

    if (program.test) {

        console.log('-- test mode --');

        dataLogic.blockQueue.push(700007);

    } else {

        console.log("Error: please provide start and end parameter.")

    }

}
