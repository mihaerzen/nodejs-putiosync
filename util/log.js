'use strict';

const bunyan = require('bunyan');

const log = bunyan.createLogger({name: 'putiojs'});

module.exports = log;