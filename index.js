const log = require('./util/log');
const memwatch = require('memwatch-next');
const heapdump = require('heapdump');
const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const program = require('commander');
const recursive = require('recursive-readdir');
const path = require('path');
const mtd = require('mt-downloader');
const Client = require('putiosdk');

const { version } = require('./package.json');
const httpServer = require('./util/httpServer');
const fetchList = require('./util/fetchList');
const syncWorker = require('./util/syncWorker');

const memlog = log.child({ type: 'memwatch' });

memwatch.on('stats', (stats) => {
  memlog.warn('stats', stats);
});

memwatch.on('leak', (info) => {
  memlog.error('leak', info);
  heapdump.writeSnapshot(`./${Date.now()}.heapsnapshot`);
});

program.version(version)
  .option('--token <string>', 'Put.io token')
  .option('-s, --source <n>', 'Source folder ID.', val => val.split(','))
  .option('-d, --destination <string>', 'Destination directory')
  .option('-D, --delete', 'Delete file not found in put.io')
  .option('-p, --port [n]', 'Port to listen for http requests')
  .parse(process.argv);

const client = new Client(program.token);
const downloader = mtd.createDownload;

// Start the http server
const startServer = httpServer(program.port || 3000);

// Init the worker function
const worker = syncWorker(client, program.destination, downloader);

// Create an async queue
const q = async.queue(worker, 1);

const remove = (results, root) => {
  const rootDir = path.join(program.destination, root);

  log.warn('searching for obsolete files in %s', rootDir);

  recursive(rootDir, ['*.mtd'], (err, files) => {
    if (_.isArray(files) && files.length > 0) {
      files.map((file) => {
        const filePath = path.relative(program.destination, file);

        const isThere = _.chain(results).reject(_.isUndefined).find((res) => {
          try {
            const comparePath = _.trimStart(path.join(res.path, res.file.name), '/');
            return comparePath === filePath;
          } catch (e) {
            return log.error('error while removing', res, results, filePath);
          }
        }, 'file.name').value();

        if (!isThere) {
          log.warn('File removed from remote [%s] will be removed also locally!', file);
          fs.unlink(file);
        }

        return undefined;
      });
    }
  });
};

const scheduleRun = cb => setTimeout(() => fetchList(client, { id: program.source }, cb), 3000);

const done = (err, results, root) => {
  if (err) {
    log.error(err);
    scheduleRun(done);
  }

  log.info('Sync job triggered');

  if (program.delete === true) {
    remove(results, root);
  }

  if (_.isArray(results) && results.length > 0) {
    results.forEach(res => q.push(res, (error) => {
      if (error) log.error(error);
    }));
    q.process();
  } else {
    log.info('Nothing new ... waiting 3 sec before trying again.');
    scheduleRun(done);
  }
};

q.drain = () => setTimeout(
  () => fetchList(client, { id: program.source }, done),
  3000);

fetchList(client, { id: program.source }, (err, results, root) => {
  done(err, results, root);
});

startServer();

process.on('uncaughtException', (err) => {
  log.error(err);
});
