'use strict';

const _ = require('lodash');
const moment = require('moment');

let stats = [];

function computeStats(task) {
    let thisStats = {};
    _.extend(thisStats, task);
    stats.push(thisStats);

    return event => {
        switch (event.event) {
            case 'INIT':
                thisStats.active = true;
                thisStats.startTime = Math.floor(Date.now() / 1000);
                break;

            case 'DATA':
                const offsets = event.message.offsets;
                const threads = event.message.threads;

                thisStats.totalBytes = event.message.totalBytes;
                thisStats.bytes = _.sum(_.map(offsets, (o, i) => o - threads[i][0]));

                if (_.isNaN(thisStats.bytesPrev) || !thisStats.bytesPrev) {
                    thisStats.bytesPrev = thisStats.bytes;
                }

                const currentTime = Math.floor(Date.now() / 1000) - thisStats.startTime;
                thisStats.speed = (thisStats.bytes - thisStats.bytesPrev) / currentTime;
                break;

            case 'TRUNCATE':
                thisStats.active = false;
                break;
        }
    };
}

const Formatters = {
    speed: speed => {
        let str;
        let formattedSpeed = speed * 8;
        if (formattedSpeed > 1024 * 1024) {
            str = Math.floor(formattedSpeed * 10 / (1024 * 1024)) / 10 + ' Mbps';
        } else if (formattedSpeed > 1024) {
            str = Math.floor(formattedSpeed * 10 / 1024) / 10 + ' Kbps';
        } else {
            str = Math.floor(formattedSpeed) + ' bps';
        }
        return String(str);
    },

    size: size => {
        if (size > Math.pow(1024, 3)) {
            return (Math.round(100 * size / Math.pow(1024, 3)) / 100) + ' GB';
        } else if (size > Math.pow(1024, 2)) {
            return Math.floor(size / Math.pow(1024, 2)) + ' MB';
        } else if (size > 1024) {
            return Math.floor(size / 1024) + ' KB';
        }

        return Math.floor(size) + ' B';
    },

    remainingTime: seconds => moment.duration(seconds, 'seconds').humanize()
};


module.exports = {
    computeStats,
    stats,
    formatters: Formatters
};
