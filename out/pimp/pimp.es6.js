const url = require('url');
const PostOffice = require('../PostOffice.js');
const Postman = require('./Postman');
const Shop = require('../Shop');
const server = require('../server');
const logger = require('../logger');
const settings = require('../settings');
const customerService = require('../customerService');
const appEvents = require('../appEvents');

const postOffice = new PostOffice();
const qn = new server.QN();
const postman = new Postman(qn, postOffice, '帮您转接专员哦~');
const customerService = new customerService.CustomerService(qn, postman);

export const release = () => logger.info('releasing objects');

class Reporter {
  static step = 0;
  static ipc = webContents;
  updateUI(nick) {
    this.ipc.send(appEvents.G_UI_SHOP_UPDATE, {
      nick,
      isAdmin: false
    })
  }
}

export function hookup(mainWindow) {
  const webContents = mainWindow.webContents;
  // 主进程接收到渲染进程请求的退出事件
  electron.ipcMain.on(appEvents.APP_MAIN_QUIT, (event) => {
    electron.app.emit('window-all-closed');
  })
  // 主进程接收到渲染进程请求的视图切换事件
  electron.ipcMain.on(appEvents.MODE_MAIN_CHANGE, (event, { mode }) => {
    postman.changeMode(mode);
    webContents.send(appEvents.MODE_UI_CHANGE, {
      mode,
      flags: {
        enabled: true,
        supervised: false
      }
    })
  });

  postman.suitUp(customerService);
}