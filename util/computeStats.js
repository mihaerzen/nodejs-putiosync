'use strict';

const _ = require('lodash');
const moment = require('moment');

let stats = [];

function computeStats(task) {
    let thisStats = {};
    _.extend(thisStats, task);
    stats.push(thisStats);

    return event => {
        switch(event.event) {
            case 'INIT':
                thisStats.active = true;
                thisStats.startTime = Math.floor(Date.now() / 1000);
                break;

            case 'DATA':
                const offsets = event.message.offsets;
                const threads = event.message.threads;

                thisStats.totalBytes = event.message.totalBytes;
                thisStats.bytes = _.sum(_.map(offsets, (o, i) => o - threads[i][0]));

                if(_.isNaN(thisStats.bytesPrev) || !thisStats.bytesPrev) {
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
    speed: function(speed) {
        let str;
        speed *= 8;
        if (speed > 1024 * 1024) str = Math.floor(speed * 10 / (1024 * 1024)) / 10 + ' Mbps';
        else if (speed > 1024) str = Math.floor(speed * 10 / 1024) / 10 + ' Kbps';
        else str = Math.floor(speed) + ' bps';
        return str + '';
    },

    size: function(size) {
        if (size > Math.pow(1024, 3))
            return Math.floor(size / Math.pow(1024, 3)) + ' GB';
        else if (size > Math.pow(1024, 2))
            return Math.floor(size / Math.pow(1024, 2)) + ' MB';
        else if (size > 1024)
            return Math.floor(size / 1024) + ' KB';
        else
            return Math.floor(size) + ' B';
    },

    // elapsedTime: function(seconds) {
    //     return _floor(seconds) + 's';
    // },
    //
    remainingTime: function(seconds) {
        return moment.duration(seconds, 'seconds').humanize();
    }
};


module.exports = {
    computeStats,
    stats,
    formatters: Formatters
};
