'use strict';

const _ = require('lodash');
const BBPromise = require('bluebird');
const fs = require('fs');
const path = require('path');

const computeStats = require('./computeStats').computeStats;

BBPromise.promisifyAll(fs);
const mkdirp = BBPromise.promisify(require('mkdirp'));

const log = require('./log');

function getDownloadSourceUrl(client, file_id) {
    const downloadRequest = client.file.download({file_id});

    return new BBPromise((resolve, reject) => {
        const downloadRequestTimeout =
            setTimeout(() => reject(new Error('Server timeout')), 5000);

        downloadRequest.on('response', res => {
            clearTimeout(downloadRequestTimeout);

            if(res.statusCode !== 302) {
                reject(new Error('Non OK response [' + res.statusCode + ']'));
            }

            const source = _.get(res, 'headers.location');

            if(!source || _.isEmpty(source)) {
                reject(new Error('Could not get source url.'));
            }

            resolve(source);
        });
    });
}

function* shouldResume(filePath) {
    try {
        return Boolean(yield fs.statAsync(filePath));
    } catch(err) {
        return false;
    }
}

module.exports = function(client, destination, downloader) {
    return BBPromise.coroutine(function* (task, cb) {
        if(!task) {
            return cb();
        }

        const saveDir = path.join(destination, task.path);

        yield mkdirp(saveDir);

        const destinationFileName = path.join(saveDir, task.file.name);
        const destinationResume = destinationFileName + '.mtd';

        try {
            const destinationStat = yield fs.statAsync(destinationFileName);

            if(destinationStat.size === task.file.size) {
                log.info('File exists. Skipping [%s]', task.file.name);
                return cb();
            }
        } catch(err) {
            if(err.code !== 'ENOENT') {
                return cb(err);
            }
        }

        let source;
        try {
            source = yield getDownloadSourceUrl(client, task.file.id);
        } catch(err) {
            return cb(err);
        }

        let download;

        const resume = yield* shouldResume(destinationResume);
        let start;

        if(resume) {
            log.info('Resuming [%s]...', _.truncate(task.file.name, 50));
            const trimmedPath =  _.trimEnd(destinationResume, '.mtd');
            download = downloader({path: trimmedPath, url: source, range: 5});
            start = () => download.download().toPromise();
        } else {
            download = downloader({path: destinationFileName, url: source, range: 5});
            start = () => download.start().toPromise();
        }

        download.stats.subscribe(computeStats(task));

        try {
            yield start();
        } catch (err) {
            return cb(err);
        }

        cb();
    });
};
