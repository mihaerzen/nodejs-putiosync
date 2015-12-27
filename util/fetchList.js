'use strict';

const _ = require('lodash');

module.exports = function fetchList (client, folder, root, done) {
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
                fetchList(client, file, root + '/' + file.name, function(err, res) {
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
};
