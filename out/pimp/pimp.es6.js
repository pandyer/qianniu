const { app, ipcMain } = require('electron');
const url = require('url');
const PostOffice = require('../postOffice.es6');
const Postman = require('./postman.es6');
const Shop = require('../Shop/index.es6');
const server = require('../server/index.es6');
const logger = require('../logger.es6');
const settings = require('../settings.es6');
const _customerService = require('../customerService/index.es6');
const appEvents = require('./appEvents');

const postOffice = new PostOffice();
const qn = new server.QN();
const postman = new Postman(qn, postOffice, '帮您转接专员哦~');
const customerService = new _customerService.CustomerService(qn, postman);

export const release = () => logger.info('releasing objects');

class Reporter {
  constructor(webContents) {
    this.step = 0;
    this.ipc = webContents;
  }

  updateUI(nick) {
    this.ipc.send(appEvents.G_UI_SHOP_UPDATE, {
      nick,
      isAdmin: false,
    });
  }

  nextStep() {
    this.step += 1;
    const { step } = this;

    this.ipc.send(appEvents.LAUNCH_UI_STEPS_UPDATE, { step });

    return (error) => {
      this.ipc.send(appEvents.LAUNCH_UI_STEPS_UPDATE, {
        step,
        error,
      })
    }
  }
}

export function hookup(mainWindow) {
  const { webContents } = mainWindow;
  // 主进程接收到渲染进程请求的退出事件
  ipcMain.on(appEvents.APP_MAIN_QUIT, () => {
    app.emit('window-all-closed');
  })
  // 主进程接收到渲染进程请求的视图切换事件
  ipcMain.on(appEvents.MODE_MAIN_CHANGE, (event, { mode }) => {
    postman.changeMode(mode);
    webContents.send(appEvents.MODE_UI_CHANGE, {
      mode,
      flags: {
        enabled: true,
        supervised: false,
      },
    })
  });

  postman.suitUp(customerService);
}

const DEFAULT_MODE = {
  mode: 'dialog',
  flags: {
    enabled: true,
    supervised: false,
  },
}

export async function launch(mainWindow) {
  const { webContents } = mainWindow;
  const reporter = new Reporter(webContents);
  reporter.nextStep();
  reporter.nextStep();
  await qn.setup(customerService, postman);
  await qn.connect();
  await Shop.loadConfig(qn.aid, qn.aid, qn.authToken);

  if (qn.tokenInfo.rogue === true) {
    return `[${qn.tokenInfo.nick}] 不在店铺授权列表中`;
  }

  reporter.updateUI(Shop.aid);
  const postOfficeReporter = reporter.nextStep();
  const {
    host, protocol, pathname, query,
  } = url.parse(settings.get('agent.endpoint'));
  const fixedToken = new URLSearchParams(query).get('auth_token');
  try {
    await postOffice.setup(`${protocol}//${host}${pathname}`, fixedToken || qn.authToken);
  } catch (e) {
    logger.error(`connect to server error: ${e}`);

    postOfficeReporter('连接服务器失败');
    throw new Error(e);
  }

  webContents.send(appEvents.G_UI_SHOP_UPDATE, {
    modes: ['dialog', 'nightWatch'],
    supervised: false,
  });

  webContents.send(appEvents.MODE_MAIN_CHANGE, DEFAULT_MODE);
  return null;
}
