const { autoUpdater } = require('electron-updater');
const { logger } = require('./logger.es6');
const { settings } = require('./settings.es6');

// eslint-disable-next-line func-names
autoUpdater.checkForUpdatesAndNotify = function () {
  if (!this.app.isPackaged) {
    logger.info('Skip checkForUpdatesAndNotify because application is not packed');

    return Promise.resolve(null);
  }

  const checkForUpdatesPromise = this.checkForUpdates();
  checkForUpdatesPromise.then(it => {
    const { downloadPromise } = it;

    if (downloadPromise === null) {
      const { debug } = this.logger;
      if (debug !== null) {
        debug('checkForUpdatesAndNotify called, downloadPromise is null');
      }
    }
  }).catch(() => {
    logger.error('suppress checking update error');
  })

  return checkForUpdatesPromise;
}.bind(autoUpdater)

autoUpdater.on('checking-for-update', () => {
  logger.verbose('checking for update');
})
autoUpdater.on('update-not-available', () => {
  logger.verbose('update not available');
})
autoUpdater.on('update-available', () => {
  logger.warn('update available');
})
autoUpdater.on('download-progress', () => {
  logger.warn('downloading');
})
autoUpdater.on('update-downloaded', () => {
  logger.warn('update downloaded');
})
autoUpdater.on('error', (event, error) => {
  logger.error('update error', error);
})

async function checkNewVersion() {
  const checkInterval = 60 * 1000;

  autoUpdater.logger = logger;

  if (settings.get('big_heart') === true) {
    logger.warn('Beloved BETA Assistant FOUND');

    autoUpdater.channel = 'beta';
  } else {
    autoUpdater.channel = 'latest';
  }

  await autoUpdater.checkForUpdatesAndNotify();

  setInterval(async () => {
    logger.warn('checking new version');
    await autoUpdater.checkForUpdatesAndNotify();
  }, checkInterval);
}

exports.checkNewVersion = checkNewVersion;
