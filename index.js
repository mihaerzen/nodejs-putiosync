'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const async = require('async');
const _ = require('lodash');
const program = require('commander');
const recursive = require('recursive-readdir');
const path = require('path');
const http = require('http');
const Downloader = require('mt-files-downloader');
const downloader = new Downloader();

program.version('0.0.0')
    .option('--token <string>', 'Put.io token')
    .option('-s, --source <n>', 'Source folder ID.')
    .option('-d, --destination <string>', 'Destination directory')
    .option('-D, --delete', 'Delete file not found in put.io')
    .parse(process.argv);

const log = require('./util/log');
const Client = require('./lib/Client');

const client = new Client(program.token);

const server = http.createServer(function(request, response) {
    let downloads = downloader.getDownloads();

    let results = '';

    downloads.forEach((download) => {
        results += '# ' + path.basename(download.filePath) + ' - ' +
            'Speed: ' + Downloader.Formatters.speed(download.stats.present.speed) + ' - ' +
            'Done: ' + download.stats.total.completed + '% - ' +
            'ETA ' + Downloader.Formatters.remainingTime(download.stats.future.eta) + '\n';
    });

    response.end(results);
});

server.listen(3000, function(){
    //Callback triggered when server is successfully listening. Hurray!
    log.warn("Server listening on: http://localhost:%s", 3000);
});

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
                        done(null, filesToDownload, root);
                });
            } else {
                filesToDownload.push({
                    file: file,
                    path: root
                });
                if (!--pending)
                    done(null, filesToDownload, root);
            }
        });
    });
}

const worker = (task, cb) => {
    if(!task) {
        return cb();
    }

    const saveDir = program.destination + '/' + task.path;

    mkdirp(saveDir, function(err) {
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
                const download = client.file.download({file_id: task.file.id});

                download.on('response', (res) => {
                    if(res.statusCode === 302) {
                        const source = _.get(res, 'headers.location');
                        
                        if(source) {
                            const downloadOptions = {
                                threadsCount: 5
                            };

                            let download;

                            if(resume) {
                                log.info('Resuming [%s]...', _.trunc(task.file.name, 50));
                                download = downloader.resumeDownload(destinationResume, downloadOptions);
                            } else {
                                download = downloader.download(source, destination, downloadOptions);
                            }

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

const remove = (results, root) => {
    const rootDir = path.join(program.destination, root);

    recursive(rootDir, ['*.mtd'], function(err, files) {
        files.map((file) => {
            let basename = path.basename(file);

            let isThere = _.result(_.find(results, (res) => {
                try {
                    return res.file.name === basename;
                } catch (e) {
                    log.error('error while removing', res, results, basename);
                    throw e;
                }

            }), 'file.name');

            if(!isThere) {
                log.warn('File removed from remote [%s] will be removed also locally!', file);
                fs.unlink(file);
            }
        });
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
        log.info(`Looking for obsolete files in ${root}.`);
        remove(results, root);
    }

    if(_.isArray(results) && results.length > 0) {
        results.forEach((res) => q.push(res));
        q.process();
    } else {
        log.info('Nothing new ... waiting 3 sec before trying again.');
        setTimeout(()=>fetchList({id: program.source}, done), 3000);
    }
};

q.drain = ()=>setTimeout(()=>fetchList({id: program.source}, done), 3000);

fetchList({id: program.source}, (err, results, root) => {
    done(err, results, root);
});
