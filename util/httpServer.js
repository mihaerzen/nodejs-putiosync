'use strict';

const http = require('http');
const path = require('path');
const Downloader = require('mt-files-downloader');

const log = require('./log');

module.exports = function(downloader, port) {

    const server = http.createServer(function(request, response) {
        let downloads = downloader.getDownloads();

        if(downloads.length === 0) {
            return response.end('Idling...');
        }

        let finished = [];
        let downloading = '';

        downloads.forEach((download) => {
            switch(download.status) {
                case 1:
                    downloading = `# ${path.basename(download.filePath)}` +
                        `\n\tSpeed: ${Downloader.Formatters.speed(download.stats.present.speed)}` +
                        `\n\tDone: ${download.stats.total.completed}%` +
                        `\n\tETA: ${Downloader.Formatters.remainingTime(download.stats.future.eta)}\n\n`;
                    break;
                case 3:
                    finished.push(`#${path.basename(download.filePath)}`);
                    break;
            }
        });

        response.end(downloading + finished.join('\n'));
    });

    return () => {
        return server.listen(port, function(){
            //Callback triggered when server is successfully listening. Hurray!
            log.warn("Server listening on: http://localhost:%s", port);
        });
    };

};
