'use strict';

const http = require('http');
const path = require('path');
const Downloader = require('mt-files-downloader');

const log = require('./log');

module.exports = function(downloader, port) {

    const server = http.createServer(function(request, response) {
        let downloads = downloader.getDownloads();

        let results = '';

        downloads.forEach((download) => {
            results += '# ' + path.basename(download.filePath) + ' - ' +
                'Speed: ' + Downloader.Formatters.speed(download.stats.present.speed) + ' - ' +
                'Done: ' + download.stats.total.completed + '% - ' +
                'ETA ' + Downloader.Formatters.remainingTime(download.stats.future.eta) + '\n';
        });

        results = results || 'Idling...';

        response.end(results);
    });

    return () => {
        return server.listen(port, function(){
            //Callback triggered when server is successfully listening. Hurray!
            log.warn("Server listening on: http://localhost:%s", port);
        });
    };

};
