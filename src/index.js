'use strict';

const program = require('commander');

const version = require('../package.json').version;

program.version(version)
    .option('--token <string>', 'Put.io token')
    .option('-s, --source <n>', 'Source folder ID.', val => val.split(','))
    .option('-d, --destination <string>', 'Destination directory')
    .option('-D, --delete', 'Delete file not found in put.io')
    .option('-p, --port [n]', 'Port to listen for http requests')
    .parse(process.argv);

require('./server');
