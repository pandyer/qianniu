"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QN = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _socket = _interopRequireDefault(require("socket.io"));

var _tcpPortUsed = _interopRequireDefault(require("tcp-port-used"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _http = require("http");

var _qnipc = require("qnipc");

var _utils = require("./utils");

var _logger = require("../logger");

var _settings = require("../settings");

var queryAuth = function queryAuth(requiredFields) {
  var authMiddleware = function authMiddleware(socket, next) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = requiredFields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var fieldName = _step.value;
        var field = socket.handshake.query[fieldName];

        if (typeof field !== 'string' || ['undefined', 'null', ''].includes(field.trim())) {
          var msg = "[".concat(socket.id, "] missing [").concat(fieldName, "]");

          _logger.logger.error(msg);

          return next(new Error(msg));
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return next();
  };

  return authMiddleware;
};

var server = (0, _http.Server)(_qnipc.app);
var io = (0, _socket.default)(server);
var chat = io.of('/chat').use(queryAuth(['assistantNick']));
var wingman = io.of('/wingman').use(queryAuth(['assistantNick', 'authToken']));

var QN = function QN() {
  var _this = this;

  (0, _classCallCheck2.default)(this, QN);
  (0, _defineProperty2.default)(this, "transferTo", function (nick, transferID) {
    var aid = _this.aid;
    return _this.proxy('top', 'taobao.qianniu.cloudkefu.forward', {
      buyer_nick: "cntaobao".concat(nick),
      from_ww_nick: "cntaobao".concat(aid),
      to_ww_nick: "cntaobao".concat(transferID)
    });
  });
  (0, _defineProperty2.default)(this, "suggest", function (appkey, nick, message) {
    _logger.logger.info("send-msg:suggest ".concat(appkey, " ").concat(nick, " ").concat(message));

    var chatClient = _this.chatClient,
        font = _this.font;

    if (chatClient === null) {
      _logger.logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: 'failed'
      });
    }

    return new Promise(function (resolve, reject) {
      chatClient.emit('send-msg:suggest', {
        appkey: appkey,
        nick: nick,
        font: font,
        message: message
      }, function (operations) {
        resolve(operations);
      });
    });
  });
  (0, _defineProperty2.default)(this, "sendSentences",
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(nick, sentences) {
      var succeeded;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _utils.hpc.sendSentences(_this.aid, nick, sentences);

            case 2:
              succeeded = _context.sent;
              return _context.abrupt("return", succeeded);

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "send", function (appkey, nick, sentences, forceSend) {
    var mode = forceSend ? 'force' : 'auto';

    _logger.logger.info("send-msg:".concat(mode, " ").concat(appkey, " ").concat(nick, " ").concat(sentences));

    var chatClient = _this.chatClient,
        font = _this.font;

    if (chatClient === null) {
      _logger.logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: "send message[".concat(mode, "] failed")
      });
    }

    return new Promise(function (resolve, reject) {
      chatClient.emit("send-msg:".concat(mode), {
        appkey: appkey,
        nick: nick,
        font: font,
        sentences: sentences
      }, function (operations) {
        resolve(operations);
      });
    });
  });
  (0, _defineProperty2.default)(this, "openChat", function (appkey, nick) {
    var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

    _logger.logger.info("going to openChat [".concat(appkey, ":").concat(nick, "]"));

    var chatClient = _this.chatClient;

    if (chatClient === null) {
      _logger.logger.warn('chat client not connected');

      return Promise.resolve({
        succeeded: false,
        error: 'chat client not connected'
      });
    }

    return new Promise(function (resolve) {
      var tid = setTimeout(function () {
        resolve({
          succeeded: false,
          message: "openChat failed, [".concat(nick, "] timeout[").concat(timeout, "s]")
        });
      }, timeout * 1000);
      chatClient.emit('openChat', {
        appkey: appkey,
        nick: nick
      }, function () {
        clearTimeout(tid);
        resolve({
          succeeded: true
        });
      });
    });
  });
  (0, _defineProperty2.default)(this, "proxy", function (app, method, params) {
    var timeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;
    var label = "[chat-proxy:".concat(method, "]");

    _logger.logger.info("".concat(label, " start"));

    var chatClient = _this.chatClient;

    if (chatClient === null) {
      _logger.logger.warn("chat client not connected");

      return Promise.resolve({
        succeeded: false,
        error: 'chat client not connected'
      });
    }

    return new Promise(function (resolve) {
      var tid = setTimeout(function () {
        var tip = "".concat(label, " timeout (").concat(timeout, "s)");

        _logger.logger.warn(tip);

        resolve({
          succeeded: false,
          message: tip
        });
      }, timeout * 1000);
      chatClient.emit('proxy', {
        app: app,
        method: method,
        params: params
      }, function (response) {
        _logger.logger.info("".concat(label, " succeeded"));

        _logger.logger.verbose("".concat(label, " response: ").concat(JSON.stringify(response)));

        clearTimeout(tid);
        resolve(response);
      });
    });
  });
  (0, _defineProperty2.default)(this, "notifySpu", function (uid, num_iid) {
    if (_this.wingmanClient === null) {
      return;
    }

    _this.wingmanClient.emit('focus-spu', {
      uid: uid,
      num_iid: num_iid
    });
  });
  (0, _defineProperty2.default)(this, "reconnect",
  /*#__PURE__*/
  (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    var qnPort, tabInfo, chatTab;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            qnPort = _this.qnPort;
            _context2.next = 3;
            return (0, _utils.listTabsWithPort)(qnPort);

          case 3:
            tabInfo = _context2.sent;

            if (!(tabInfo === null)) {
              _context2.next = 7;
              break;
            }

            _logger.logger.error("can not validate port[".concat(qnPort, "]"));

            return _context2.abrupt("return", false);

          case 7:
            chatTab = chatFinder(tabInfo.tabs);

            if (!(chatTab === null)) {
              _context2.next = 11;
              break;
            }

            _logger.logger.error("can not find chatTab of port[".concat(qnPort, "]"));

            return _context2.abrupt("return", false);

          case 11:
            _context2.prev = 11;
            _context2.next = 14;
            return (0, _utils.injectScript)(qnPort, chatTab, 'chat.local');

          case 14:
            return _context2.abrupt("return", true);

          case 17:
            _context2.prev = 17;
            _context2.t0 = _context2["catch"](11);

            _logger.logger.error("inject chat-local falied [".concat(_context2.t0, "]"));

            return _context2.abrupt("return", false);

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[11, 17]]);
  })));
  (0, _defineProperty2.default)(this, "guard",
  /*#__PURE__*/
  (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3() {
    var succeeded;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _this.guarding = true;

            _logger.logger.verbose('checking chat client...');

            if (!(_this.chatClient === null)) {
              _context3.next = 9;
              break;
            }

            _context3.next = 5;
            return _this.reconnect();

          case 5:
            succeeded = _context3.sent;

            if (succeeded) {
              _logger.logger.info("chat client reconnected");
            } else {
              _logger.logger.warn("chat client fail to reconnect");
            }

            _context3.next = 10;
            break;

          case 9:
            _logger.logger.info('chat client ok');

          case 10:
            setTimeout(function () {
              _this.guard();
            }, 10 * 1000);

          case 11:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  })));
  (0, _defineProperty2.default)(this, "setup", function (customerService, postman) {
    /** chat setup */
    chat.on('connect', function (socket) {
      _logger.logger.debug("".concat(socket.id, " connected"));

      var assistantNick = socket.handshake.query.assistantNick;
      var label = "chat(".concat(assistantNick, ")");

      _logger.logger.info("".concat(label, " joined"));

      _this.chatClient = socket;
      /** 业务逻辑 */

      socket.on('sync-messages', function (uid, msgs, timestamp, offset) {
        customerService.syncMessages(uid, msgs, timestamp, offset);
      });
      socket.on('new-message', function (msg) {
        customerService.onNewMessage(msg);
      });
      socket.on('conversation-close', function (_ref4) {
        var appkey = _ref4.appkey,
            nick = _ref4.nick;
        customerService.onConversationClose(appkey, nick);
      });
      socket.on('disconnect', function (reason) {
        _this.chatClient = null;

        _logger.logger.warn("".concat(label, " left, due to [").concat(reason, "]"));
      });

      if (_this.guarding === false) {
        _logger.logger.info('starting guarding');

        _this.guard();
      }
    });
    /** wingman setup */

    wingman.on('connect', function (socket) {
      _logger.logger.debug("".concat(socket.id, " connected"));

      var _socket$handshake$que = socket.handshake.query,
          assistantNick = _socket$handshake$que.assistantNick,
          authToken = _socket$handshake$que.authToken;
      _this.authToken = authToken;
      _this.tokenInfo = _jsonwebtoken.default.decode(authToken);
      var _this$tokenInfo = _this.tokenInfo,
          sid = _this$tokenInfo.shop_id,
          aid = _this$tokenInfo.nick;
      _this.sid = sid;
      _this.aid = aid;
      var label = "wingman(".concat(assistantNick, ")");

      _logger.logger.info("".concat(label, " joined"));

      _this.wingmanClient = socket;
      socket.on('disconnect', function (reason) {
        _this.wingmanClient = null;

        _logger.logger.warn("".concat(label, " disconnected due to [").concat(reason, "]"));
      });
      socket.on('send:force',
      /*#__PURE__*/
      function () {
        var _ref6 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee4(_ref5) {
          var appkey,
              nick,
              sentences,
              callback,
              operations,
              _args4 = arguments;
          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  appkey = _ref5.appkey, nick = _ref5.nick, sentences = _ref5.sentences;
                  callback = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : (0, _utils.noop)('knowledge');

                  _logger.logger.info("wingman knowledge: [".concat(nick, "] received"));

                  _context4.next = 5;
                  return _this.send(appkey, nick, sentences, true);

                case 5:
                  operations = _context4.sent;
                  callback(operations);

                  _logger.logger.info("wingman knowledge: [".concat(nick, "] ").concat(JSON.stringify(operations)));

                case 8:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        return function (_x3) {
          return _ref6.apply(this, arguments);
        };
      }());
      socket.on('proxy',
      /*#__PURE__*/
      function () {
        var _ref8 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee5(_ref7) {
          var app,
              method,
              params,
              callback,
              tip,
              resp,
              _args5 = arguments;
          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  app = _ref7.app, method = _ref7.method, params = _ref7.params;
                  callback = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : (0, _utils.noop)('proxy');
                  tip = null;

                  if (!(app !== 'top')) {
                    _context5.next = 8;
                    break;
                  }

                  tip = "\u4E0D\u652F\u6301\u6B64 Namespace: app=".concat(app);

                  _logger.logger.warn(tip);

                  callback({
                    succeeded: false,
                    message: tip
                  });
                  return _context5.abrupt("return");

                case 8:
                  _context5.next = 10;
                  return _this.proxy(app, method, params);

                case 10:
                  resp = _context5.sent;
                  callback(resp);

                case 12:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5, this);
        }));

        return function (_x4) {
          return _ref8.apply(this, arguments);
        };
      }());
      socket.on('customer.next',
      /*#__PURE__*/
      function () {
        var _ref10 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee6(_ref9) {
          var last,
              callback,
              tip,
              _customerService$getN,
              customer,
              capacity,
              resp,
              _args6 = arguments;

          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  last = _ref9.last;
                  callback = _args6.length > 1 && _args6[1] !== undefined ? _args6[1] : (0, _utils.noop)('customer.next');
                  tip = null;

                  if (!(last !== 'bot')) {
                    _context6.next = 8;
                    break;
                  }

                  tip = "\u4E0D\u652F\u6301\u6B64\u8FC7\u6EE4\u9009\u9879: last=".concat(last);

                  _logger.logger.warn(tip);

                  callback({
                    succeeded: false,
                    message: tip
                  });
                  return _context6.abrupt("return");

                case 8:
                  _customerService$getN = customerService.getNext(), customer = _customerService$getN.customer, capacity = _customerService$getN.capacity;

                  if (!(capacity === 0)) {
                    _context6.next = 13;
                    break;
                  }

                  callback({
                    succeeded: false,
                    remain: 0,
                    message: "\u6CA1\u6709\u66F4\u591A\u7B26\u5408\u6761\u4EF6\u7684\u5BA2\u6237"
                  });
                  _context6.next = 18;
                  break;

                case 13:
                  _context6.next = 15;
                  return _this.openChat('cntaobao', customer.nick);

                case 15:
                  resp = _context6.sent;

                  if (resp.succeeded) {
                    customer.visited = true;
                  }

                  callback((0, _objectSpread2.default)({}, resp, {
                    nick: customer.nick,
                    remain: capacity - 1
                  }));

                case 18:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6, this);
        }));

        return function (_x5) {
          return _ref10.apply(this, arguments);
        };
      }());
      socket.emit('font-config', function (prefix) {
        _this.font = prefix;
      });
      socket.on('dispatchMode:set', function (_ref11) {
        var dispatchMode = _ref11.dispatchMode;
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0, _utils.noop)('dispatchMode:set');
        callback({
          dispatchMode: postman.setDispatchMode(dispatchMode)
        });
      });
      socket.on('dispatchMode:get', function () {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : (0, _utils.noop)('dispatchMode:get');
        callback({
          dispatchMode: postman.getDispatchMode()
        });
      });
    });
    /** server setup */

    _qnipc.app.use('/filet', function (req, res) {
      res.json(_this.detail());
    });

    return new Promise(function (resolve) {
      server.listen(0, '127.0.0.1').on('listening',
      /*#__PURE__*/
      (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7() {
        var tcpPort, port, inUse;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                tcpPort = 9996;
                port = server.address().port;
                _this.serverPort = port;

                _logger.logger.info("starting listening on [".concat(port, "]"));

                _context7.next = 6;
                return _tcpPortUsed.default.check(tcpPort, '127.0.0.1');

              case 6:
                inUse = _context7.sent;

                if (inUse) {
                  _context7.next = 19;
                  break;
                }

                _context7.prev = 8;
                _context7.next = 11;
                return _qnipc.ipcNative.start(tcpPort);

              case 11:
                _context7.next = 16;
                break;

              case 13:
                _context7.prev = 13;
                _context7.t0 = _context7["catch"](8);

                _logger.logger.error("UNK ERROR: ".concat(JSON.stringify(_context7.t0)));

              case 16:
                _this.ipcOnline = true;
                _context7.next = 20;
                break;

              case 19:
                _logger.logger.warn('ipc already started');

              case 20:
                resolve(port);

              case 21:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[8, 13]]);
      })));
    });
  });
  (0, _defineProperty2.default)(this, "connect",
  /*#__PURE__*/
  (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8() {
    var tabInfo, chatTab, wingmanTab;
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            tabInfo = null;

          case 1:
            if (!true) {
              _context8.next = 12;
              break;
            }

            _context8.next = 4;
            return (0, _utils.getPort)();

          case 4:
            tabInfo = _context8.sent;

            if (!(tabInfo !== null)) {
              _context8.next = 7;
              break;
            }

            return _context8.abrupt("break", 12);

          case 7:
            _logger.logger.debug('finding available ports...');

            _context8.next = 10;
            return (0, _utils.sleep)(0.5);

          case 10:
            _context8.next = 1;
            break;

          case 12:
            _this.qnPort = tabInfo.port;
            chatTab = chatFinder(tabInfo.tabs);
            wingmanTab = wingmanFinder(tabInfo.tabs);

          case 15:
            if (!true) {
              _context8.next = 34;
              break;
            }

            _context8.prev = 16;
            _context8.next = 19;
            return (0, _utils.injectServerInfo)(_this.qnPort, chatTab, 'chat', _this.serverPort);

          case 19:
            _context8.next = 21;
            return (0, _utils.injectScript)(_this.qnPort, chatTab, 'chat.local');

          case 21:
            if (!(wingmanTab === null)) {
              _context8.next = 24;
              break;
            }

            _context8.next = 24;
            return (0, _utils.injectScript)(_this.qnPort, chatTab, 'open-plugin');

          case 24:
            return _context8.abrupt("break", 34);

          case 27:
            _context8.prev = 27;
            _context8.t0 = _context8["catch"](16);

            _logger.logger.error("Chat initialization failed: ".concat(_context8.t0));

          case 30:
            _context8.next = 32;
            return (0, _utils.sleep)(0.5);

          case 32:
            _context8.next = 15;
            break;

          case 34:
            if (!true) {
              _context8.next = 45;
              break;
            }

            _context8.next = 37;
            return (0, _utils.listTabsWithPort)(_this.qnPort);

          case 37:
            tabInfo = _context8.sent;
            wingmanTab = wingmanFinder(tabInfo.tabs);

            if (!(wingmanTab !== null)) {
              _context8.next = 41;
              break;
            }

            return _context8.abrupt("break", 45);

          case 41:
            _context8.next = 43;
            return (0, _utils.sleep)(0.5);

          case 43:
            _context8.next = 34;
            break;

          case 45:
            if (!true) {
              _context8.next = 61;
              break;
            }

            _context8.prev = 46;
            _context8.next = 49;
            return (0, _utils.injectServerInfo)(_this.qnPort, wingmanTab, 'wingman', _this.serverPort);

          case 49:
            _context8.next = 51;
            return (0, _utils.injectScript)(_this.qnPort, wingmanTab, 'wingman.local');

          case 51:
            return _context8.abrupt("break", 61);

          case 54:
            _context8.prev = 54;
            _context8.t1 = _context8["catch"](46);

            _logger.logger.warn("inject wingman.local falied try again... [".concat(_context8.t1, "]"));

          case 57:
            _context8.next = 59;
            return (0, _utils.sleep)(0.5);

          case 59:
            _context8.next = 45;
            break;

          case 61:
            _logger.logger.debug('waiting connection...');

          case 62:
            if (!true) {
              _context8.next = 69;
              break;
            }

            if (!(_this.wingmanClient !== null && _this.chatClient !== null)) {
              _context8.next = 65;
              break;
            }

            return _context8.abrupt("break", 69);

          case 65:
            _context8.next = 67;
            return (0, _utils.sleep)(0.5);

          case 67:
            _context8.next = 62;
            break;

          case 69:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this, [[16, 27], [46, 54]]);
  })));
  (0, _defineProperty2.default)(this, "detail", function () {
    return {
      application: 'filet',
      serverPort: _this.serverPort,
      qnPort: Number(_this.qnPort),
      chat: _this.chatClient !== null,
      wingmang: _this.wingmanClient !== null,
      ipc: _this.ipcOnline,
      ipcPort: _utils.hpc.port
    };
  });
  this.ipcOnline = false;
  this.ipcPort = null;
  this.qnPort = null;
  this.serverPort = null;
  this.qnPort = null;
  this.chatClient = null;
  this.wingmanClient = null;
  this.guarding = false;
  /** TMP HACK */

  this.authToken = null;
  this.sid = null;
  this.aid = null;
  this.font = '\\T';
};

exports.QN = QN;

var chatFinder = function chatFinder(tabs) {
  var chatTabs = tabs.filter(function (t) {
    return t.url.startsWith('alires:///WebUI/chatmsg/recent.html');
  });
  var result = null;

  switch (chatTabs.length) {
    case 1:
      result = chatTabs[0];
      break;

    case 0:
      _logger.logger.error("chatTab not found");

      break;

    default:
      result = chatTabs[0];

      _logger.logger.warn("multiple chatTabs[".concat(chatTabs.length, "] found"));

  }

  return result;
};

var wingmanFinder = function wingmanFinder(tabs) {
  var wingmanURL = _settings.settings.get('wingman.endpoint');

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = tabs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var tab = _step2.value;

      if (tab.url.startsWith(wingmanURL)) {
        return tab;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return null;
};