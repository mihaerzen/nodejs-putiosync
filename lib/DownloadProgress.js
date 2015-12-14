'use strict';

const fs = require('fs');
const progress = require('progress-stream');
const ProgressBar = require('progress');

const DownloadProgress = function (file) {
    this.file = file;

    this.bar = new ProgressBar('  downloading ' + file.name + ' [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: this.file.size
    });
};

module.exports = DownloadProgress;

DownloadProgress.prototype = {
    get progressStream() {
        const stream = progress({
            length: this.file.size,
            time: 100
        });

        let transferred = 0;
        stream.on('progress', (info) => {
            this.bar.tick(info.transferred - transferred);
            transferred = info.transferred;
        });

        return stream;
    }
};
