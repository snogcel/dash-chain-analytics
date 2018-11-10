"use strict";

const async = require('async');
const EventEmitter = require('events').EventEmitter;
const blockExplorer = require('./blockExplorer.js');

const getTxs = function(hash, done) {
    console.log("> fetching tx " + hash);

    blockExplorer.getTx(hash, function(err, res) {
        eventEmitter.emit('tx', {
            err: err,
            res: res
        });
        done();
    });
};

const getBlocks = function(start, done) {
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

                    // Pull TXs from Block
                    for (var i = 0; i < res.tx.length; i++) {
                        txQueue.push(res.tx[i]); // pull TXs from block
                    }
                }
                done();
            }
        });
    });
};

const blockQueue = async.queue(getBlocks, 10);
blockQueue.drain = function() { };

const txQueue = async.queue(getTxs, 100);
txQueue.drain = function() { };

const eventEmitter = new EventEmitter;

module.exports = {
    blockQueue: blockQueue,
    txQueue: txQueue,
    eventEmitter: eventEmitter
};