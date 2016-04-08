'use strict';

const _ = require('lodash');
const moment = require('moment');

let stats = {};

function computeStats(task) {
    _.extend(stats, task);

    return event => {
        switch(event.event) {
            case 'INIT':
                stats.startTime = Math.floor(Date.now() / 1000);
                break;

            case 'DATA':
                const offsets = event.message.offsets;
                const threads = event.message.threads;

                stats.totalBytes = event.message.totalBytes;
                stats.bytes = _.sum(_.map(offsets, (o, i) => o - threads[i][0]));

                if(_.isNaN(stats.bytesPrev) || !stats.bytesPrev) {
                    stats.bytesPrev = stats.bytes;
                }

                const currentTime = Math.floor(Date.now() / 1000) - stats.startTime;
                stats.speed = (stats.bytes - stats.bytesPrev) / currentTime;
                break;

            case 'TRUNCATE':
                stats = {};
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
