'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const async = require('async');
const _ = require('lodash');
const program = require('commander');
const Downloader = require('mt-files-downloader');
const downloader = new Downloader();

program.version('0.0.0')
    .option('-s, --source <n>', 'Source folder ID.')
    .option('-d, --destination <string>', 'Destination directory')
    .parse(process.argv);



const log = require('./util/log');
const Client = require('./lib/Client');

const client = new Client("ECGUYX6W");

function fetchList(folder, root, done) {
    let filesToDownload = [];
    client.file.list({parent_id: folder.id}, function(err, results) {
        if(typeof root === 'function') {
            done = root;
        }

        if(err) done(err);

        let pending = results.files.length;

        if(!pending) {
            done();
        }

        if(!_.isString(root)) {
            root = results.parent.name;
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
    const saveDir = program.destination + '/' + task.path;

    mkdirp(saveDir, function(err) {
        if(err) throw err;

        const destination = saveDir + '/' + task.file.name;

        fs.stat(destination, function(err, stat) {
            if((err && err.code === 'ENOENT') || stat.size !== task.file.size) {
                const download = client.file.download({file_id: task.file.id});

                download.on('response', (res) => {
                    if(res.statusCode === 302) {
                        const source = _.get(res, 'headers.location');
                        
                        if(source) {
                            const downloadOptions = {
                                threadsCount: 5
                            };

                            const download = downloader.download(source, destination, downloadOptions);

                            download.on('end', cb);
                            download.setOptions(downloadOptions);

                            let timer = setInterval(()=>{
                                if(download.status === 1) {
                                    let stats = download.getStats();

                                    log.info(_.trunc(task.file.name, 50) + ' %s %s\% ETA: %s',
                                        Downloader.Formatters.speed(stats.present.speed),
                                        stats.total.completed,
                                        Downloader.Formatters.remainingTime(stats.future.eta));
                                } else if (download.status === -1 ||
                                    download.status === 3 ||
                                    download.status === -3) {

                                    clearInterval(timer);
                                }
                            }, 3000);

                            download.start();
                        }
                    }
                });
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

    if(err) {
        throw err;
    }

    log.info('Sync job triggered');

    if(_.isArray(results) && results.length > 0) {
        results.forEach((res) => q.push(res));
        q.process();
    } else {
        log.info('Nothing new ... waiting 3 sec before trying again.');
        setTimeout(()=>fetchList({id: program.source}, done), 3000);
    }
};

q.drain = ()=>setTimeout(()=>fetchList({id: program.source}, done), 3000);

fetchList({id: program.source}, done);
