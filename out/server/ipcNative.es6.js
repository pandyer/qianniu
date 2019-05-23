const net = require('net');
const { EventEmitter } = require('events');
const { logger } = require('winston');
const utils = require('./utils');

const server = new net.Server();
const MESSAGE_DELIMITER = '\r\n\r\n';

class Assistant extends EventEmitter {
  constructor(manager, socket) {
    super();
    this.manager = manager;
    this.socket = socket;
    this.port = socket.remotePort;
    this.id = null;
    this.nick = null;
    this.queue = [];
    this.started = false;
    this.setup();
  }

  invoke(method, params = null) {
    const payload = params === null ? {} : { ...params };
    payload.method = method;
    return new Promise((resolve, reject) => {
      const ts = new Date().getTime();
      const request = {
        resolve,
        reject,
        payload,
        ts,
      };
      this.queue.push(request);
      this.socket.write(`${JSON.stringify(payload)}${MESSAGE_DELIMITER}`);
    })
  }

  async identify() {
    const { username } = this.invoke('getusername');
    this.id = utils.base64.encode(username);
    this.nick = username;
    this.manager.register(this);
  }

  toDict() {
    const { id, nick } = this;
    return { id, nick };
  }

  getIdentity() {
    return `<Assistant ${this.nick}:${this.port}>`
  }

  process(message) {
    let data = null;
    const payload = message.toString('UTF8').trim();
    if (payload.startsWith('GET')) {
      logger.debug('GOT HTTP request, skip');
      return;
    }
    try {
      data = JSON.parse(payload);
    } catch (e) {
      logger.error(`malformed json ${payload}`);
      return;
    }
    if (data.result !== undefined) {
      this.onResult(data);
    } else if (data.event !== undefined) {
      this.onEvent(data);
    } else {
      logger.warn(`unknown message type: ${data}`);
    }
  }

  onResult(data) {
    if (this.queue.length === 0) {
      logger.error(`got unknown result: ${JSON.stringify(data)}`);
      return null;
    }
    const {
      resolve, reject, ts, payload,
    } = this.queue.shift();
    const now = new Date().getTime();
    logger.debug(`request ${JSON.stringify(payload)} duration ${(now - ts).toFixed(2)}ms`);
    if (data.result === 'success') {
      resolve(data);
    } else {
      reject(new Error(`${payload.method} failed`));
    }
  }

  onEvent(data) {
    if (this.nick === null) {
      logger.warn('droping unidentified event data');
      return null;
    }
    switch (data.event) {
    case 'recvtext':
      try {
        const text = JSON.parse(utils.base64.decode(data.text));
        this.emit('message-received', {
          text,
          user: {
            nick: data.from,
          },
        })
      } catch (e) {
        logger.error('malformed text: '.concat(data.text))
      }
      break;
    default:
      logger.debug('unknown message: '.concat(JSON.stringify(data)));
    }
  }

  setup() {
    let accumulatingBuffer = Buffer.alloc(0);
    const { socket } = this;
    socket.on('data', (data) => {
      const accumulatingLen = accumulatingBuffer.length;
      const chunkLen = data.length;
      let tmpBuffer = Buffer.allocUnsafe(accumulatingLen + chunkLen);
      accumulatingBuffer.copy(tmpBuffer);
      data.copy(tmpBuffer, accumulatingLen);
      accumulatingBuffer = tmpBuffer;
      tmpBuffer = null;
      let start = 0;
      let offset = accumulatingBuffer.indexOf(MESSAGE_DELIMITER);
      while (offset !== -1) {
        const message = accumulatingBuffer.slice(start, offset);
        if (message) {
          this.process(message);
        }
        start = offset + MESSAGE_DELIMITER.length;
        offset = accumulatingBuffer.indexOf(MESSAGE_DELIMITER, start);
      }
      if (start !== 0) {
        const remain = accumulatingBuffer.length - start;
        tmpBuffer = Buffer.allocUnsafe(remain);
        accumulatingBuffer.copy(tmpBuffer, 0, start);
        accumulatingBuffer = tmpBuffer;
      }
    });
    socket.on('end', () => {
      this.manager.unregister(this);
    })
  }
}

export default class IPCNative extends EventEmitter {
  constructor(props) {
    super(props);
    this.registry = {};
  }

  listClients() {
    const clients = [];
    const arr = Object.keys(this.registry);
    for (let i = 0; i < arr.length; i += 1) {
      const id = arr[i];
      const assistants = this.registry[id];
      if (assistants.length !== 0) {
        clients.push(assistants[0].toDict());
      }
    }
    return clients;
  }

  getClients(clientID) {
    return this.registry[clientID] || [];
  }

  register(assistant) {
    let clients = this.registry[assistant.id];
    if (clients === undefined) {
      clients = [];
    }
    clients.push(assistant);
    this.registry[assistant.id] = clients;
    const identity = assistant.getIdentity();
    logger.info(`${identity} connected`)
    this.emit('assistant:joined', {
      assistant: assistant.toDict(),
      clients: clients.length,
    })
  }

  unregister(assistant) {
    let clients = this.registry[assistant.id];
    if (clients === undefined) return;
    clients = clients.filter(c => c !== undefined);
    const remain = clients.length;
    if (remain === 0) {
      delete this.registry[assistant.id];
    } else {
      this.registry[assistant.id] = clients;
    }
    const identity = assistant.getIdentity();
    logger.info(`${identity} disconnected`);
    this.emit('assistant:left', {
      assistant: assistant.toDict(),
      clients: remain,
    });
  }

  start(port) {
    server.on('connection', async (socket) => {
      try {
        const assistant = new Assistant(this, socket);
        return assistant.identify();
      } catch (e) {
        logger.error('connection failed');
      }
    })
  }
}
