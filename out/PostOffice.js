"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _events = _interopRequireDefault(require("events"));

var _uuid = _interopRequireDefault(require("uuid"));

var _ws = _interopRequireDefault(require("ws"));

var _logger = require("./logger");

var ALIVE_S = 60 * 1000;
var CHECK_S = 10 * 1000;

var sleep = function sleep(nSeconds) {
  return new Promise(function (resolve, reject) {
    _logger.logger.verbose("sleeping for [".concat(nSeconds, "]s"));

    setTimeout(function () {
      _logger.logger.verbose("slept for [".concat(nSeconds, "]s"));

      resolve(nSeconds);
    }, nSeconds * 1000);
  });
};

var SERVICE_MODES = {
  NORMAL: 'normal',
  NIGHTWATCH: 'nightwatch',
  DISPATCH: 'transfer'
};

var Postoffice =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2.default)(Postoffice, _EventEmitter);

  function Postoffice() {
    var _this;

    var useSameConnectionID = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    (0, _classCallCheck2.default)(this, Postoffice);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Postoffice).call(this));
    _this.ws = null;
    _this.alive = null;
    _this.checkID = null;
    _this.idCounter = 0;
    _this.queryCounter = {};
    _this.questionCounter = {};
    _this.useSameConnectionID = useSameConnectionID;
    _this.connectionID = _uuid.default.v4();
    _this.authToken = null;
    _this._closing = null;
    _this.serviceMode = SERVICE_MODES.NORMAL;
    _this.requestPool = {};
    _this.connectInfo = {};
    _this.started = false;
    return _this;
  }

  (0, _createClass2.default)(Postoffice, [{
    key: "switchToDispatch",
    value: function switchToDispatch() {
      this.serviceMode = SERVICE_MODES.DISPATCH;
    }
  }, {
    key: "switchToNightwatch",
    value: function switchToNightwatch() {
      this.serviceMode = SERVICE_MODES.NIGHTWATCH;
    }
  }, {
    key: "switchToNormal",
    value: function switchToNormal() {
      this.serviceMode = SERVICE_MODES.NORMAL;
    }
  }, {
    key: "tearDown",
    value: function tearDown() {
      var _this2 = this;

      if (this.ws === null || this.ws.readyState !== _ws.default.OPEN) {
        this.ws = null;
        return Promise.resolve();
      }

      return new Promise(function (resolve, reject) {
        _this2._closing = resolve;

        _this2.ws.close();
      });
    }
  }, {
    key: "reconnect",
    value: function () {
      var _reconnect = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee() {
        var retryInterval,
            _args = arguments;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                retryInterval = _args.length > 0 && _args[0] !== undefined ? _args[0] : 5;

              case 1:
                if (!(this.authToken === null)) {
                  _context.next = 15;
                  break;
                }

                _context.prev = 2;
                _context.next = 5;
                return sleep(retryInterval);

              case 5:
                _logger.logger.info('setting up');

                _context.next = 8;
                return this.setup();

              case 8:
                _context.next = 13;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](2);

                _logger.logger.error("reconnect failed, retry after ".concat(retryInterval, "s"), _context.t0);

              case 13:
                _context.next = 1;
                break;

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 10]]);
      }));

      return function reconnect() {
        return _reconnect.apply(this, arguments);
      };
    }()
  }, {
    key: "checkAlive",
    value: function checkAlive() {
      _logger.logger.verbose('checking alive flag...');

      if (this.alive === null) {
        _logger.logger.verbose('alive flag is null');

        return;
      } else if (new Date() - this.alive < ALIVE_S) {
        _logger.logger.verbose("last ping: ".concat(this.alive));

        return;
      }

      if (this.checkID) {
        clearInterval(this.checkID);
      }

      this.alive = null;
      this.checkID = null;
      this.authToken = null;

      _logger.logger.error('missing too much ping, consider connection is down');

      this.emit('postoffice-unexpected-close');
      this.reconnect();
    }
  }, {
    key: "setup",
    value: function setup(_url, _authenticationToken) {
      var _this3 = this;

      var _this$connectInfo = this.connectInfo,
          url = _this$connectInfo.url,
          authenticationToken = _this$connectInfo.authenticationToken;
      url = url || _url;
      authenticationToken = authenticationToken || _authenticationToken;
      this.connectInfo = {
        url: url,
        authenticationToken: authenticationToken
      };
      return this.connect(url).then(function () {
        return _this3.authorize(authenticationToken);
      }).then(function () {
        _logger.logger.info('setting up ping check');

        _this3.checkID = setInterval(function () {
          return _this3.checkAlive();
        }, CHECK_S);
      });
    }
  }, {
    key: "connect",
    value: function connect(url) {
      var _this4 = this;

      _logger.logger.verbose("prepare to connect [".concat(url, "]"));

      if (!this.useSameConnectionID) {
        this.connectionID = _uuid.default.v4();
      }

      return this.tearDown().then(function () {
        _logger.logger.verbose("connecting to ".concat(url));

        _this4._closing = null;
        return new Promise(function (resolve, reject) {
          var ws = new _ws.default(url, {
            headers: {
              'X-Connection-ID': _this4.connectionID
            }
          });
          ws.on('ping', function (event) {
            if (_this4.checkID === null) {
              return;
            }

            _logger.logger.verbose("ping received, i'm alive");

            _this4.alive = new Date();
          });
          ws.on('error', function (event) {
            _logger.logger.error("[".concat(event, "](").concat(_this4.connectInfo.url, ")"));

            _this4.authToken = null;
            _this4._closing = true;

            _this4.emit('postoffice-unexpected-close');

            if (_this4.started) {
              _this4.reconnect();
            } else {
              throw new Error(event);
            }
          });
          ws.on('close', function (event) {
            _this4.authToken = null;

            if (_this4._closing === null) {
              _logger.logger.error('unexpected closing');

              _this4.emit('postoffice-unexpected-close');

              _this4.reconnect();
            } else {
              _this4.emit('postoffice-closed');

              try {
                _this4._closing();
              } catch (e) {
                _logger.logger.error('closing failed');
              }
            }
          });
          ws.on('open', function (event) {
            _this4.started = true;
            _this4.alive = new Date();
            resolve(ws);
          });
        });
      }).then(function (ws) {
        _this4.ws = ws;
        ws.on('message', function (data) {
          _logger.logger.info('message received', data);

          var message = null;

          try {
            message = JSON.parse(data);
          } catch (e) {
            _logger.logger.error('invalid json-prc', data);

            message = {};
          }

          if (message.fn !== undefined && (0, _typeof2.default)(message.args) === 'object') {
            _logger.logger.info("server request received: ".concat(message.fn));

            _this4.emit(message.fn, (0, _objectSpread2.default)({
              serviceMode: _this4.serviceMode
            }, message.args, {
              id: message.id,
              ws: ws
            }));
          } else if (message.id !== undefined) {
            var request = _this4.requestPool[message.id];

            if (request === undefined) {
              _logger.logger.warn("unknown response for [".concat(message.id, "] found"));

              return;
            }

            _logger.logger.profile(request.reqID);

            if (message.result !== undefined) {
              request.resolve(message.result);
            } else if (message.error !== undefined) {
              request.reject(message.error);
            } else {
              request.reject("malformed json-rpc ".concat(data));
            }
          } else {
            _logger.logger.error("malformed json-rpc ".concat(data));
          }
        });
      });
    }
  }, {
    key: "authorize",
    value: function authorize(authenticationToken) {
      var _this5 = this;

      if (this.authToken !== null) {
        _logger.logger.warn('already authorized');

        return Promise.resolve(true);
      }

      _logger.logger.verbose('trying to get authentication token');

      return this.sendRequest('Agent.AuthenticateByToken', {
        AuthenticationToken: authenticationToken,
        ConnectionID: "".concat(this.connectionID)
      }, true).then(function (_ref) {
        var Token = _ref.Token,
            Success = _ref.Success;
        return new Promise(function (resolve, reject) {
          if (Success) {
            _this5.authToken = Token;

            _logger.logger.verbose('agent authorized');

            resolve(Token);
          } else {
            reject('agent authorized failed');
          }
        });
      });
    }
  }, {
    key: "sendRequest",
    value: function sendRequest(method, param) {
      var _this6 = this;

      var forceSend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var id = ++this.idCounter;

      var reqID = this._getReqID(id);

      _logger.logger.verbose("sending request: ".concat(method, " [").concat(reqID, "]"));

      var data = {
        id: "".concat(id),
        fn: method,
        args: param
      };

      _logger.logger.debug('sending', data);

      _logger.logger.profile(reqID);

      return new Promise(function (resolve, reject) {
        _this6.requestPool[id] = {
          ts: new Date(),
          id: id,
          reqID: reqID,
          data: data,
          resolve: resolve,
          reject: reject
        };
        return _this6._send(data, forceSend, reject);
      });
    }
  }, {
    key: "_send",
    value: function _send(data, forceSend, reject) {
      var _this7 = this;

      if (this.authToken === null && forceSend === false) {
        setTimeout(function () {
          _logger.logger.warn('client not authorized, try again in 1s');

          _this7._send(data, forceSend, reject);
        }, 1000);
        return;
      }

      data.args.Token = this.authToken;
      var payload = JSON.stringify(data);
      var tip = 'error sending message to agent';

      try {
        this.ws.send(payload, function (error) {
          if (error) {
            _logger.logger.error(tip, error);

            reject(tip);
          }
        });
      } catch (error) {
        _logger.logger.error(tip, error);

        reject(tip);
      }
    }
  }, {
    key: "sendSignal",
    value: function sendSignal(userID, signal) {
      return this.call('Dialogue.Question', userID, 'outgoing', '', signal);
    }
  }, {
    key: "question",
    value: function question(userID, type, query) {
      var signal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
      return this.call('Dialogue.Question', userID, type, query, signal);
    }
  }, {
    key: "mono",
    value: function mono(userID, type, query) {
      var signal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
      return this.call('Dialogue.MonoTurn', userID, type, query, signal);
    }
  }, {
    key: "syncMessages",
    value: function syncMessages(userID, messages, manualMode, timestamp, timeoffset) {
      return this.sendRequest('Dialogue.SyncMessages', {
        UserID: userID,
        MessagesJSON: JSON.stringify(messages),
        ServiceMode: this.serviceMode,
        ManualMode: manualMode,
        ClientTimestamp: timestamp,
        ClientTimeOffset: timeoffset
      });
    }
  }, {
    key: "call",
    value: function call(method, UserID, Type, Query, Signal) {
      _logger.logger.info("".concat(method, " for [").concat(UserID, "] [").concat(Query, "]"));

      return this.sendRequest(method, (0, _objectSpread2.default)({}, this._getQueryID(UserID, Type === 'incoming'), {
        Query: Query,
        Type: Type,
        UserID: UserID,
        Signal: Signal
      }));
    }
  }, {
    key: "_getQueryID",
    value: function _getQueryID(userID, isQuestion) {
      if (this.queryCounter[userID] === undefined) {
        this.queryCounter[userID] = 0;
      }

      var info = {
        DialogueID: this.queryCounter[userID]++,
        QuestionID: 0,
        ServiceMode: this.serviceMode,
        SessionMode: 'auto',
        Timestamp: Math.round(new Date().getTime() / 1000)
      };

      if (isQuestion) {
        if (this.questionCounter[userID] === undefined) {
          this.questionCounter[userID] = 0;
        }

        info.QuestionID = this.questionCounter[userID]++;
      }

      return info;
    }
  }, {
    key: "_getReqID",
    value: function _getReqID(id) {
      return "Request#".concat(id);
    }
  }]);
  return Postoffice;
}(_events.default);

var _default = Postoffice;
exports.default = _default;