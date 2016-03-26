'use strict';

const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');
const Downloader = require('mt-files-downloader');

const log = require('./log');

module.exports = function(client, destination, downloader) {
    return (task, cb) => {
        if(!task) {
            return cb();
        }

        const saveDir = destination + '/' + task.path;

        mkdirp(saveDir, err => {
            if(err) throw err;

            const destination = saveDir + '/' + task.file.name;
            const destinationResume = destination + '.mtd';

            let resume = false;

            try {
                resume = fs.statSync(destinationResume);
            } catch(err) {
                //nothing to do
            }


            fs.stat(destination, function(err, stat) {
                if((err && err.code === 'ENOENT') || stat.size !== task.file.size) {
                    const d = client.file.download({file_id: task.file.id});

                    d.on('response', res => {
                        if(res.statusCode === 302) {
                            const source = _.get(res, 'headers.location');

                            if(source) {
                                const downloadOptions = {
                                    threadsCount: 5
                                };

                                let download;

                                if(resume) {
                                    log.info('Resuming [%s]...', _.truncate(task.file.name, 50));
                                    download = downloader.resumeDownload(destinationResume, downloadOptions);
                                } else {
                                    download = downloader.download(source, destination, downloadOptions);
                                }

                                download.on('end', () => cb());

                                download.on('error', err => {
                                    if(_.get(err,'error.message') === 'The .mtd file is corrupt. Start a new download.') {
                                        download.destroy();
                                        log.error('Could not resume download for [%s].', task.file.name);
                                    }

                                    cb(err.error);
                                });

                                download.setOptions(downloadOptions);

                                let timer = setInterval(() => {
                                    if(download.status === 1) {
                                        let stats = download.getStats();

                                        log.info(_.truncate(task.file.name, 50) + ' %s %s\% ETA: %s',
                                            Downloader.Formatters.speed(stats.present.speed),
                                            stats.total.completed,
                                            Downloader.Formatters.remainingTime(stats.future.eta));
                                    } else if (
                                        download.status === -1 ||
                                        download.status === 3 ||
                                        download.status === -3) {

                                        clearInterval(timer);
                                    }
                                }, 3000);

                                download.start();
                            }
                        } else {
                            log.warn('Non OK response [%s]', res.statusCode, task.file);
                            cb(new Error('Non OK response [' + res.statusCode + ']'));
                        }
                    });
                } else {
                    log.info('File exists. Skipping [%s]', task.file.name);
                    cb();
                }
            });
        });
    };
};
