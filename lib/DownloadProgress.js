'use strict';

const _ = require('lodash');
const fs = require('fs');
const progress = require('progress-stream');
const log = require('../util/log');

const DownloadProgress = function (file) {
    this.file = file;
};

module.exports = DownloadProgress;

DownloadProgress.prototype = {
    get progressStream() {
        const stream = progress({
            length: this.file.size,
            time: 3000
        });

        stream.on('progress', (info) => {
            log.info(_.trunc(this.file.name, 50) + ' %skb/s %s\% ETA: %s',
                Math.round(info.speed / 1024), Math.round(info.percentage),
                String(info.eta).toHHMMSS());
        });

        return stream;
    }
};

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}