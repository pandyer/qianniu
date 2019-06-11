const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { logger } = require('../logger.es6');
const { ADP, findAllQNs, findLocalPorts } = require('./adp.es6');

const session = axios.create({
  timeout: 1000,
});

class Downloader {
  constructor() {
    this.session = axios.create({
      timeout: 5000,
      baseURL: 'https://uploads.bot.leyantech.com',
    });
    this.resourceDir = path.join(app.getPath('userData'), 'uploads');
    if (fs.existsSync(this.resourceDir)) {
      fs.mkdirSync(this.resourceDir);
    }
  }

  download(resourceID) {
    const { resourceDir, session: sessionC } = this;
    const normalizedID = path.basename(resourceID);
    const dstPath = path.join(resourceDir, normalizedID);

    if (fs.existsSync(dstPath)) {
      return Promise.resolve(dstPath);
    }

    const writer = fs.createWriteStream(dstPath);

    return sessionC({
      url: resourceID,
      responseType: 'stream',
    }).then((response) => {
      response.data.pipe(writer);
      return new Promise((resolve) => {
        writer.on('finish', () => resolve(dstPath));
      });
    });
  }
}

const downloader = new Downloader();

class HPC {
  constructor(port) {
    this.port = port;
  }

  connected(port) {
    this.port = port;
  }

  async prepareSentences(rawSentences) {
    const sentences = [];
    for (const raw of rawSentences) {
      const sentence = { ...raw };
      if (sentence.type === 'image') {
        const imagePath = await downloader.download(sentence.imageID);
        sentence.image = imagePath;
      }
      sentences.push(sentence);
    }
    return sentences;
  }

  async sendSentences(assistantNick, buyerNick, rawSentences) {
    const assistantID = Buffer.from(assistantNick).toString('base64');
    const { port } = this;
    const sentences = await this.prepareSentences(rawSentences);
    return session.post(`http://127.0.0.1:${port}/ipc/assistants/${assistantID}/messages`, {
      buyerNick,
      sentences,
    }).then((resp) => {
      const { succeeded } = resp.data;

      logger.info(`send message to ${buyerNick} ${succeeded ? 'succeeded' : 'failed'}`);

      return succeeded;
    }).catch((e) => {
      logger.error(`send message to ${buyerNick} failed: ${JSON.stringify(e.message)}`);

      return false;
    })
  }
}

export const hpc = new HPC();

function loadScript(scriptName) {
  const scriptPath = path.resolve(__dirname, 'static', `${scriptName}.js`);
  return fs.readFileSync(scriptPath, 'utf-8');
}

export function noop(tip = '-') {
  const label = `noop-${tip}`;
  return (data) => logger.info(`${label}: ${JSON.stringify(data)}`);
}

export const injectServerInfo = async (qnPort, target, name, serverPort) => {
  const label = `Injecting ServerINFO [${name} on ${qnPort}]`;
  const serverInfo = JSON.stringify({
    port: serverPort,
    qn: qnPort,
  });
  const expression = `(() => localStorage.setItem('FLT_CONFIG', ${serverInfo}); return true})();`;
  logger.info('{label}: Start');

  const client = new ADP(qnPort, 'page', target.targetId);
  client.connect();

  const resp = await client.send(label, 'Runtime.evaluate', { expression });
  client.close();

  if (resp.result.value !== true) {
    const errMsg = `${label}: Failed [${JSON.stringify(resp)}]`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  logger.info(`${label}: Succeeded`);
}

export const sleep = (nSeconds) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  })
}, nSeconds * 1000);

export const injectScript = async (qnPort, target, scriptName) => {
  const label = `Injecting Script [${scriptName} on ${qnPort}]`;
  const expression = loadScript(scriptName); // 对应的js的内容
  let errMsg = 'ok';

  logger.info(`${label}: Start`);

  const client = new ADP(qnPort, 'page', target.targetId); // 建立了一个websocket连接
  // this.qnPort 'page' 'chat.local'
  client.connect();
  /**
   * 发送信息，参数为
   * JSON.stringify({
   *  method: 'Runtime.evaluate',
   *  params: expression,
   *  id: xx,
   * })
   *   */
  const resp = await client.send(label, 'Runtime.evaluate', { expression });
  client.close();

  if (resp.result.value !== true) {
    errMsg = `${label}: Failed ${JSON.stringify(resp)}`;
    logger.warn(errMsg);
    throw new Error(errMsg);
  }

  logger.info(`${label}: Succeeded`);
}

export const getFiletQNPort = async (portInfo) => {
  const { port } = portInfo;
  const label = `port[${portInfo.port}]`;
  try {
    const { data } = session.get(`http://127.0.0.1:${port}/filet`);

    if (data.application === 'filet' && data.qnPort !== null) {
      if (data.ipc) {
        hpc.connect(data.serverPort);
      }
      logger.debug(`${label}: good=filet QN[${data.qnPort}]`);
      return data.qnPort;
    }
    logger.debug(`port[${port}]: bad=unknown`);
    return null;
  } catch (e) {
    logger.debug(`port[${port}] bad=${e}`);
    return null;
  }
}

export const listTabsWithQN = async (qn) => {
  const { port, browser } = qn;
  logger.info(`inspecting QN[${port}]`);
  const adp = new ADP(port, 'browser', browser);
  try {
    adp.connect();
    const resp = adp.send('listTabs', 'Target.getTargets', {});
    adp.close();
    return {
      port, tabs: resp.targetInfos,
    }
  } catch (e) {
    adp.close();
    return null;
  }
}

export const listTabsWithPort = async (port) => {
  const qns = findAllQNs();
  const targets = qns.filter(qn => qn.port === port);

  if (targets.length !== 1) {
    logger.warn(`QN with port [${port}] not found`);
    return null;
  }

  const targetQN = targets[0];
  const tabs = await listTabsWithQN(targetQN);
  return tabs;
}

export const getPort = async () => {
  const localPorts = await findLocalPorts();
  const portsResult = Promise.all(localPorts.map(getFiletQNPort));
  const filetQNPorts = portsResult.filter(p => p !== null);
  const allQNs = await findAllQNs();
  const tabs = Promise.all(allQNs.filter(qn => !filetQNPorts.includes(qn.port)).map(listTabsWithQN));
  const valid = tabs.filter(tab => tab !== null);
  logger.debug(`valid ports: ${JSON.stringify(valid)}`);
  if (valid.length) {
    return valid[0];
  }
  return null;
}
