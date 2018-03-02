#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')
    .option('-b, --blocks <n>', 'scan the supplied number of blocks', parseInt)
    .option('-t, --tip <n>', 'start from given block height', parseInt)
    .parse(process.argv);

var chainTip = null; // will default to "HEAD" of blockchain if not supplied
if (program.tip) chainTip = program.tip;

var blocks = 100; // will default to 100 blocks if not supplied
if (program.blocks) blocks = program.blocks;

if (chainTip) console.log('Starting process at Block ' + chainTip);
console.log('Scanning ' + blocks + ' blocks from starting point');

