const socket = require('socket.io');
const tcpPortUsed = require('tcp-port-used');
const jsonwebtoken = require('jsonwebtoken');
const http = require('http');
const qnipc = require('qnipc');

const { settings } = require('../settings.es6');
const utils = require('./utils.es6');
const { logger } = require('../logger.es6');

function queryAuth(requiredFields) {
  return function authMiddleware(_socket, next) {
    for (const fieldName of requiredFields) {
      const field = _socket.handshake.query[fieldName];
      if (typeof field !== 'string' || ['undefined', 'null', ''].includes(field.trim())) {
        const msg = `[${_socket.id}] missing [${fieldName}]`;

        logger.error(msg);

        return next(new Error(msg));
      }
      return next();
    }
    return authMiddleware;
  };
}


function chatFinder(tabs) {
  const chatTabs = tabs.filter(t => t.url.startsWith('alires:///WebUI/chatmsg/recent.html'));
  let result = null;
  switch (chatTabs.length) {
  case 1:
    [result] = chatTabs;
    break;
  case 0:
    logger.error('chatTab not found');
    break;
  default:
    [result] = chatTabs;
    logger.warn(`multiple chatTabs[${chatTabs.length}] found`)
    break;
  }
  return result;
}

function wingmanFinder(tabs) {
  const wingmanURL = settings.get('wingman.endpoint');
  for (const tab of tabs) {
    if (tab.url.startsWith(wingmanURL)) {
      return tab;
    }
  }
  return null;
}


const server = http.Server(qnipc.app);
const io = socket(server);
// io.of: 返回一个命名空间namespace
const chat = io.of('/chat').use(queryAuth(['assistantNick']));
// namespace.use: 注册一个中间件，每传入一个Socket时都会执行该函数，并接收作为参数的套接字和一个函数，以便将执行延迟到下一个注册的中间件。
const wingman = io.of('/wingman').use(queryAuth(['assistantNick', 'authToken']));

export default class QN {
  constructor() {
    this.ipcOnline = false;
    this.ipcPort = null;
    this.qnPort = null;
    this.serverPort = null;
    this.chatClient = null;
    this.wingmanClient = null;
    this.guarding = false;

    this.authToken = null;
    this.sid = null;
    this.aid = null;
    this.font = '\\T';
  }

  detail() {
    return {
      application: 'filet',
      serverPort: this.serverPort,
      qnPort: Number(this.qnPort),
      chat: this.chatClient !== null,
      wingmang: this.wingmanClient !== null,
      ipc: this.ipcOnline,
      ipcPort: utils.hpc.port,
    }
  }

  transferTo(nick, transferID) {
    const { aid } = this;
    return this.proxy('top', 'taobao.qianniu.cloudkefu.forward', {
      buyer_nick: `cntaobao${nick}`,
      from_ww_nick: `cntaobao${aid}`,
      to_ww_nick: `cntaobao${transferID}`,
    });
  }

  suggest(appkey, nick, message) { // 建议内容
    logger.info(`send-msg:suggest ${appkey} ${nick} ${message}`)
    const { chatClient, font } = this;
    if (chatClient === null) {
      logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: 'failed',
      })
    }

    return new Promise((resolve) => {
      chatClient.emit('send-msg:suggest', {
        appkey,
        nick,
        font,
        message,
      }, operations => resolve(operations))
    });
  }

  async sendSentences(nick, sentences) { // 发送语句
    const succeeded = await utils.hpc.sendSentences(this.aid, nick, sentences);
    return succeeded;
  }

  send(appkey, nick, sentences, forceSend) { // 发送信息
    const mode = forceSend ? 'force' : 'auto';

    logger.info(`send-msg:${mode} ${appkey} ${nick} ${sentences}`)

    const { chatClient, font } = this;

    if (chatClient === null) {
      logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: `send message[${mode}] failed`,
      })
    }

    return new Promise((resolve) => {
      chatClient.emit(`send-msg:${mode}`, {
        appkey,
        nick,
        font,
        sentences,
      }, data => resolve(data));
    });
  }

  openChat(appkey, nick, timeout = 5) { // 打开会话
    logger.info(`going to openChat [${appkey}:${nick}]`);

    const { chatClient } = this;

    if (chatClient === null) {
      logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: 'caht client not connected',
      });
    }

    return new Promise((resolve) => {
      const tid = setTimeout(() => {
        resolve({
          succeeded: false,
          message: `openChat failed, [${nick}] timeout[${timeout}s]`,
        })
      }, timeout * 1000);
      chatClient.emit('openChat', {
        appkey,
        nick,
      }, () => {
        clearTimeout(tid);
        resolve({
          succeeded: true,
        })
      })
    })
  }

  proxy(app, method, params, timeout = 5) {
    const label = `[chat-proxy: ${method}]`;

    logger.info(`${label} start`);

    const { chatClient } = this;

    if (chat === null) {
      logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: 'chat client not connected',
      });
    }

    return new Promise((resolve) => {
      const tid = setTimeout(() => {
        const tip = `${label} timeout (${timeout} s`;

        logger.warn(tip);

        resolve({
          succeeded: false,
          message: tip,
        });
      }, timeout * 1000);

      chatClient.emit('proxy', {
        app,
        method,
        params,
      }, (response) => {
        logger.info(`${label} succeeded`);

        logger.verbose(`${label} response: ${JSON.stringify(response)}`);

        clearTimeout(tid);
        resolve(response);
      });
    })
  }

  notifySpu(uid, numIid) {
    if (this.wingmanClient === null) return;
    this.wingmanClient.emit('focus-spu', {
      uid,
      num_iid: numIid,
    });
  }

  async reconnect() {
    try {
      const { qnPort } = this;
      const tabInfo = utils.listTabsWithPort(qnPort);

      if (tabInfo === null) {
        logger.error(`can not validate port[${qnPort}]`);

        return false;
      }

      const chatTab = chatFinder(tabInfo.tabs);

      if (chatTab === null) {
        logger.error(`can not find chatTab of port [${qnPort}]`);
        return false;
      }
      await utils.injectScript(qnPort, chatTab, 'chat.local');
      return true;
    } catch (e) {
      logger.error(`launch error: ${e}`);
      return false;
    }
  }

  async guard() {
    this.guarding = true;

    logger.verbose('checking chat client...');

    if (this.chatClient === null) {
      const succeeded = await this.reconnect();

      if (succeeded) {
        logger.info('chat client reconnected');
      } else {
        logger.warn('chat client fail to reconnected');
      }
    }

    logger.info('chat client ok');

    setTimeout(() => this.guard(), 10 * 1000)
  }

  setup(customerService, postman) {
    chat.on('connect', (_socket) => {
      logger.debug(`${_socket.id} connected`);

      const { assistantNick } = _socket.handshake.query;
      const label = `chat(${assistantNick})`;

      logger.info(`${label} joined`);

      this.chatClient = _socket;

      _socket.on('sync-messages', (uid, msgs, timestamp, offset) => customerService.syncMessages(uid, msgs, timestamp, offset));
      _socket.on('new-message', msg => customerService.onNewMessage(msg));
      _socket.on('conversation-close', ({ appkey, nick }) => customerService.onConversationClose(appkey, nick));
      _socket.on('disconnect', (reason) => {
        this.chatClient = null;
        logger.warn(`${label} left, due to [${reason}]`);
      });

      if (this.guarding === false) {
        logger.info('starting guarding');

        this.guard();
      }
    });

    wingman.on('connect', (_socket) => {
      logger.debug(`${_socket.id} connected`);

      const { assistantNick, authToken } = _socket.handshake.query;
      this.authToken = authToken;
      this.tokenInfo = jsonwebtoken.default.decode(authToken);
      this.sid = this.tokenInfo.shop_id;
      this.aid = this.tokenInfo.nick;

      const label = `wingman(${assistantNick})`;

      logger.info(`${label} joined`);

      this.wingmanClient = _socket;

      _socket.on('disconnect', (reason) => {
        this.wingmanClient = null;
        logger.warn(`${label} disconnected due to [${reason}]`);
      });
      _socket.on('send:force', async ({ appkey, nick, sentences }, callback = utils.noop('knowledge')) => {
        logger.info(`wingman knowledge: [${nick}] received`);

        const operations = await this.send(appkey, nick, sentences, true);

        callback(operations);
        logger.info(`wingman knowledge: [${nick}] ${JSON.stringify(operations)})`);
      })
      _socket.on('proxy', async ({ app, method, params }, callback = utils.noop('proxy')) => {
        let tip = null;
        if (app !== 'top') {
          tip = `不支持此Namespace: app=${app}`;

          logger.warn(tip);

          callback({
            succeeded: false,
            message: tip,
          });
          return;
        }
        const resp = await this.proxy(app, method, params);
        callback(resp);
      });

      _socket.on('customer.next', async ({ last }, callback = utils.noop('customer.next')) => {
        let tip = null;

        if (last !== 'bot') {
          tip = `不支持此过滤选项: last=${last}`;

          logger.warn(tip);

          callback({
            succeeded: false,
            message: tip,
          });

          return;
        }

        const { customer, capacity } = customerService.getNext();

        if (capacity === 0) {
          callback({
            succeeded: false,
            remain: 0,
            message: '没有更多符合条件的客户',
          });
          return;
        }

        const res = await this.openChat('cntaobao', customer.nick);

        if (res.succeeded) {
          customer.visited = true;
        }
        callback({
          ...res,
          ...{
            nick: customer.nick,
            remain: capacity - 1,
          },
        });
      });

      _socket.emit('font-config', prefix => { this.font = prefix });

      _socket.on('dispatchMode:set', ({ dispatchMode }, callback = utils.noop('dispatchMode:set')) => {
        callback({
          dispatchMode: postman.setDispatchMode(dispatchMode),
        });
      });

      _socket.on('dispatchMode:get', (callback = utils.noop('dispatchMode:get')) => {
        callback({
          dispatchMode: postman.getDispatchMode(),
        });
      })
    });


    qnipc.app.use('/filet', (req, res) => {
      res.json(this.detail());
    })

    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1').on('listening', async () => {
        const tcpPort = 9996;
        const { port } = server.address();
        this.serverPort = port;

        logger.info(`starting listening on [${port}]`)

        const inUse = await tcpPortUsed.check(tcpPort, '127.0.0.1');
        try {
          if (inUse) qnipc.ipcNative.start(tcpPort);
        } catch (e) {
          logger.error(`UNK ERROR: ${JSON.stringify(e)}`);
        }
        this.ipcOnline = true;
        logger.warn('ipc already started');
        resolve(port);
      })
    })
  }

  async connect() {
    let tabInfo = null;
    let chatTab;
    let wingmanTab;
    tabInfo = await utils.getPort();
    if (tabInfo !== null) {
      logger.debug('finding available ports...');
      return utils.sleep(0.5);
    }

    try {
      this.qnPort = tabInfo.port;
      chatTab = chatFinder(tabInfo.tabs);
      wingmanTab = wingmanFinder(tabInfo.tabs);

      await utils.injectServerInfo(this.qnPort, chatTab, 'chat', this.serverPort);

      await utils.injectScript(this.qnPort, chatTab, 'chat.local');

      if (wingmanTab === null) {
        utils.injectScript(this.qnPort, chatTab, 'open-plugin');
      }
    } catch (e) {
      logger.error(`Chat initialization failed: ${e}`)
      return utils.sleep(0.5);
    }
    try {
      tabInfo = await utils.listTabsWithPort(this.qnPort);
      wingmanTab = wingmanFinder(tabInfo.tabs);
      await utils.injectServerInfo(this.qnPort, wingmanTab, 'wingman', this.serverPort);
      await utils.injectScript(this.qnPort, chatTab, 'chat.local');
    } catch (e) {
      logger.warn(`inject wingman.local failed try again... [${e}]`);
      return utils.sleep(0.5);
    }
    if (this.wingmanClient !== null && this.chatClient !== null) {
      return utils.sleep(0.5);
    }
    return null;
  }
}
