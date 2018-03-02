"use strict";

var async = require("async");
var await = require("await");
var csvdb = require('csv-database');
var config = require('./config.js').config;

async function add(table, data, cb) {
    var filename = config.database[table].filename;
    var schema = config.database[table].schema;

    const db = await csvdb(filename, schema);
    var result = await db.add(data);

    cb(null, result);
}

async function get(table, query, cb) {
    var filename = config.database[table].filename;
    var schema = config.database[table].schema;

    const db = await csvdb(filename, schema);
    var result = await db.get(query);

    cb(null, result);
}

async function edit(table, query, data, cb) {
    var filename = config.database[table].filename;
    var schema = config.database[table].schema;

    const db = await csvdb(filename, schema);
    var result = await db.edit(query, data);

    cb(null, result);
}

module.exports = {
    add: add,
    get: get,
    edit: edit
};
