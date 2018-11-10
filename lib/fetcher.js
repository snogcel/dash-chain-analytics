"use strict";

const EventEmitter = require('events').EventEmitter;

var blockExplorer = require('./blockExplorer.js');
var async = require('async');

var getTxs = function(hash, done) {

    console.log("> fetching tx " + hash);

    blockExplorer.getTx(hash, function(err, res) {

        eventEmitter.emit('tx', {
            err: err,
            res: res
        });

        done();

    });
};

var getBlocks = function(start, done) {

    console.log("> fetching block " + start);

    blockExplorer.getBlockIndex(start, function(err, res) {

        blockExplorer.getBlock(res.blockHash, function(err, res) {

            eventEmitter.emit('block', {
                err: err,
                res: res
            });

            // Additional Actions
            if (typeof err !== 'undefined' && err) {

                done();

            } else {

                if (typeof res !== 'undefined' && res.tx) {

                    for (var i = 0; i < res.tx.length; i++) {
                        txQueue.push(res.tx[i]); // pull TXs from block
                    }

                }

                done();

            }

        });

    });

};

var txQueue = async.queue(getTxs, 100);
txQueue.drain = function() {

    // TODO - emit done?

    // TODO - database
    /*
    database.add('transaction', txStack, function(err, res) {
        console.log(res);
    });
    */
};

var blockQueue = async.queue(getBlocks, 10);
blockQueue.drain = function() {

    // TODO - emit done?

    // TODO - database
    /*
    database.add('block', blockStack, function(err, res) {
        console.log(res);
    });
    */
};

var eventEmitter = new EventEmitter;

module.exports = {
    blockQueue: blockQueue,
    txQueue: txQueue,
    eventEmitter: eventEmitter
};