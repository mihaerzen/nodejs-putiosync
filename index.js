'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const async = require('async');
const _ = require('lodash');
const mtd = require('mt-downloader');

const log = require('./util/log');
const Client = require('./lib/Client');
const DownloadProgress = require('./lib/DownloadProgress');

const client = new Client("ECGUYX6W");

function fetchList(folder, root, done) {
    let filesToDownload = [];
    client.file.list({parent_id: folder.id}, function(err, results) {
        if(err) done(err);
        let pending = results.files.length;
        if(!pending) {
            done();
        }

        results.files.forEach((file) => {
            if(file.content_type === 'application/x-directory') {
                fetchList(file, root + '/' + file.name, function(err, res) {
                    if(err) done(err);
                    filesToDownload = filesToDownload.concat(res);
                    if (!--pending)
                        done(null, filesToDownload);
                });
            } else {
                filesToDownload.push({
                    file: file,
                    path: root
                });
                if (!--pending)
                    done(null, filesToDownload);
            }
        });
    });
}

const worker = (task, cb) => {
    const saveDir = './tmp/' + task.path + '/';

    mkdirp(saveDir, function(err) {
        if(err) throw err;

        const downloadLocation = saveDir + task.file.name;

        fs.stat(downloadLocation, function(err, stat) {
            if((err && err.code === 'ENOENT') || stat.size !== task.file.size) {
                const downloadProgress = new DownloadProgress(task.file);

                const download = client.file.download({file_id: task.file.id})
                    .pipe(downloadProgress.progressStream)
                    .pipe(fs.createWriteStream(downloadLocation));

                download.on('finish', cb);
            } else {
                log.info('File exists. Skipping [%s]', task.file.name);
                cb();
            }
        });
    });
};

const q = async.queue(worker, 1);

const done = (err, results) => {
    if(err) {
        throw err;
    }

    log.info('Sync job triggered');

    if(_.isArray(results) && results.length > 0) {
        results.forEach((res) => q.push(res));
    }
};

q.drain = () => {
    setInterval(fetchList({id: 326259327}, 'test', (err, results) => {
        if(err) {
            throw err;
        }

        done(err, results);
        q.process();
    }), 3000);
};

fetchList({id: 285681349}, 'TV', done);

//fetchList({id: 326259327}, 'test', done);

//client.file.get({file_id: 315148010}, (err, result) => {
//    if(err) {
//        throw err;
//    }
//    log.info("Downloading file %s", result.file.name, result);
//
//    const downloadProgress = new DownloadProgress(result.file);
//
//    client.file.download({file_id: result.file.id})
//        .pipe(downloadProgress.progressStream)
//        .pipe(fs.createWriteStream('./' + result.file.name));
//});