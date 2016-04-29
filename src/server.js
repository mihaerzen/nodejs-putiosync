'use strict';
var log = require('./util/log');

var _ = require('lodash');
var fs = require('fs');
var async = require('async');
var program = require('commander');
var recursive = require('recursive-readdir');
var path = require('path');
var mtd = require('mt-downloader');

const Client = require('putiosdk');
const client = new Client(program.token);
const downloader = mtd.createDownload;

// Start the http server
const startServer = require('./util/httpServer')(program.port || 3000);


const fetchList = require('./util/fetchList');

// Init the worker function
const worker = require('./util/syncWorker')(client, program.destination, downloader);

// Create an async queue
const q = async.queue(worker, 1);

const remove = (results, root) => {
    const rootDir = path.join(program.destination, root);

    log.warn('searching for obsolete files in %s', rootDir);

    recursive(rootDir, ['*.mtd'], function (err, files) {
        if (_.isArray(files) && files.length > 0) {
            files.map(file => {
                let filePath = path.relative(program.destination, file);

                let isThere = _.chain(results).reject(_.isUndefined).find(res => {
                    try {
                        const comparePath = _.trimStart(path.join(res.path, res.file.name), '/');
                        return comparePath === filePath;
                    } catch (e) {
                        return log.error('error while removing', res, results, filePath);
                    }
                }, 'file.name').value();

                if (!isThere) {
                    log.warn('File removed from remote [%s] will be removed also locally!', file);
                    fs.unlink(file);
                }
            });
        }
    });
};

const scheduleRun = function (cb) {
    return setTimeout( () => fetchList(client, {id: program.source}, cb), 3000);
};

const done = (err, results, root) => {
    if (err) {
        log.error(err);
        scheduleRun(done);
    }

    log.info('Sync job triggered');

    if (program.delete === true) {
        remove(results, root);
    }

    if (_.isArray(results) && results.length > 0) {
        results.forEach(res => q.push(res, taskErr => {
            if (taskErr) {
                log.error(taskErr);
            }
        }));
        q.process();
    } else {
        log.info('Nothing new ... waiting 3 sec before trying again.');
        scheduleRun(done);
    }
};

q.drain = () => setTimeout(
    () => fetchList(client, {id: program.source}, done),
    3000);

fetchList(client, {id: program.source}, (err, results, root) => {
    done(err, results, root);
});

startServer();

process.on('uncaughtException', function (err) {
    log.error(err);
});
