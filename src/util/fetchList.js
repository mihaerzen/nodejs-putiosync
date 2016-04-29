'use strict';

const _ = require('lodash');
const async = require('async');
const Promise = require('bluebird');
const log = require('../util/log');

const clientListAsync = (client, parent_id) => new Promise((resolve, reject) => {
    client.file.list({parent_id}, function (err, results) {
        if (err) {
            return reject(err);
        }

        resolve(results);
    });
});

module.exports = function fetchList (client, folder, root, done) {
    if(typeof root === 'function') {
        done = root;
        root = '';
    }

    if(!_.isArray(folder.id)) {
        folder.id = [folder.id];
    }

    const resultsAsync = Promise.all(folder.id.map(id => clientListAsync(client, id)));

    resultsAsync.done(function(results) {
        const files = _.chain(results)
            .map(item => {
                return _.map(item.files, file => {
                    file.parent_name = root + '/' + item.parent.name;
                    return file;
                });
            })
            .flatten()
            .value();

        async.reduce(files, [], (filesToDownload, file, cb) => {
            log.debug('indexing...', `${file.parent_name}/${file.name}`);

            if(file.content_type === 'application/x-directory') {
                fetchList(client, file, file.parent_name, function(err, res) {
                    if(err) {
                        return cb(err);
                    }
                    filesToDownload = filesToDownload.concat(res);
                    cb(null, filesToDownload);
                });
            } else {
                filesToDownload.push({
                    file: file,
                    path: file.parent_name
                });
                cb(null, filesToDownload);
            }
        }, (err, filesToDownload) => {
            done(null, filesToDownload, root);
        });
    }, err => done(err));
};
