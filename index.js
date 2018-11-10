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
    let blockStatus = {
        lastSuccess: true,
        res: null,
        time: 0
    };

    let txStatus = {
        lastSuccess: true,
        res: null,
        time: 0
    };

    // Public Interfaces
    this.parseBlockData = function(data) {

        const err = data.err;
        const res = data.res;

        if (typeof err !== 'undefined' && err) {
            blockStatus.lastSuccess = false;

            // TODO - Handle Error
            console.log("> error:", err);

            return blockStatus.lastSuccess;
        }

        blockStatus.lastSuccess = typeof res !== 'undefined' || res;
        blockStatus.res = res;
        blockStatus.time = Math.floor(Date.now() / 1000);

        // Push to Block Stack
        if (blockStatus.lastSuccess) blockStack.push(data);

        // Return Status
        return blockStatus.lastSuccess;
    };

    this.getBlockTime = function() {
        return blockStatus.time;
    };

    this.getBlockStatus = function() {
        return blockStatus.lastSuccess;
    };

    this.parseTxData = function(data) {

        const err = data.err;
        const res = data.res;
        
        if (typeof err !== 'undefined' && err) {
            txStatus.lastSuccess = false;

            // TODO - Handle Error
            console.log("> error:", err);

            return txStatus.lastSuccess;
        }

        // Update Status
        txStatus.lastSuccess = typeof res !== 'undefined' || res;
        txStatus.res = res;
        txStatus.time = Math.floor(Date.now() / 1000);

        // Push to TX Stack
        if (txStatus.lastSuccess) txStack.push(data);

        // Return Status
        return txStatus.lastSuccess;
    };

    this.getTxTime = function() {
        return txStatus.time;
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
}

DataLogic.prototype.txEventHandler = function(data) {

    const lastStatus = this.parseTxData(data);

    if (lastStatus) {
        console.log('> Request Succeeded at: ' + this.getTxTime() + ' (writing queue: ' + this.getTxStackLength() + ')');

        if (this.getTxStackLength() > TX_QUEUE_LIMIT) {
            let stack = [];

            for (var i = 0; i < TX_QUEUE_LIMIT; i++) {
                stack.push(this.shiftTxStack());
            }

            // TODO - Write to Database

            console.log(stack);

        }

    } else {
        console.log("> Request Failed at:", Math.floor(Date.now() / 1000));


    }

};

DataLogic.prototype.blockEventHandler = function(data) {

    const lastStatus = this.parseBlockData(data);

    if (lastStatus) {
        console.log('> Request Succeeded at: ' + this.getBlockTime() + ' (writing queue: ' + this.getBlockStackLength() + ')');

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

    if (!this.locked) {

        if ((currentTime - this.getTxTime()) > queryRate) {

            // TODO - do stuff

            // this.txQueue.push(700007);

        }

        if ((currentTime - this.getBlockTime()) > queryRate) {

            // TODO - do stuff

            // TODO - query database for most recent data

            this.blockQueue.push(700007);

        }

        console.log('> heartbeat triggered, last txTime: ' + this.getTxTime()  + ' (writing queue: ' + this.getTxStackLength() + ')');
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
