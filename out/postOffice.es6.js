const events = require('events');
const uuid = require('uuid');
const ws = require('ws');
const { logger } = require('./logger');

const ALIVE_S = 60 * 1000; // 1分钟
const CHECK_S = 10 * 1000; // 10秒
const SERVICE_MODES = {
  NORMAL: 'normal',
  NIGHTWATCH: 'nightwatch',
  DISPATCH: 'transfer'
};

function sleep(nSeconds) {
  return new Promise((resolve, reject) => {
    logger.verbose(`sleeping for [${nSeconds}]s`);
    setTimeout(() => {
      logger.verbose(`slept for [${nSeconds}]s`)
    }, nSeconds * 1000)
  })
}

export default class Postoffice extends events {
  constructor(useSameConnectionID = false) {
    this.ws = null;
    this.alive = null;    
    this.checkID = null;
    this.idCounter = 0;
    this.queryCounter = {};
    this.questionCounter = {};
    this.useSameConnectionID = useSameConnectionID || false;
    this.connectionID = uuid.v4();
    this.authToken = null;
    this._closing = null;
    this.serviceMode = SERVICE_MODES.NORMAL;
    this.requestPool = {};
    this.connectInfo = {};
    this.started = false;
  }
  switchToDispatch() { // 派发模式
    this.serviceMode = SERVICE_MODES.DISPATCH;
  }
  switchToNightwatch() { // 夜间观察
    this.serviceMode = SERVICE_MODES.NIGHTWATCH;
  }
  switchToNormal() { // 正常模式
    this.serviceMode = SERVICE_MODES.NORMAL;
  }
  tearDown() { // 销毁
    if(this.ws === null || this.ws.readyState !== ws.OPEN) {
      this.ws = null;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this._closing = resolve;
      this.ws.close();
    })
  }
  async reconnect(retryInterval = 5) { // 5秒钟后重连
    try {
      if(!this.authToken) {
        await sleep(retryInterval);
      }
      logger.info('setting up');
      await this.setup();
    } catch(e) {
      logger.error(`reconnect failed, retry after${retryInterval}s`)
    }
  }
  checkAlive() {
    logger.verbose('checking alive flag...')
    if(this.alive === null) {
      logger.verbose('alive flag is null');
      return;
    } else if (new Date() - this.alive < ALIVE_S) {
      logger.verbose(`last ping: ${this.alive}`);
      return;
    }

    if(this.checkID) {
      clearInterval(this.checkID);
    }

    this.alive = null;
    this.checkID = null;
    this.authToken = null;

    logger.error('missing too much ping, consider connection is down')
    this.emit('postoffice-unexpected-close');
    this.reconnect();
  }
  setup(_url, _authenticationToken) {
    let { connectInfo } = this;
    let { url, authenticationToken } = connectInfo;
    connectInfo = {
      url: url || _url,
      authenticationToken: authenticationToken || _authenticationToken
    }
    return this.connect(url).then(() => this.authorize(authentication)).then(() => {
      logger.info('setting up ping check');

      this.checkID = setInterval(() => this.checkAlive(), CHECK_S);
    })
  }
  connect(url) { // 连接websocket
    logger.verbose(`prepare to connect ["${url}"]`)
    if(!this.useSameConnectionID) {
      this.connectionID = uuid.v4();
    }
    return this.tearDown().then(() => {
      logger.verbose(`connecting to ${url}`);
      this._closing = null;
      return new Promise((resolve, reject) => {
        const ws = new ws(url, {
          headers: {
            'X-Connection-ID': this.connectionID
          }
        });
        ws.on('ping', (event) => {
          if (this.checkID === null) return;
          logger.verbose("ping received, i'm alive");
          this.alive = new Date();
        })
        ws.on('error', (event) => {
          logger.error(`[${event}](${this.connectInfo.url})`);

          this.authToken = null;
          this._closing = true;

          this.emit('postoffice-unexpected-close');

          if (this.started) {
            this.reconnect();
          } else {
            throw new Error(event);
          }
        })
        ws.on('close', (event) => {
          this.authToken = null;
          if (this._closing === null) {
            logger.error('unexpected closing');
            this.emit('postoffice-unexpected-close');

            this.reconnect();
          } else {
            this.emit('postoffice-closed');

            try {
              this._closing();
            } catch(e) {
              logger.error('closing failed');
            }
          }
        });
        ws.on('open', (event) => {
          this.started = true;
          this.alive = new Date();
          resolve(ws);
        });
      });
    }).then((ws) => {
      this.ws = ws;
      ws.on('message', (data) => {
        logger.info('message recieved', data);

        let message = null;

        try {
          message = JSON.parse(data);
        } catch(e) {
          logger.error('invalid json-prc', data);

          message = {};
        }

        if (message.fn !== undefined && typeof(message.fn) === 'object') {
          logger.info(`server request received: ${message.fn}`)

          this.emit(message.fn, ...({
            serviceMode: this.serviceMode
          }, message.args, {
            id: message.id,
            ws
          }));
        } else if (message.id) {
          const request = this.request[message.id];

          if (!request) {
            logger.warn(`unknown response for [${message.id}]`)
            return;
          }

          logger.profile(request.reqID);

          if (message.result) {
            request.resolve(message.result);
          } else if (message.error) {
            request.reject(message.error);
          } else {
            request.reject(`malformed json-rpc ${data}`);
          }
        } else {
          logger.error(`malformed json-rpc ${data}`);
        }
      })
    })
  }
  authorize(authenticationToken) {
    if (this.authToken) {
      logger.warn('already authorized');
      return Promise.resolve(true);
    }
    logger.verbose('trying to get authentication token')

    return this.sendRequest('Agent.AuthenticateByToken', {
      AuthenticateByToken: authenticationToken,
      ConnectionID: this.connectionID
    }, true).then(({Token, Success}) => {
      return new Promise((resolve, reject) => {
        if (Success) {
          this.authToken = Token;
          logger.verbose('agent authorized');
          resolve(Token);
        } else {
          reject('agent authorized failed');
        }
      })
    })
  }
  sendRequest(method, param, forceSend = false) {
    const id = ++this.idCounter;

    const reqID = this._getReqID(id);

    logger.verbose(`sending request: ${method} [${reqID}]`);

    const data = {
      id: `${id}`,
      fn: method,
      args: param
    };

    logger.debug('sending', data);

    logger.profile(reqID);

    return new Promise((resolve, reject) => {
      this.request[id] = {
        ts: new Date(),
        id: id,
        reqID: reqID,
        data: data,
        resolve: resolve,
        reject: reject
      };
      return this._send(data, forceSend, reject);
    })
  }
  _send(data, forceSend, reject) {
    if (this.authToken === null && forceSend === false) {
      setTimeout(() => {
        logger.warn('client not authorized, try again in 1s')

        this._send(data, forceSend, reject);
      }, 1000);
      return;
    }

    data.args.Token = this.authToken;
    const payload = JSON.stringify(data);
    const tip = 'error sending message to agent';

    try {
      this.ws.send(payload, (error) => {
        if (error) {
          logger.error(tip, error);
          reject(tip);
        }
      });
    } catch (error) {
      logger.error(tip, error);

      reject(tip);
    }
  }
  sendSignal((userID, signal) {
    return this.call('Dialogue.Question', userID, 'outgoing', '', signal);
  }
  question(userID, type, query, signal = '') {
    return this.call('Dialogue.Question', userID, type, query, signal);
  }
  mono(userID, type, query, signal = '') {
    return this.call('Dialogue.MonoTurn', userID, type, query, signal);
  }
  syncMessages(userID, messages, manualMode, timestamp, timeoffset) {
    return this.sendRequest('Dialogue.SyncMessages', {
      UserID: userID,
      MessagesJSON: JSON.stringify(messages),
      ServiceMode: this.serviceMode,
      ManualMode: manualMode,
      ClientTimestamp: timestamp,
      ClientTimeOffset: timeoffset
    });
  }
  call(method, UserID, Type, Query, Signal) {
    logger.info(`${method} for [${UserID}] [${Query}]`)
  }
  _getQueryID(userID, isQuestion) {
    if(!this.queryCounter[userID]) {
      this.queryCounter[userID] = 0;
    }
    const info = {
      DialogueID: this.queryCounter[userID]++,
      QuestionID: 0,
      ServiceMode: this.serviceMode,
      SessionMode: 'auto',
      Timestamp: Math.round(new Date().getTime() / 1000)
    };

    if (isQuestion) {
      if (!this.questionCounter[userID]) {
        this.questionCounter[userID] = 0;
      }

      info.QuestionID = this.questionCounter[userID]++;
    }

    return info;
  }
  _getReqID(id) {
    return `Request#${id}`
  }
}