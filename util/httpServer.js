'use strict';

const http = require('http');
const path = require('path');
const _ = require('lodash');
const computeStats = require('./computeStats');

const log = require('./log');

module.exports = function(downloader, port) {

    const server = http.createServer(function(request, response) {
        let downloading = '';

        if(!_.isEmpty(computeStats.stats)) {
            downloading = `# ${path.basename(computeStats.stats.file.name)}` +
                `\n\tSpeed: ${computeStats.formatters.speed(computeStats.stats.speed || 0)}` +
                `\n\tDone: ${Math.round(100 * computeStats.stats.bytes / computeStats.stats.totalBytes || 0)}%` +
                `\n\tETA: ${computeStats.formatters.remainingTime((computeStats.stats.totalBytes - computeStats.stats.bytes) / computeStats.stats.speed)}\n\n`;
        } else {
            downloading = 'Idling...';
        }
        
        response.end(downloading);
    });

    return () => {
        return server.listen(port || 3000, function(){
            //Callback triggered when server is successfully listening. Hurray!
            log.warn("Server listening on: http://localhost:%s", port);
        });
    };

};
