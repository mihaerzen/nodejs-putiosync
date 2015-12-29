'use strict';

const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const program = require('commander');
const recursive = require('recursive-readdir');
const path = require('path');
const Downloader = require('mt-files-downloader');
const downloader = new Downloader();

program.version('0.0.0')
    .option('--token <string>', 'Put.io token')
    .option('-s, --source <n>', 'Source folder ID.')
    .option('-d, --destination <string>', 'Destination directory')
    .option('-D, --delete', 'Delete file not found in put.io')
    .option('-p, --port [n]', 'Port to listen for http requests')
    .parse(process.argv);

const log = require('./util/log');

const Client = require('putiosdk');
const client = new Client(program.token);

// Start the http server
const startServer = require('./util/httpServer')(downloader, program.port || 3000);


const fetchList = require('./util/fetchList');

// Init the worker function
const worker = require('./util/syncWorker')(client, program.destination, downloader);

// Create an async queue
const q = async.queue(worker, 1);

const remove = (results, root) => {
    const rootDir = path.join(program.destination, root);

    log.warn('searching for obsolete files in %s', rootDir);

    recursive(rootDir, ['*.mtd'], function(err, files) {
        if(_.isArray(files) && files.length > 0) {
            files.map((file) => {
                let filePath = path.relative(program.destination, file);

                let isThere = _.result(_.find(results, (res) => {
                    try {
                        return path.join(res.path, res.file.name) === filePath;
                    } catch (e) {
                        log.error('error while removing', res, results, filePath);
                        throw e;
                    }

                }), 'file.name');

                if(!isThere) {
                    log.warn('File removed from remote [%s] will be removed also locally!', file);
                    fs.unlink(file);
                }
            });
        }
    });
};

const done = (err, results, root) => {
    if(err) {
        throw err;
    }

    if(err) {
        throw err;
    }

    log.info('Sync job triggered');

    if(program.delete === true) {
        remove(results, root);
    }

    if(_.isArray(results) && results.length > 0) {
        results.forEach((res) => q.push(res));
        q.process();
    } else {
        log.info('Nothing new ... waiting 3 sec before trying again.');
        setTimeout(()=>fetchList(client, {id: program.source}, done), 3000);
    }
};

q.drain = ()=>setTimeout(
    ()=>fetchList(client, {id: program.source}, done),
    3000);

fetchList(client, {id: program.source}, (err, results, root) => {
    done(err, results, root);
    startServer();
});
