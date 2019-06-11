const { app, BrowserWindow, dialog } = require('electron');
const devtron = require('devtron');
const settings = require('./settings');
const pimp = require('./pimp');
const { logger } = require('./logger.es6');
const updater = require('./updater');
const QNHelper = require('./QNHelper');

let mainWindow = null;

process.on('exit', code => {
  logger.warn(`FILE OUT code=${code}`)
})

app.on('quit', (event, exitCode) => {
  logger.warn(`EVENT: ${JSON.stringify(event)}, CODE: ${exitCode}`)
})

process.on('uncaughtException', (err) => {
  logger.error('FILET OUT exception='.concat(err));
});
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection reason='.concat(reason, '}'));
});

app.on('quit', (event, exitCode) => {
  logger.warn('EVENT: '.concat(JSON.stringify(event), ' CODE: ').concat(exitCode, '}'));
});
app.on('window-all-closed', () => {
  pimp.release();
  app.quit();
})

app.on('ready', async () => {
  await QNHelper.startQNHelper();
  await updater.checkNewVersion();
  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    transparent: true,
    width: 300,
    height: 640,
    useContentSize: true,
    resizable: false,
  });
  mainWindow.loadURL(`file://${__dirname}/ui/index.html#?launch`);

  if (settings.isDev) {
    mainWindow.openDevTools();

    devtron.install();
  }

  mainWindow.webContents.once('did-finish-load', async () => {
    mainWindow.show();
    mainWindow.focus();
    try {
      const errMsg = await pimp.launch(mainWindow);

      if (errMsg !== null) {
        dialog.showErrorBox('限制登录', errMsg);
        app.emit('window-all-closed');
        return;
      }
      pimp.hookup(mainWindow);
    } catch (e) {
      logger.error(`launch error: ${e}`)
    }
  });

  mainWindow.on('closed', () => { mainWindow = null });
  mainWindow.setMenu(null);
})
