"use strict";

const EventEmitter = require('events').EventEmitter;

var blockExplorer = require('./blockExplorer.js');
var async = require('async');

var getTxs = function(hash, done) {

    console.log("> fetching tx " + hash);

    blockExplorer.getTx(hash, function(err, res) {

        // TODO - remove error checking from here

        if (typeof res !== 'undefined' && res) {

            var data = {
                err: err,
                res: res
            };

            eventEmitter.emit('tx', data);

            done();

        } else {

            // TODO - error handling
            var data = {
                err: err,
                res: res
            };

            eventEmitter.emit('tx', data);

            done();

        }

    });
};

var getBlocks = function(start, done) {

    console.log("> fetching block " + start);

    blockExplorer.getBlockIndex(start, function(err, res) {

        blockExplorer.getBlock(res.blockHash, function(err, res) {

            // TODO - error checking

            for (var i = 0; i < res.tx.length; i++) {

                txQueue.push(res.tx[i]); // pull TXs from block

            }

            var data = {
                err: err,
                res: res
            };

            eventEmitter.emit('block', data);

            done();

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