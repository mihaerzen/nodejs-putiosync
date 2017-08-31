const http = require('http');
const path = require('path');
const _ = require('lodash');
const computeStats = require('./computeStats');

const log = require('./log');

module.exports = function httpServer(downloader, port) {
  const server = http.createServer((request, response) => {
    let downloading = '';
    const stats = _.cloneDeep(computeStats.stats);
    const current = _.isArray(stats) && stats.pop();

    const done = current && Math.round(100 * current.bytes / current.totalBytes || 0);

    if (current && current.active) {
      downloading = `# ${path.basename(current.file.name)}` +
        `\n\tSpeed: ${computeStats.formatters.speed(current.speed || 0)}` +
        `\n\tDone: ${computeStats.formatters.size(current.bytes)} (${done}%)` +
        `\n\tETA: ${computeStats.formatters.remainingTime(
          (current.totalBytes - current.bytes) / current.speed)}\n\n`;
    } else {
      downloading += 'Waiting...\n\n';
    }

    _.forEach(stats, (dw) => {
      downloading += `# ${path.basename(dw.file.name)} ${dw.totalBytes}\n`;
    });

    response.end(downloading);
  });

  return () => server.listen(port || 3000, () => {
    // Callback triggered when server is successfully listening. Hurray!
    log.warn('Server listening on: http://localhost:%s', port);
  });
};
