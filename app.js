'use strict';

const forever = require('forever');

const args = process.argv;

forever.start('./index.js', {args});
