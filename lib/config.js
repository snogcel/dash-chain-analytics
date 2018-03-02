"use strict";

var config = {
    "network": "mainnet",
    "insight_api": "https://insight.dashevo.org/",
    "insight_api_testnet": "http://testnet-insight.dashevo.org/",
    "api_prefix": "insight-api-dash",
    "database": {
        "block": {
            filename: "blocks.csv",
            schema: ["height","difficulty","time"]
        },
        "transaction": {
            filename: "transaction.csv",
            schema: ["height","txhash","inputs","fee","txlock","privatesend"]
        }
    }
};

module.exports = {
    config: config
};
