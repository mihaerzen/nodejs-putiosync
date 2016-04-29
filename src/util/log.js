'use strict';

const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'putiojs',
    level: 'debug'
});

module.exports = log;
