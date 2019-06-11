const _customer = require('./customer.es6');
const { logger } = require('../logger.es6');

export default class CustomerService {
  constructor(_qn, _postman) {
    this.customers = {};
    this.qn = _qn;
    this.postman = _postman;
  }

  getNext() {
    const customers = this;
    let firstCustomer = null;
    let capacity = 0;

    const _arr = Object.keys(customers);

    for (let _i = 0; _i < _arr.length; _i += 1) {
      const uid = _arr[_i];
      const customer = customers[uid];
      const { botReplied, visited } = customer;

      // eslint-disable-next-line no-continue
      if (botReplied === null || visited) continue;

      capacity += 1;

      if (firstCustomer === null || botReplied < firstCustomer.botReplied) {
        firstCustomer = customer;
      }
    }

    return {
      customer: firstCustomer,
      capacity,
    }
  }

  getCustomer(uid) {
    let customer = this.customers[uid];

    if (customer === undefined) {
      const { qn, postman } = this;
      customer = new _customer.Customer(qn, postman, uid);
      this.customers[uid] = customer;
    }

    return customer;
  }

  syncMessages(uid, msgs, timestamp, offset) {
    this.getCustomer(uid).syncMessages(msgs, timestamp, offset);
  }

  onNewMessage(msg) {
    const { aid } = this.qn;
    const nick = `cntaobao${aid}`;
    const {
      fromID, toID, incoming, msgContent,
    } = msg;
    if (incoming) {
      if (toID !== nick) {
        logger.warn(`keep message from other assistant: [${toID}]: ${msgContent}`);
      }

      this.getCustomer(fromID).ask(msgContent);
    } else {
      if (fromID !== nick) {
        logger.warn(`drop message from othe assistant: [${fromID}]: ${msgContent}`);
        return;
      }

      this.getCustomer(toID).outgoing(msgContent);
    }
  }

  onConversationClose(appkey, nick) {
    const customer = this.getCustomer(`${appkey}${nick}`);

    customer.onClose();
  }
}
