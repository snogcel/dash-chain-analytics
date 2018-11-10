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
const TX_QUEUE_LIMIT = 1;
const BLOCK_QUEUE_LIMIT = 1;
const HEARTBEAT_INTERVAL = 5;
const HEARTBEAT_REQUEST_DELAY = 10;

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

    // Data Interfaces
    let blockStack = [];
    let txStack = [];

    // Data Interface Status
    let status = {};

    // Public Interfaces
    this.parseBlockData = function(data) {

        const err = data.err;
        const res = data.res;

        if (typeof err !== 'undefined' && err) {
            let status = this.setStatus('block', {
                lastSuccess: false,
                res: err,
                time: Math.floor(Date.now() / 1000)
            });

            // TODO - Handle Error
            console.log("> error:", err);

            return status.lastSuccess;
        }

        // Update Status
        let status = this.setStatus('block', {
            lastSuccess: typeof res !== 'undefined' || res,
            res: res,
            time: Math.floor(Date.now() / 1000)
        });

        // Push to Block Stack
        if (status.lastSuccess) blockStack.push(data);

        // Return Status
        return status.lastSuccess;
    };

    this.initStatus = function(dataObject) {

        // TODO - pull from config and finalize against spec
        var configData = {
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

        for (let i = 0; i < configData.platforms.length; i++) {
            status[configData.platforms[i].name] = configData.platforms[i].statusFields;
        }

    };

    this.setStatus = function(name, data) {
        // TODO - validate data?
        status[name] = data;

        return status[name];
    };

    this.getStatus = function(name) {
        return status[name]
    };

    this.parseTxData = function(data) {

        const err = data.err;
        const res = data.res;
        
        if (typeof err !== 'undefined' && err) {
            let status = this.setStatus('tx', {
                lastSuccess: false,
                res: err,
                time: Math.floor(Date.now() / 1000)
            });

            // TODO - Handle Error
            console.log("> error:", err);

            return status.lastSuccess;
        }

        // Update Status
        let status = this.setStatus('tx', {
            lastSuccess: typeof res !== 'undefined' || res,
            res: res,
            time: Math.floor(Date.now() / 1000)
        });

        // Push to TX Stack
        if (status.lastSuccess) txStack.push(data);

        // Return Status
        return status.lastSuccess;
    };

    this.getTxStackLength = function() {
        return txStack.length;
    };

    this.shiftTxStack = function() {
        return txStack.shift();
    };

    this.getBlockStackLength = function() {
        return blockStack.length;
    };

    this.shiftBlockStack = function() {
        return blockStack.shift();
    };

    this.locked = false;

    this.initStatus(null);
}

DataLogic.prototype.txEventHandler = function(data) {

    const lastStatus = this.parseTxData(data);

    if (lastStatus) {
        console.log('> Request Succeeded (writing queue: ' + this.getTxStackLength() + ')');

        console.log(this.getStatus('tx'));

        if (this.getTxStackLength() > TX_QUEUE_LIMIT) {
            let stack = [];

            for (var i = 0; i < TX_QUEUE_LIMIT; i++) {
                stack.push(this.shiftTxStack());
            }

            // TODO - Write to Database

            // console.log(stack);

        }

    } else {
        console.log("> Request Failed at:", Math.floor(Date.now() / 1000));


    }

};

DataLogic.prototype.blockEventHandler = function(data) {

    const lastStatus = this.parseBlockData(data);

    if (lastStatus) {
        console.log('> Request Succeeded (writing queue: ' + this.getBlockStackLength() + ')');

        // Do we need a stack here?

        if (this.getBlockStackLength() > BLOCK_QUEUE_LIMIT) {
            let stack = [];

            for (var i = 0; i < BLOCK_QUEUE_LIMIT; i++) {
                stack.push(this.shiftBlockStack());
            }

            // TODO - Write to Database

        }

    } else {
        console.log("> Request Failed at:", Math.floor(Date.now() / 1000));


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

            this.blockQueue.push(700007);

        }

        console.log('> heartbeat triggered, last txTime: ' + txStatus.time  + ' (writing queue: ' + this.getTxStackLength() + ')');
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

        // TODO - test bad request
        dataLogic.blockQueue.push('700007');

    } else {

        console.log("Error: please provide start and end parameter.")

    }

}
