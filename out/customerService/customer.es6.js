const _url = require('url');
const { logger } = require('../logger.es6');
const { settings } = require('../settings.es6');
const utils = require('../utils.es6');
const Shop = require('../Shop/index.es6');

const SYS_MSGS = [/^系统提示: 用户 /, /degrade/];
const MASKS = [/（对方正在使用.*收发消息）/];
const LINK_RE = /(https?:\/\/item\.taobao\.com\/item\.htm[\S]+)/;
const SEP = /-=-=-=-=-=-/g;

function processQuestion(question) {
  let q = question;
  q = question.replace('\x02', '');
  q = utils.translate(question).trim();

  if (q === '') return '';

  for (let _i = 0; _i < SYS_MSGS.length; _i += 1) {
    const ptn = SYS_MSGS[_i];

    if (ptn.test(question)) {
      logger.info(`[${question}] is a system message`);

      return '';
    }
  }

  for (let _i2 = 0; _i2 < MASKS.length; _i2 += 1) {
    const _ptn = MASKS[_i2];
    q = q.replace(_ptn, '');
  }

  return q.trim();
}

export default class Customer {
  constructor(_qn, postman, _customerID) {
    logger.info(`creating customer [${_customerID}]`);
    this.botReplied = null;
    this.visited = false;
    this.qn = _qn;
    this.postman = postman;
    this.customerID = _customerID;
    this.nick = utils.removeUIDPrefix(_customerID);
    this.manualMode = false;

    this.reseting = false;
    this.dispatchPreference = [];
    this.questionUIDs = {};
    this.lastItem = null;

    logger.verbose(`customer [${_customerID}] created`);
  }

  doReset() {
    this.reseting = false;
    this.manualMode = false;

    logger.info(`customer [${this.customerID}] reestted`);
  }

  reset(resetNow = false) {
    const { reseting, manualMode } = this;

    if (resetNow) { // FIXME
    } else if (reseting) {
      // 已经处于重置进程
      return this;
    } else if (!manualMode) {
      // reset only in manual mode
      return this;
    }

    const cooldown = settings.get('cooldown');

    logger.info(`going to reset customer [${this.customerID}] in [${cooldown}]s`)

    this.reseting = true;
    utils.sleep(cooldown).then(() => this.doReset());
    return this;
  }

  sendEscSignal() {
    this.postman.sendEscSignal(this.customerID).catch(() => {
      logger.error(`send esc failed: ${this.customerID}`);
    })
  }

  onClose() {
    this.sendEscSignal();

    return this.reset();
  }

  switchToDialogue() {
    if (this.manualMode) {
      logger.info(`customer [${this.customerID}] switch back to DIALOGUE-MODE`);

      this.doReset();
    }
  }

  setManualMode() {
    logger.info(`set customer [${this.customerID}] to manual mode`);

    this.manualMode = true;
    return this;
  }

  beforeAsk(question) {
    const { customerID } = this;

    if (Shop.isSubAccount(customerID)) {
      logger.info(`${customerID} is subaccount`);
      return false;
    }
    if (question.length === 0) {
      logger.info('empty question found');

      return false;
    }
    if (question === '重置') {
      logger.info('you can always use reset');

      this.doReset();

      return true;
    }
    return true;
  }

  callWingman(question) {
    const link = LINK_RE.exec(question);

    if (link !== null) {
      const params = utils.getQueryParams(link[1]);

      if (params.id) {
        this.qn.notifySpu(this.customerID, params.id);
      }
    }
  }

  isDuplicatedItem(link) {
    // FIXME
    if (link.startsWith('http')) {
      const url = new _url.URL(link);
      const item = url.searchParams.get('id');

      if (url.host === 'item.taobao.com') {
        if (item === this.lastItem) {
          return true;
        }

        this.lastItem = item;
        return false;
      }
    }
    this.lastItem = null;
    return false;
  }

  syncMessages(messages, timestamp, offset) {
    return this.postman.syncMessages(this.customerID, messages, this.manualMode, timestamp, offset).catch((e) => {
      logger.error(`error sync message: ${e}`);
    })
  }

  ask(question) {
    let q = processQuestion(question);

    this.callWingman(q);
    if (this.isDuplicatedItem(q)) {
      q = '';
    }

    if (this.beforeAsk(question)) {
      if (this.manualMode) {
        return this.postman.mono(this.customerID, 'incoming', question);
      }
      return this.postman.ask(this.customerID, 'incoming', question);
    }

    return Promise.resolve('question akipped');
  }

  async outgoing(text) {
    if (text.includes('\x02')) {
      this.botReplied = new Date().getTime();

      logger.debug(`bot message: [${this.nick}]-[${text}]`);
    } else {
      this.botReplied = null;
    }

    this.postman.outgoing(this.customerID, text);
  }

  async beforeReply(t, forceSend = false) {
    const text = t.trim();

    if (text === '') {
      logger.info(`empty reply content for ${this.customerID}`);
      return false;
    }

    if (forceSend) {
      logger.info(`forceSend [${text}]`);
      return true;
    }

    if (this.manualMode) {
      const sentences = text.split(SEP).map(part => part.trim()).filter(part => part.length !== 0);
      await this.qn.suggest('cntaobao', this.nick, sentences.join('\n'));

      logger.info(`[manual] suggest for [${this.customerID}] ${text}`);
      return false;
    }

    const CHAR_PER_MIN = settings.get('char_per_min');
    const SPIN_TIME_MAX = settings.get('spin_time.max');
    const SPIN_TIME_MIN = settings.get('spin_time.min');

    if (CHAR_PER_MIN === 0) {
      logger.info('sleeping is disabled');
      return true;
    }

    let waitSec = Math.floor(text.length / CHAR_PER_MIN * 60);
    waitSec = Math.max(SPIN_TIME_MIN, waitSec);
    waitSec = Math.min(SPIN_TIME_MAX, waitSec);

    logger.info(`response length = ${text.length}, sleeping for ${waitSec}s`);

    const ts = new Date().getTime();
    let newWindow = ts + waitSec * 1000;
    if (newWindow < this.window) {
      newWindow = this.window + 1000;
      waitSec = Math.floor((newWindow - ts) / 1000) + 1;

      logger.info(`due to time window, sleeping for ${waitSec}s`);
    }

    this.window = newWindow;
    await utils.sleep(waitSec);

    return true;
  }

  async transferTo(transferID) {
    let resp = null;
    try {
      resp = this.qn.transferTo(this.nick, transferID) || null;
    } catch (e) {
      logger.error(`transfer user error: ${JSON.stringify(e)}`);
    }

    logger.error(`transfer user ${JSON.stringify(resp)}`);
  }

  async reply(_text, _forceSend = false) {
    const text = _text.trim();
    let forceSend = _forceSend;

    if (text.startsWith('已重置')) {
      logger.debug('reset-command is always valid');

      forceSend = true;
    }

    const shouldReply = await this.beforeReply(text, forceSend);

    if (shouldReply === false) {
      return {
        succeeded: false,
        operations: [],
      }
    }

    if (settings.get('interrrupt')) {
      logger.debug('interrupt mode: on');
      forceSend = true;
    }

    const { nick, qn } = this;
    const sentences = text.split(SEP).map(part => part.trim()).filter(part => part.length !== 0);
    const resp = qn.send('cntaobao', nick, sentences, forceSend);
    logger.info(`send-msg ${JSON.stringify(resp)} [${nick}] [${text}]`);
    return resp;
  }
}
