"use strict";

var blockExplorer = require('./blockExplorer.js');
var async = require('async');

var blockStack = [];
var txStack = [];

var getTxs = function(hash, done) {

    console.log("> fetching tx " + hash);

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

            if (res.vin.length !== 'undefined') { // ignore mining transaction-only blocks

                txStack.push(data);

            }

            done();

        } else {

            done();

        }

    });
};

var getBlocks = function(start, done) {

    console.log("> fetching block " + start);

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

};

var txQueue = async.queue(getTxs, 100);
txQueue.drain = function() {

    console.log(txStack);

    // TODO - database
    /*
    database.add('transaction', txStack, function(err, res) {
        console.log(res);
    });
    */
};

var blockQueue = async.queue(getBlocks, 10);
blockQueue.drain = function() {

    console.log(blockStack);

    // TODO - database
    /*
    database.add('block', blockStack, function(err, res) {
        console.log(res);
    });
    */
};

module.exports = {
    blockQueue: blockQueue,
    txQueue: txQueue
};