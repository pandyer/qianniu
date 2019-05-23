"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Responder = require("./Responder");

var _logger = require("../logger");

var SEP = /-=-=-=-=-=-/g;
var UI_MODES = {
  DIALOG: 'dialog',
  NIGHTWATCH: 'nightWatch'
};
var MODES = {
  DIALOG: 'normal',
  NIGHTWATCH: 'nightwatch',
  DISPATCH: 'dispatch'
};

var Postman = function Postman(qn, postOffice) {
  var _this = this;

  var defaultPrompt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '智能提示: 目前接待量大 等待时间较长 请将问题留言 客服会第一时间回复';
  (0, _classCallCheck2.default)(this, Postman);
  (0, _defineProperty2.default)(this, "getDispatchMode", function () {
    return _this.mode;
  });
  (0, _defineProperty2.default)(this, "setDispatchMode", function (dispatchMode) {
    switch (dispatchMode) {
      case MODES.DISPATCH:
        _this.mode = dispatchMode;

        _this.postOffice.switchToDispatch();

        break;

      case MODES.NIGHTWATCH:
        _this.mode = dispatchMode;

        _this.postOffice.switchToNightwatch();

        break;

      default:
        _this.postOffice.switchToNormal();

        _this.mode = MODES.DIALOG;
    }

    return _this.mode;
  });
  (0, _defineProperty2.default)(this, "suitUp", function (customerService) {
    _this.started = true;

    _this.changeMode(UI_MODES.DIALOG);

    var SUCCEEDED = 200;
    var CLIENT_ERROR = 400;

    _this.postOffice.on('Client.Invoke',
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(payload) {
        var ws, id, app, method, paramsJson, response, params, _ref2, succeeded, proxyResponse, message;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                ws = payload.ws, id = payload.id, app = payload.App, method = payload.Method, paramsJson = payload.ParamsJson;
                response = {
                  id: id,
                  error: null,
                  result: {
                    Code: CLIENT_ERROR,
                    ErrorMsg: 'falied to execute'
                  }
                };
                _context.prev = 2;
                params = JSON.parse(paramsJson);
                _context.next = 6;
                return _this.qn.proxy(app, method, params);

              case 6:
                _ref2 = _context.sent;
                succeeded = _ref2.succeeded;
                proxyResponse = _ref2.response;
                message = _ref2.message;

                if (succeeded) {
                  response.result.Code = SUCCEEDED;
                  response.result.ErrorMsg = 'ok';
                } else {
                  response.result.Code = CLIENT_ERROR;
                  response.result.ErrorMsg = JSON.stringify(message);
                }

                response.result.ResponseJson = JSON.stringify(proxyResponse);
                _context.next = 17;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context["catch"](2);
                response.result.ErrorMsg = _context.t0;

              case 17:
                ws.send(JSON.stringify(response));

              case 18:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 14]]);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());

    _this.postOffice.on('Dialogue.Prompt',
    /*#__PURE__*/
    function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(params) {
        var fields, ws, id, serviceMode, userID, signal, sentences, content, responder, customer, textSentences, imageSentences, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, raw, _raw$Value, text, image, dispatchTo, dispatchTarget, transferID, dispatchMsg, nativeSucceeded, resp;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                fields = Object.keys(params).filter(function (field) {
                  return !['ws', 'id'].includes(field);
                });

                _logger.logger.info("server response: ".concat(JSON.stringify(params, fields)));

                _logger.logger.info("sentence response: ".concat(JSON.stringify(params.Sentences)));

                ws = params.ws, id = params.id, serviceMode = params.serviceMode, userID = params.UserID, signal = params.Signal;
                sentences = params.Sentences, content = params.Prompt;
                ws.send(JSON.stringify({
                  id: id,
                  error: null,
                  result: {}
                }));
                responder = _this.getResponder(serviceMode);
                customer = customerService.getCustomer(userID);
                textSentences = [];
                imageSentences = [];

                if (!(Array.isArray(sentences) && sentences.length > 0)) {
                  _context2.next = 33;
                  break;
                }

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context2.prev = 14;

                for (_iterator = sentences[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  raw = _step.value;
                  _raw$Value = raw.Value, text = _raw$Value.Text, image = _raw$Value.Image;

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

                _context2.next = 22;
                break;

              case 18:
                _context2.prev = 18;
                _context2.t0 = _context2["catch"](14);
                _didIteratorError = true;
                _iteratorError = _context2.t0;

              case 22:
                _context2.prev = 22;
                _context2.prev = 23;

                if (!_iteratorNormalCompletion && _iterator.return != null) {
                  _iterator.return();
                }

              case 25:
                _context2.prev = 25;

                if (!_didIteratorError) {
                  _context2.next = 28;
                  break;
                }

                throw _iteratorError;

              case 28:
                return _context2.finish(25);

              case 29:
                return _context2.finish(22);

              case 30:
                content = textSentences.map(function (s) {
                  return s.text;
                });
                _context2.next = 35;
                break;

              case 33:
                content = content.split(SEP).map(function (s) {
                  return s.trim();
                }).filter(function (s) {
                  return s.length !== 0;
                });
                textSentences = content.map(function (text) {
                  return {
                    type: 'text',
                    text: text
                  };
                });

              case 35:
                _context2.t1 = signal;
                _context2.next = _context2.t1 === 'DyneWait' ? 38 : _context2.t1 === 'DialogCallIn' ? 38 : 40;
                break;

              case 38:
                _logger.logger.info("signal found: ".concat(signal));

                return _context2.abrupt("return");

              case 40:
                dispatchTo = params.DispatchTo, dispatchTarget = params.DispatchTarget, transferID = params.TransferToAssistantID;
                dispatchMsg = dispatchTo !== 'None';

                if (!transferID) {
                  _context2.next = 48;
                  break;
                }

                _context2.next = 45;
                return _this.qn.send('cntaobao', customer.nick, content, true);

              case 45:
                _context2.next = 47;
                return customer.transferTo(transferID);

              case 47:
                return _context2.abrupt("return");

              case 48:
                if (!dispatchMsg && !content) {
                  _logger.logger.error("empty prompt found: ".concat(JSON.stringify(params, fields)));

                  dispatchTarget = _this.defaultDispatchTarget;
                  dispatchMsg = true;
                }

                if (!(signal === 'DyneAction')) {
                  _context2.next = 77;
                  break;
                }

                if (!dispatchMsg) {
                  _context2.next = 53;
                  break;
                }

                _logger.logger.error('ignore dyne action that is dispatching');

                return _context2.abrupt("return");

              case 53:
                nativeSucceeded = false;
                _context2.prev = 54;
                _context2.next = 57;
                return _this.qn.sendSentences(customer.nick, textSentences);

              case 57:
                nativeSucceeded = _context2.sent;
                _context2.next = 63;
                break;

              case 60:
                _context2.prev = 60;
                _context2.t2 = _context2["catch"](54);

                _logger.logger.error('send text error');

              case 63:
                if (nativeSucceeded) {
                  _context2.next = 66;
                  break;
                }

                _context2.next = 66;
                return _this.qn.send('cntaobao', customer.nick, content, true);

              case 66:
                if (!(imageSentences.length !== 0)) {
                  _context2.next = 75;
                  break;
                }

                _context2.prev = 67;
                _context2.next = 70;
                return _this.qn.sendSentences(customer.nick, imageSentences);

              case 70:
                _context2.next = 75;
                break;

              case 72:
                _context2.prev = 72;
                _context2.t3 = _context2["catch"](67);

                _logger.logger.error('send image error');

              case 75:
                _context2.next = 98;
                break;

              case 77:
                if (!dispatchMsg) {
                  _context2.next = 82;
                  break;
                }

                _context2.next = 80;
                return responder.onDispatch(customer, content.join(SEP.source) || _this.defaultPrompt, dispatchTo, dispatchTarget);

              case 80:
                _context2.next = 98;
                break;

              case 82:
                if (!(sentences.length > 0)) {
                  _context2.next = 96;
                  break;
                }

                _context2.next = 85;
                return responder.onResponse(customer, content.join(SEP.source), signal);

              case 85:
                resp = _context2.sent;

                if (resp.succeeded) {
                  _context2.next = 89;
                  break;
                }

                _logger.logger.error("send sentence to ".concat(customer.nick, " failed"));

                return _context2.abrupt("return");

              case 89:
                if (resp.operations.includes('suggest')) {
                  _context2.next = 94;
                  break;
                }

                _context2.next = 92;
                return _this.qn.sendSentences(customer.nick, imageSentences);

              case 92:
                _context2.next = 94;
                return _this.qn.send('cntaobao', customer.nick, [''], false);

              case 94:
                _context2.next = 98;
                break;

              case 96:
                _context2.next = 98;
                return responder.onResponse(customer, content.join(SEP.source), signal);

              case 98:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[14, 18, 22, 30], [23,, 25, 29], [54, 60], [67, 72]]);
      }));

      return function (_x2) {
        return _ref3.apply(this, arguments);
      };
    }());
  });
  (0, _defineProperty2.default)(this, "changeMode", function (mode) {
    switch (mode) {
      case UI_MODES.DIALOG:
        _this.postOffice.switchToNormal();

        break;

      case UI_MODES.NIGHTWATCH:
        _this.postOffice.switchToNightwatch();

        break;

      default:
        throw new Error("unknown mode: ".concat(mode));
    }

    _logger.logger.info("current mode M: ".concat(mode));

    return mode;
  });
  (0, _defineProperty2.default)(this, "sendEscSignal", function (customerID) {
    if (!_this.started) return Promise.resolve(null);

    _logger.logger.info("send esc signal for ".concat(customerID));

    return _this.postOffice.sendSignal(customerID, 'AssistantEsc');
  });
  (0, _defineProperty2.default)(this, "syncMessages", function (customerID, messages, manualMode, timestamp, offset) {
    if (!_this.started) return Promise.resolve(null);

    _logger.logger.info("sync messages for ".concat(customerID, " x").concat(messages.messages.length));

    return _this.postOffice.syncMessages(customerID, messages, manualMode, timestamp, offset);
  });
  (0, _defineProperty2.default)(this, "ask", function (customerID, type, content) {
    if (!_this.started) return Promise.resolve(null);

    _logger.logger.info("send normal question for ".concat(customerID, "@[").concat(content, "]"));

    return _this.postOffice.question(customerID, type, content);
  });
  (0, _defineProperty2.default)(this, "mono", function (customerID, type, content) {
    if (!_this.started) return Promise.resolve(null);

    _logger.logger.info("send mono question for ".concat(customerID, "@[").concat(content, "]"));

    return _this.postOffice.mono(customerID, type, content);
  });
  (0, _defineProperty2.default)(this, "outgoing", function (customerID, content) {
    _logger.logger.info("log outgoing message ".concat(customerID, "@[").concat(content, "]"));

    return _this.postOffice.question(customerID, 'outgoing', content);
  });
  this.qn = qn;
  this.defaultDispatchTarget = 'Normal';
  this.defaultPrompt = defaultPrompt;
  this.postOffice = postOffice;
  this.started = false;
  var dialogResponder = new _Responder.DialogResponder();
  var nightwatchResponder = new _Responder.NightwatchResponder(); // FIXME: 暂时先这么用吧

  this.mode = MODES.DIALOG;

  this.getResponder = function (mode) {
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
};

var _default = Postman;
exports.default = _default;