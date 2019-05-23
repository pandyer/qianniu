const Responder = require('./Responder');
const { logger } = require('../logger');

const UI_MODES = {
  DIALOG: 'dialog',
  NIGHTWATCH: 'nightWatch'
};
const MODES = {
  DIALOG: "normal",
  NIGHTWATCH: 'nightwatch',
  DISPATCH: 'dispatch'
};

export class Postman {
  constructor(props) {
    this.postOffice = props.postOffice;
    this.qn = props.qn;
    this.defaultPrompt = '智能提示: 目前接待量大 等待时间较长 请将问题留言 客服会第一时间回复';
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
  suitUp(customerService) {
    this.changeMode(UI_MODES.DIALOG);

    this.postOffice.on('Client.Invoke', async (payload) => {
      const { ws, id } = payload;
      const app = payload.App;
      const method = payload.Method;
      const paramsJson = payload.paramsJson;
      const response = {
        id,
        error: null,
        result: {
          Code: CLIENT_ERROR,
          ErrorMsg: 'failed to execute'
        }
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
      let fields = Object.keys(params).filter(field => !['ws', 'id'].includes(field));

      logger.info(`server response: ${JSON.stringify(params, fields)}`);

      logger.info(`sentence response: ${JSON.stringify(params.Sentences)}`);

      const { ws, id, serviceMode } = params;
      const userID = params.UserID;
      const signal = params.Signal;
      const sentences = params.Sentences;
      const content = params.Prompt;
      ws.send(JSON.stringify({
        id,
        error: null,
        result: {}
      }));
      const responder = this.getResponder(serviceMode);
      const customer = customerService.getCustomer(userID);
      const textSentences = [];
      const imageSentences = [];

      if (Array.isArray(sentences) && sentences.length > 0) {
        for (raw of sentences) {
          const text = raw.Value.Text;
          const image = raw.Value.Image;

          if (text !== undefined) {
            textSentences.push({
              type: 'text',
              text: text.content || ''
            });
          } else if (image !== undefined) {
            imageSentences.push({
              type: 'image',
              imageID: image.image_id || ''
            });
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
        break;
    }

    logger.info(`current mode M: ${mode}`)
  }
}