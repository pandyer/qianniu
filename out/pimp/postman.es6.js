const Responder = require('./responder.es6');
const { logger } = require('../logger.es6');

const SEP = /-=-=-=-=-=-/g;

const UI_MODES = {
  DIALOG: 'dialog',
  NIGHTWATCH: 'nightWatch',
};
const MODES = {
  DIALOG: 'normal',
  NIGHTWATCH: 'nightwatch',
  DISPATCH: 'dispatch',
};

export default class Postman {
  constructor(qn, postOffice, defaultPrompt = '智能提示: 目前接待量大 等待时间较长 请将问题留言 客服会第一时间回复') {
    this.qn = qn;
    this.postOffice = postOffice;
    this.defaultPrompt = defaultPrompt;
    this.started = false;
    this.defaultDispatchTarget = 'Normal';
    const dialogResponder = new Responder.DialogResponder();
    const nightwatchResponder = new Responder.NightwatchResponder();

    this.mode = MODES.DIALOG

    this.getResponder = (mode) => {
      switch (mode) {
      case MODES.DIALOG:
        return dialogResponder;

      case MODES.DISPATCH:
      case MODES.NIGHTWATCH:
        return nightwatchResponder;

      default:
        return dialogResponder;
      }
    };
  }

  getDispatchMode() {
    return this.mode;
  }

  setDispatchMode(dispatchMode) {
    switch (dispatchMode) {
    case MODES.DISPATCH:
      this.mode = dispatchMode;

      this.postOffice.switchToDispatch();
      break;

    case MODES.NIGHTWATCH:
      this.mode = dispatchMode;

      this.postOffice.switchToNightwatch();
      break;
    default:
      this.postOffice.switchToNormal();
      this.mode = MODES.DIALOG;
    }

    return this.mode;
  }

  suitUp(customerService) {
    this.changeMode(UI_MODES.DIALOG);
    const CLIENT_ERROR = 400;

    this.postOffice.on('Client.Invoke', async (payload) => {
      const {
        ws, id, App: app, Method: method, paramsJson,
      } = payload;
      const response = {
        id,
        error: null,
        result: {
          Code: CLIENT_ERROR,
          ErrorMsg: 'failed to execute',
        },
      };
      try {
        const params = JSON.parse(paramsJson);
        const { succeeded, proxyResponse, message } = await this.qn.proxy(app, method, params);

        if (succeeded) {
          response.result.Code = succeeded;
          response.result.ErrorMsg = 'ok';
        } else {
          response.result.Code = CLIENT_ERROR;
          response.result.ErrorMsg = JSON.stringify(message);
        }

        response.result.ResponseJson = JSON.stringify(proxyResponse);
      } catch (e) {
        response.result.ErrorMsg = e;
      }

      ws.send(JSON.stringify(response));
    });

    this.postOffice.on('Dialogue.Prompt', async (params) => {
      const fields = Object.keys(params).filter(field => !['ws', 'id'].includes(field));

      logger.info(`server response: ${JSON.stringify(params, fields)}`);

      logger.info(`sentence response: ${JSON.stringify(params.Sentences)}`);

      const {
        ws, id, serviceMode, UserID: userID, Signal: signal, Sentences: sentences,
      } = params;
      let content = params.Prompt;
      ws.send(JSON.stringify({
        id,
        error: null,
        result: {},
      }));
      const responder = this.getResponder(serviceMode);
      const customer = customerService.getCustomer(userID);
      let textSentences = [];
      const imageSentences = [];
      let dispatchTarget;
      let dispatchMsg;
      let nativeSucceeded;
      let resp;

      if (Array.isArray(sentences) && sentences.length > 0) {
        for (const raw of sentences) {
          try {
            const text = raw.Value.Text;
            const image = raw.Value.Image;

            if (text !== undefined) {
              textSentences.push({
                type: 'text',
                text: text.content || '',
              });
            } else if (image !== undefined) {
              imageSentences.push({
                type: 'image',
                imageID: image.image_id || '',
              });
            }
          } catch (e) {
            throw e;
          }
        }
      }
      content = content.split(SEP).map(s => s.trim());
      textSentences = content.map(text => ({ type: 'text', text }))
      if (signal === 'DyneWait' || signal === 'DialogCallIn') {
        logger.info(`signal found: ${signal}`);
        return;
      }
      const dispatchTo = params.DispatchTo;
      dispatchTarget = params.DispatchTarget;
      const transferID = params.TransferToAssistantID;
      dispatchMsg = dispatchTo !== 'None';
      if (transferID) {
        await this.qn.send('cntaobao', customer.nick, content, true);
        await customer.transferTo(transferID);
        return;
      }
      if (!dispatchMsg && !content) {
        logger.error('empty prompt found: '.concat(JSON.stringify(params, fields)));

        dispatchTarget = this.defaultDispatchTarget;
        dispatchMsg = true;
      }

      if (signal === 'DyneAction') {
        if (dispatchMsg) {
          await responder.onDispatch(customer, content.join(SEP.source) || this.defaultPrompt, dispatchTo, dispatchTarget);
        }
        if (sentences.length > 0) {
          resp = await responder.onResponse(customer, content.join(SEP.source), signal);
          if (!resp.succeeded) {
            logger.error(`send sentence to ${customer.nick} failed`);
            return;
          }
          if (!resp.operations.includes('suggest')) {
            await this.qn.sendSentences(customer.nick, imageSentences);
            await this.qn.send('cntaobao', customer.nick, [''], false);
          }
        }
        await responder.onResponse(customer, content.join(SEP.source), signal);
      } else {
        if (dispatchMsg) {
          logger.error('ignore dyne action that is dispatching');
          return;
        }
        nativeSucceeded = false;
        try {
          nativeSucceeded = await this.qn.sendSentences(customer.nick, textSentences);
        } catch (e) {
          logger.error('send text error');
        }
        if (!nativeSucceeded) {
          await this.qn.send('cntaobao', customer.nick, content, true);
        }
        if (imageSentences.length !== 0) {
          try {
            await this.qn.sendSentences(customer.nick, imageSentences);
          } catch (e) {
            logger.error('send image error');
          }
        }
      }
    });
  }

  changeMode(mode) {
    switch (mode) {
    case UI_MODES.DIALOG:
      this.postOffice.switchToNormal();
      break;
    case UI_MODES.NIGHTWATCH:
      this.postOffice.switchToNightwatch();
      break;
    default:
      throw new Error(`unknown mode: ${mode}`);
    }

    logger.info(`current mode M: ${mode}`)
  }

  sendEscSignal(customerID) {
    if (!this.started) return Promise.resolve(null);

    logger.info(`send esc signal for ${customerID}`);

    return this.postOffice.sendSignal(customerID, 'AssistantEsc');
  }

  syncMessages(customerID, messages, manualMode, timestamp, offset) {
    if (!this.started) return Promise.resolve(null);

    logger.info(`sync messages for ${customerID} x ${messages.messages.length}`);

    return this.postOffice.syncMessages(customerID, messages, manualMode, timestamp, offset);
  }

  ask(customerID, type, content) {
    if (!this.started) return Promise.resolve(null);

    logger.info(`send normal question for ${customerID} @[${content}]`);

    return this.postOffice.syncMessages(customerID, type, content);
  }

  mono(customerID, type, content) {
    if (!this.started) return Promise.resolve(null);

    logger.info(`send mono question for ${customerID} @[${content}]`);

    return this.postOffice.mono(customerID, type, content);
  }

  outgoing(customerID, content) {
    logger.info(`log outgoing message ${customerID} @[${content}]`);

    return this.postOffice.question(customerID, 'outgoing', content);
  }
}
