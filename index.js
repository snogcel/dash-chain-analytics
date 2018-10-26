#!/usr/bin/env node

var blockExplorer = require('./lib/blockExplorer.js');
var DataFetcher = require('./lib/fetcher.js');

var database = require('./lib/database.js');
var async = require('async');

var program = require('commander');

program
    .version('0.1.0')
    .option('-s, --start <n>', 'start scanning at given block height', parseInt)
    .option('-e, --end <n>', 'stop scanning at given block height', parseInt)
    .option('-t, --test', 'test mode')
    .parse(process.argv);

var start, end;

if (program.start && program.end) {
    start = program.start;
    end = program.end;

    for (start; start < end; start++) {

        DataFetcher.blockQueue.push(start);

    }

} else {

    if (program.test) {

        console.log('-- test mode --');

        DataFetcher.blockQueue.push(700007);

    } else {

        console.log("Error: please provide start and end parameter.")

    }

}
