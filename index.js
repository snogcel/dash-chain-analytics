#!/usr/bin/env node

var blockExplorer = require('./lib/blockExplorer.js');
var database = require('./lib/database.js');
var async = require('async');

var program = require('commander');

program
    .version('0.1.0')
    .option('-s, --start <n>', 'start scanning at given block height', parseInt)
    .option('-e, --end <n>', 'stop scanning at given block height', parseInt)
    .parse(process.argv);

var start, end;
var blockStack = [];
var txStack = [];

// TODO - move to proper function

var getTxs = function(hash, done) {
    console.log("> fetching tx " + hash);

    setTimeout(
        function() {

            blockExplorer.getTx(hash, function(err, res) {

                var privateSend = false;

                if (typeof res !== 'undefined' && res) {

                    // if TX has > 1 input and 0 fee we assume it's privateSend
                    if (res.vin.length > 1 && res.fees === 0) {
                        privateSend = true;
                    }

                    var data = {
                        height: res.blockheight,
                        txhash: res.txid,
                        inputs: res.vin.length,
                        fee: res.fees,
                        txlock: res.txlock,
                        privatesend: privateSend
                    };

                    if (res.vin.length > 1) { // ignore mining transaction-only blocks

                        txStack.push(data);

                    }

                }

                done();


            });

        }, Math.floor((Math.random() * 2000) + 1000));
};

var getBlocks = function(start, done) {
    console.log("> fetching block " + start);
    setTimeout(
        function() {

            blockExplorer.getBlockIndex(start, function(err, res) {

                blockExplorer.getBlock(res.blockHash, function(err, res) {

                    for (var i = 0; i < res.tx.length; i++) {

                        txQueue.push(res.tx[i]); // pull TXs from block

                    }

                    var data = {
                        height: res.height,
                        difficulty: res.difficulty,
                        time: res.time
                    };

                    blockStack.push(data);

                    done();

                });

            });

        }, Math.floor((Math.random() * 2000) + 1000));
};

var blockQueue = async.queue(getBlocks, 5);
blockQueue.drain = function() {
    database.add('block', blockStack, function(err, res) {
        console.log(res);
    });
};

var txQueue = async.queue(getTxs, 5);
txQueue.drain = function() {
    database.add('transaction', txStack, function(err, res) {
        console.log(res);
    });
};

if (program.start && program.end) {
    start = program.start;
    end = program.end;

    for (start; start < end; start++) {

        blockQueue.push(start);

    }

} else {
    console.log("Error: please provide start and end parameter.")
}
