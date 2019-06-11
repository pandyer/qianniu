const { app } = require('electron');
const lyWinTools = require('ly-win-tools');
const nodeNetstat = require('node-netstat');
const path = require('path');
const fs = require('fs');
const WS = require('ws');
const { logger } = require('../logger.es6');

const QN_EXE = 'AliWorkbench.exe';
const BENCH_ROOT = path.resolve(app.getPath('home'), 'AppData', 'Local', 'aef5', 'AliWorkbench');
const MULTI_INSTANCE_ROOT = path.resolve(BENCH_ROOT, 'BackupCache');
const DEBUG_FILE_NAME = 'DevToolsActivePort';

export function findLocalPorts() {
  const ports = [];
  const filter = {
    protocol: 'tcp',
    local: {
      address: '127.0.0.1',
    },
    state: 'LISTENING',
  };
  return new Promise((resolve) => {
    nodeNetstat({
      filter,
      done: () => resolve(ports),
    }, (data) => {
      const { pid } = data;
      const { port } = data.local;
      ports.push({
        pid,
        port,
      })
    })
  })
}

function listDir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err !== null) {
        if (err.code === 'ENOENT') {
          resolve([]);
        } else {
          reject(new Error(`ls error: [${err}]`));
        }
      } else {
        resolve(files.map(f => path.resolve(dirPath, f)));
      }
    })
  })
}

function openFile(fPath) {
  return new Promise((resolve, reject) => {
    fs.open(fPath, 'r', (err, fd) => {
      if (err) reject(err);
      else resolve(fd);
    })
  })
}

function readDebugFile(fPath, fd) {
  return new Promise((resolve, reject) => {
    fs.readFile(fd, {
      encoding: 'utf8',
    }, (err, data) => {
      if (err) reject(err);
      else {
        const content = data.trim().split(/[\r\n]/);

        if (content.length !== 2) {
          const tip = `malformed debug file [${fPath}]`;
          logger.warn(tip);

          resolve(null);
        } else {
          resolve({
            port: content[0],
            browser: content[1].split('/').slice(-1)[0],
          })
        }
      }
    })
  })
}

const getDebugInfo = async (fPath) => {
  let fd = null;
  let content = null;

  try {
    fd = await openFile(fPath);
    content = await readDebugFile(fPath, fd);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  if (fd !== null) {
    fs.closeSync(fd);
  }

  return content;
}

export const findAllQNs = async () => {
  const localPorts = await findLocalPorts();
  const pidMap = {};
  for (const portInfo of localPorts) {
    const { pid, port } = portInfo;
    logger.debug(`found PORT<${pid}: ${port}>`);

    pidMap[pid] = `${port}`;
  }
  const procs = await lyWinTools.findProcess({
    name: QN_EXE,
  });

  logger.info(`QN Proc X[${procs.length}]`);

  const qnMap = {};
  for (const proc of procs) {
    const { pid } = proc;
    const port = pidMap[pid];

    logger.debug(`found QN<${pid}: ${port}>`);

    qnMap[port] = {
      pid,
      port,
      browser: null,
    }
  }
  const others = listDir(MULTI_INSTANCE_ROOT);
  const files = [BENCH_ROOT].concat([...others]).map(f => path.resolve(f, DEBUG_FILE_NAME));
  const debugInfo = Promise.all(files.map(getDebugInfo));

  for (const info of debugInfo) {
    const _port = info.port;
    const { browser } = info;
    const qn = qnMap[_port];

    if (qn === undefined) {
      logger.verbose(`stalled QN[${_port}] found! skip!`);
    } else {
      qn.browser = browser;
    }
  }

  const valid = [];
  const _arr = Object.keys(qnMap);

  for (let i = 0; i < _arr.length; i += 1) {
    const key = _arr[i];
    const { pid, port: _port2, browser } = qnMap[key];

    if (browser === null) {
      logger.error(`can not inspect QN<${pid}: ${_port2}>`);
    } else {
      valid.push({
        port: Number(_port2),
        browser,
      })
    }
  }
  return valid;
}

export default class ADP {
  constructor(port, type, target) {
    this.port = port;
    this.type = type; // page
    this.target = target;
    this.registry = {};
    this.requestCounter = 0;
    this.ws = null;
    this.label = `[${port}:${target}]`;
  }

  connect(timeout = 1) {
    const { port, type, target } = this;

    return new Promise((_resolve, _reject) => {
      let tid = setTimeout(() => {
        tid = null;
        const tip = `${this.label} connection timeout ${timeout}s`
        _reject(new Error(tip));
      }, timeout * 1000);

      const resolve = (next) => {
        if (tid === null) return;
        clearTimeout(tid);

        _resolve(next);
      }

      const reject = (err) => {
        if (tid === null) return;
        clearTimeout(tid);

        _reject(err);
      }

      const url = `ws://127.0.0.1:${port}/devtools/${type}/${target}`;
      const ws = new WS(url);

      ws.on('error', () => {
        tid = null;
        reject(new Error(`${this.label} connection error`));
      })
      ws.on('message', (data) => {
        const message = JSON.parse(data);

        this.handleMessage(message);
      })
      ws.on('open', () => {
        this.ws = ws;
        resolve();
      })
    })
  }

  send(name, method, params, timeout = 1) {
    this.requestCounter += 1
    const id = this.requestCounter;
    const payload = {
      id,
      method,
      params,
    };
    return new Promise((_resolve, _reject) => {
      let tid = setTimeout(() => {
        tid = null;
        const tip = `${name} on ${this.label} timeout ${timeout}s`
        _reject(new Error(tip));
      }, timeout * 1000);

      const resolve = (next) => {
        if (tid === null) return;
        clearTimeout(tid);

        _resolve(next);
      }

      const reject = (err) => {
        if (tid === null) return;
        clearTimeout(tid);

        _reject(err);
      }

      this.ws.send(JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else {
          this.registry[id] = {
            resolve,
            reject,
          };
        }
      })
    })
  }

  handleMessage({ id, error, result }) {
    const request = this.registry[id];

    if (request !== undefined) {
      delete this.registry[id];

      if (error === undefined) {
        request.resolve(result);
      } else {
        request.reject(new Error(error));
      }
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}
