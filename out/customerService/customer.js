"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Customer = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _url = require("url");

var _logger = require("../logger");

var _settings = require("../settings");

var _utils = require("../utils");

var _Shop = _interopRequireDefault(require("../Shop"));

var SYS_MSGS = [/^系统提示: 用户 /, /degrade/];
var MASKS = [/（对方正在使用.*收发消息）/];
var LINK_RE = /(https?:\/\/item\.taobao\.com\/item\.htm[\S]+)/;
var SEP = /-=-=-=-=-=-/g;

var processQuestion = function processQuestion(question) {
  question = question.replace("\x02", '');
  question = (0, _utils.translate)(question).trim();

  if (question === '') {
    return '';
  }

  for (var _i = 0; _i < SYS_MSGS.length; _i++) {
    var ptn = SYS_MSGS[_i];

    if (ptn.test(question)) {
      _logger.logger.info("[".concat(question, "] is a system message"));

      return '';
    }
  }

  for (var _i2 = 0; _i2 < MASKS.length; _i2++) {
    var _ptn = MASKS[_i2];
    question = question.replace(_ptn, '');
  }

  return question.trim();
};

var Customer = function Customer(_qn, postman, _customerID) {
  var _this = this;

  (0, _classCallCheck2.default)(this, Customer);
  (0, _defineProperty2.default)(this, "doReset", function () {
    _this.reseting = false;
    _this.manualMode = false;

    _logger.logger.info("customer [".concat(_this.customerID, "] resetted"));
  });
  (0, _defineProperty2.default)(this, "reset", function () {
    var resetNow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var reseting = _this.reseting,
        manualMode = _this.manualMode;

    if (resetNow) {// FIXME
    } else if (reseting) {
      // already in reseting process
      return _this;
    } else if (!manualMode) {
      // reset only in manual mode
      return _this;
    }

    var cooldown = _settings.settings.get('cooldown');

    _logger.logger.info("going to reset customer [".concat(_this.customerID, "] in [").concat(cooldown, "]s"));

    _this.reseting = true;
    (0, _utils.sleep)(cooldown).then(function () {
      return _this.doReset();
    });
    return _this;
  });
  (0, _defineProperty2.default)(this, "sendEscSignal", function () {
    _this.postman.sendEscSignal(_this.customerID).catch(function (e) {
      _logger.logger.error("send esc failed: ".concat(_this.customerID));
    });
  });
  (0, _defineProperty2.default)(this, "onClose", function () {
    _this.sendEscSignal();

    return _this.reset();
  });
  (0, _defineProperty2.default)(this, "switchToDialogue", function () {
    if (_this.manualMode) {
      _logger.logger.info("customer [".concat(_this.customerID, "] switch back to DIALOGUE-MODE"));

      _this.doReset();
    }
  });
  (0, _defineProperty2.default)(this, "setManualMode", function () {
    _logger.logger.info("set customer [".concat(_this.customerID, "] to manual mode"));

    _this.manualMode = true;
    return _this;
  });
  (0, _defineProperty2.default)(this, "beforeAsk", function (question) {
    var customerID = _this.customerID;

    if (_Shop.default.isSubAccount(customerID)) {
      _logger.logger.info("".concat(customerID, " is subaccount"));

      return false;
    } else if (question.length === 0) {
      _logger.logger.info('empty question found');

      return false;
    } else if (question === '重置') {
      _logger.logger.info('you can always use reset');

      _this.doReset();

      return true;
    }

    return true;
  });
  (0, _defineProperty2.default)(this, "callWingman", function (question) {
    // FIXME
    var link = LINK_RE.exec(question);

    if (link !== null) {
      var params = (0, _utils.getQueryParams)(link[1]);

      if (params.id) {
        _this.qn.notifySpu(_this.customerID, params.id);
      }
    }
  });
  (0, _defineProperty2.default)(this, "isDuplicatedItem", function (link) {
    // FIXME
    if (link.startsWith('http')) {
      var url = new _url.URL(link);
      var item = url.searchParams.get('id');

      if (url.host === 'item.taobao.com') {
        if (item === _this.lastItem) {
          return true;
        }

        _this.lastItem = item;
        return false;
      }
    }

    _this.lastItem = null;
    return false;
  });
  (0, _defineProperty2.default)(this, "syncMessages", function (messages, timestamp, offset) {
    return _this.postman.syncMessages(_this.customerID, messages, _this.manualMode, timestamp, offset).catch(function (e) {
      _logger.logger.error("error sync message: ".concat(e));
    });
  });
  (0, _defineProperty2.default)(this, "ask", function (question) {
    question = processQuestion(question);

    _this.callWingman(question);

    if (_this.isDuplicatedItem(question)) {
      question = '';
    }

    if (_this.beforeAsk(question)) {
      if (_this.manualMode) {
        return _this.postman.mono(_this.customerID, 'incoming', question);
      } else {
        return _this.postman.ask(_this.customerID, 'incoming', question);
      }
    }

    return Promise.resolve('question skipped');
  });
  (0, _defineProperty2.default)(this, "outgoing",
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(text) {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (text.includes("\x02")) {
                _this.botReplied = new Date().getTime();

                _logger.logger.debug("bot message: [".concat(_this.nick, "]-[").concat(text, "]"));
              } else {
                _this.botReplied = null;
              }

              _this.postman.outgoing(_this.customerID, text);

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "beforeReply",
  /*#__PURE__*/
  function () {
    var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(text) {
      var forceSend,
          sentences,
          CHAR_PER_MIN,
          SPIN_TIME_MAX,
          SPIN_TIME_MIN,
          waitSec,
          ts,
          newWindow,
          _args2 = arguments;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              forceSend = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : false;
              text = text.trim();

              if (!(text === '')) {
                _context2.next = 5;
                break;
              }

              _logger.logger.info("empty reply content for ".concat(_this.customerID));

              return _context2.abrupt("return", false);

            case 5:
              if (!forceSend) {
                _context2.next = 8;
                break;
              }

              _logger.logger.info("forceSend [".concat(text, "]"));

              return _context2.abrupt("return", true);

            case 8:
              if (!_this.manualMode) {
                _context2.next = 14;
                break;
              }

              sentences = text.split(SEP).map(function (part) {
                return part.trim();
              }).filter(function (part) {
                return part.length !== 0;
              });
              _context2.next = 12;
              return _this.qn.suggest('cntaobao', _this.nick, sentences.join('\n'));

            case 12:
              _logger.logger.info("[manual] suggest for [".concat(_this.customerID, "] ").concat(text));

              return _context2.abrupt("return", false);

            case 14:
              CHAR_PER_MIN = _settings.settings.get('char_per_min');
              SPIN_TIME_MAX = _settings.settings.get('spin_time.max');
              SPIN_TIME_MIN = _settings.settings.get('spin_time.min');

              if (!(CHAR_PER_MIN === 0)) {
                _context2.next = 20;
                break;
              }

              _logger.logger.info('sleeping is disabled');

              return _context2.abrupt("return", true);

            case 20:
              waitSec = Math.floor(text.length / CHAR_PER_MIN * 60);
              waitSec = Math.max(SPIN_TIME_MIN, waitSec);
              waitSec = Math.min(SPIN_TIME_MAX, waitSec);

              _logger.logger.info("response length = ".concat(text.length, ", sleeping for ").concat(waitSec, "s"));

              ts = new Date().getTime();
              newWindow = ts + waitSec * 1000;

              if (newWindow < _this.window) {
                newWindow = _this.window + 1000;
                waitSec = Math.floor((newWindow - ts) / 1000) + 1;

                _logger.logger.info("due to time window, sleeping for ".concat(waitSec, "s"));
              }

              _this.window = newWindow;
              _context2.next = 30;
              return (0, _utils.sleep)(waitSec);

            case 30:
              return _context2.abrupt("return", true);

            case 31:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "transferTo",
  /*#__PURE__*/
  function () {
    var _ref3 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(transferID) {
      var resp;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              resp = null;
              _context3.prev = 1;
              _context3.next = 4;
              return _this.qn.transferTo(_this.nick, transferID);

            case 4:
              resp = _context3.sent;
              _context3.next = 10;
              break;

            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3["catch"](1);

              _logger.logger.error("transfer user error: ".concat(JSON.stringify(_context3.t0)));

            case 10:
              _logger.logger.error("transfer user ".concat(JSON.stringify(resp)));

            case 11:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[1, 7]]);
    }));

    return function (_x3) {
      return _ref3.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "reply",
  /*#__PURE__*/
  function () {
    var _ref4 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(text) {
      var forceSend,
          shouldReply,
          nick,
          qn,
          sentences,
          resp,
          _args4 = arguments;
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              forceSend = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : false;
              text = text.trim();

              if (text.startsWith('已重置')) {
                _logger.logger.debug('reset-command is always valid');

                forceSend = true;
              }

              _context4.next = 5;
              return _this.beforeReply(text, forceSend);

            case 5:
              shouldReply = _context4.sent;

              if (!(shouldReply === false)) {
                _context4.next = 8;
                break;
              }

              return _context4.abrupt("return", {
                succeeded: false,
                operations: []
              });

            case 8:
              if (_settings.settings.get('interrupt')) {
                _logger.logger.debug('interrupt mode: on');

                forceSend = true;
              }

              nick = _this.nick, qn = _this.qn;
              sentences = text.split(SEP).map(function (part) {
                return part.trim();
              }).filter(function (part) {
                return part.length !== 0;
              });
              _context4.next = 13;
              return qn.send('cntaobao', nick, sentences, forceSend);

            case 13:
              resp = _context4.sent;

              _logger.logger.info("send-msg ".concat(JSON.stringify(resp), " [").concat(nick, "] [").concat(text, "]"));

              return _context4.abrupt("return", resp);

            case 16:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    return function (_x4) {
      return _ref4.apply(this, arguments);
    };
  }());

  _logger.logger.info("creating customer [".concat(_customerID, "]"));

  this.botReplied = null;
  this.visited = false;
  this.qn = _qn;
  this.postman = postman;
  this.window = 0;
  this.customerID = _customerID;
  this.nick = (0, _utils.removeUIDPrefix)(_customerID);
  this.manualMode = false; // handled by human

  this.reseting = false;
  this.dispatchPreference = [];
  this.questionUIDs = {};
  this.lastItem = null;

  _logger.logger.verbose("customer [".concat(_customerID, "] created"));
};

exports.Customer = Customer;