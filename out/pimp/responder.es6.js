const { logger } = require('../logger.es6');
const { settings } = require('../settings.es6');

export class DialogResponder {
  async onDispatch(customer, prompt, to, target) {
    if (settings.get('skip_q')) {
      logger.info(`skip q enabled [${customer.customerID}@[${target}]]`);
      return;
    }

    customer.setManualMode();
  }

  async onResponse(customer, prompt, signal) {
    if (signal === 'DialogueSwitched') {
      customer.switchToDialogue();
    }
    const resp = await customer.reply(prompt, false);
    logger.info(`response ${customer.customerID} with ${prompt}`);
    return resp;
  }
}

export class NightwatchResponder extends DialogResponder {
  constructor(...args) {
    super();
    const _len = args.length;
    const _args = new Array(_len);
    let _key = 0;
    for (; _key < _len; _key += 1) {
      _args[_key] = args[_key];
    }
  }

  async onDispatch(customer, prompt) {
    await customer.reply(prompt || '亲~ 这个问题要等明天专业的客服上班才能解答哦', false);

    logger.info(`nightwatch ${customer.customerID} with ${prompt} succeeded`)
  }
}
