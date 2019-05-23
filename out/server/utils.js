"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPort = exports.listTabsWithPort = exports.getFiletQNPort = exports.injectScript = exports.injectServerInfo = exports.sleep = exports.noop = exports.hpc = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _adp = require("./adp");

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _axios = _interopRequireDefault(require("axios"));

var _logger = require("../logger");

var _electron = require("electron");

var session = _axios.default.create({
  timeout: 1000
});

var Downloader = function Downloader() {
  var _this = this;

  (0, _classCallCheck2.default)(this, Downloader);
  (0, _defineProperty2.default)(this, "download", function (resourceID) {
    var resourceDir = _this.resourceDir,
        session = _this.session;

    var normalizedID = _path.default.basename(resourceID);

    var dstPath = _path.default.join(resourceDir, normalizedID);

    if (_fs.default.existsSync(dstPath)) {
      return Promise.resolve(dstPath);
    }

    var writer = _fs.default.createWriteStream(dstPath);

    return session({
      url: resourceID,
      responseType: 'stream'
    }).then(function (response) {
      response.data.pipe(writer);
      return new Promise(function (resolve) {
        writer.on('finish', function () {
          resolve(dstPath);
        });
      });
    });
  });
  this.session = _axios.default.create({
    timeout: 5000,
    baseURL: 'https://uploads.bot.leyantech.com'
  });
  this.resourceDir = _path.default.join(_electron.app.getPath('userData'), 'uploads');

  if (!_fs.default.existsSync(this.resourceDir)) {
    _fs.default.mkdirSync(this.resourceDir);
  }
};

var downloader = new Downloader();

var HPC = function HPC(_port) {
  var _this2 = this;

  (0, _classCallCheck2.default)(this, HPC);
  (0, _defineProperty2.default)(this, "connect", function (port) {
    _this2.port = port;
  });
  (0, _defineProperty2.default)(this, "prepareSentences",
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(rawSentences) {
      var sentences, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, raw, sentence, imagePath;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              sentences = [];
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 4;
              _iterator = rawSentences[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context.next = 18;
                break;
              }

              raw = _step.value;
              sentence = (0, _objectSpread2.default)({}, raw);
              sentences.push(sentence);

              if (!(sentence.type === 'image')) {
                _context.next = 15;
                break;
              }

              _context.next = 13;
              return downloader.download(sentence.imageID);

            case 13:
              imagePath = _context.sent;
              sentence.image = imagePath;

            case 15:
              _iteratorNormalCompletion = true;
              _context.next = 6;
              break;

            case 18:
              _context.next = 24;
              break;

            case 20:
              _context.prev = 20;
              _context.t0 = _context["catch"](4);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 24:
              _context.prev = 24;
              _context.prev = 25;

              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }

            case 27:
              _context.prev = 27;

              if (!_didIteratorError) {
                _context.next = 30;
                break;
              }

              throw _iteratorError;

            case 30:
              return _context.finish(27);

            case 31:
              return _context.finish(24);

            case 32:
              return _context.abrupt("return", sentences);

            case 33:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[4, 20, 24, 32], [25,, 27, 31]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "sendSentences",
  /*#__PURE__*/
  function () {
    var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(assistantNick, buyerNick, rawSentences) {
      var assistantID, port, sentences;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              assistantID = Buffer.from(assistantNick).toString('base64');
              port = _this2.port;
              _context2.next = 4;
              return _this2.prepareSentences(rawSentences);

            case 4:
              sentences = _context2.sent;
              return _context2.abrupt("return", session.post("http://127.0.0.1:".concat(port, "/ipc/assistants/").concat(assistantID, "/messages"), {
                buyerNick: buyerNick,
                sentences: sentences
              }).then(function (resp) {
                var succeeded = resp.data.succeeded;

                _logger.logger.info("send message to ".concat(buyerNick, " ").concat(succeeded ? 'succeeded' : 'failed'));

                return succeeded;
              }).catch(function (e) {
                _logger.logger.error("send message to ".concat(buyerNick, " failed: ").concat(JSON.stringify(e.message)));

                return false;
              }));

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x2, _x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());
  this.port = _port;
};

var hpc = new HPC();
exports.hpc = hpc;

var loadScript = function loadScript(scriptName) {
  var scriptPath = _path.default.resolve(__dirname, 'static', "".concat(scriptName, ".js"));

  return _fs.default.readFileSync(scriptPath, 'utf-8');
};

var noop = function noop() {
  var tip = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '-';
  var label = "noop-".concat(tip);
  return function (data) {
    _logger.logger.info("".concat(label, ": ").concat(JSON.stringify(data)));
  };
};

exports.noop = noop;

var sleep = function sleep(nSec) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, nSec * 1000);
  });
};

exports.sleep = sleep;

var injectServerInfo =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(qnPort, target, name, serverPort) {
    var label, serverInfo, expression, client, resp;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            label = "Injecting ServerINFO [".concat(name, " on ").concat(qnPort, "]");
            serverInfo = JSON.stringify(JSON.stringify({
              port: serverPort,
              qn: qnPort
            }));
            expression = "(() => {localStorage.setItem('FLT_CONFIG', ".concat(serverInfo, "); return true})();");

            _logger.logger.info("".concat(label, ": Start"));

            client = new _adp.ADP(qnPort, 'page', target.targetId);
            _context3.next = 7;
            return client.connect();

          case 7:
            _context3.next = 9;
            return client.send(label, 'Runtime.evaluate', {
              expression: expression
            });

          case 9:
            resp = _context3.sent;
            client.close();

            if (!(resp.result.value !== true)) {
              _context3.next = 15;
              break;
            }

            errMsg = "".concat(label, ": Failed [").concat(JSON.stringify(resp), "]");

            _logger.logger.error(errMsg);

            throw new Error(errMsg);

          case 15:
            _logger.logger.info("".concat(label, ": Succeeded"));

          case 16:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function injectServerInfo(_x5, _x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();

exports.injectServerInfo = injectServerInfo;

var injectScript =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(qnPort, target, scriptName) {
    var label, expression, errMsg, client, resp;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            label = "Injecting Script [".concat(scriptName, " on ").concat(qnPort, "]");
            expression = loadScript(scriptName);
            errMsg = 'ok';

            _logger.logger.info("".concat(label, ": Start"));

            client = new _adp.ADP(qnPort, 'page', target.targetId);
            _context4.next = 7;
            return client.connect();

          case 7:
            _context4.next = 9;
            return client.send(label, 'Runtime.evaluate', {
              expression: expression
            });

          case 9:
            resp = _context4.sent;
            client.close();

            if (!(resp.result.value !== true)) {
              _context4.next = 15;
              break;
            }

            errMsg = "".concat(label, ": Failed ").concat(JSON.stringify(resp));

            _logger.logger.warn(errMsg);

            throw new Error(errMsg);

          case 15:
            _logger.logger.info("".concat(label, ": Succeeded"));

          case 16:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function injectScript(_x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}();

exports.injectScript = injectScript;

var getFiletQNPort =
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(portInfo) {
    var port, label, _ref6, data;

    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            port = portInfo.port;
            label = "port[".concat(portInfo.port, "]");
            _context5.prev = 2;
            _context5.next = 5;
            return session.get("http://127.0.0.1:".concat(port, "/filet"));

          case 5:
            _ref6 = _context5.sent;
            data = _ref6.data;

            if (!(data.application === 'filet' && data.qnPort !== null)) {
              _context5.next = 11;
              break;
            }

            if (data.ipc) {
              hpc.connect(data.serverPort);
            }

            _logger.logger.debug("".concat(label, ": good=filet QN[").concat(data.qnPort, "]"));

            return _context5.abrupt("return", data.qnPort);

          case 11:
            _logger.logger.debug("port[".concat(port, "]: bad=unknown"));

            return _context5.abrupt("return", null);

          case 15:
            _context5.prev = 15;
            _context5.t0 = _context5["catch"](2);

            _logger.logger.debug("port[".concat(port, "] bad=").concat(_context5.t0));

          case 18:
            return _context5.abrupt("return", null);

          case 19:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this, [[2, 15]]);
  }));

  return function getFiletQNPort(_x12) {
    return _ref5.apply(this, arguments);
  };
}();

exports.getFiletQNPort = getFiletQNPort;

var listTabsWithQN =
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(qn) {
    var port, browser, adp, resp;
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            port = qn.port, browser = qn.browser;

            _logger.logger.info("inspecting QN[".concat(port, "]"));

            adp = new _adp.ADP(port, 'browser', browser);
            _context6.prev = 3;
            _context6.next = 6;
            return adp.connect();

          case 6:
            _context6.next = 8;
            return adp.send('listTabs', 'Target.getTargets', {});

          case 8:
            resp = _context6.sent;
            adp.close();
            return _context6.abrupt("return", {
              port: port,
              tabs: resp.targetInfos
            });

          case 13:
            _context6.prev = 13;
            _context6.t0 = _context6["catch"](3);
            adp.close();
            return _context6.abrupt("return", null);

          case 17:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this, [[3, 13]]);
  }));

  return function listTabsWithQN(_x13) {
    return _ref7.apply(this, arguments);
  };
}();

var listTabsWithPort =
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee7(port) {
    var qns, targets, targetQN, tabs;
    return _regenerator.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return (0, _adp.findAllQNs)();

          case 2:
            qns = _context7.sent;
            targets = qns.filter(function (qn) {
              return qn.port === port;
            });

            if (!(targets.length !== 1)) {
              _context7.next = 7;
              break;
            }

            _logger.logger.warn("QN with port [".concat(port, "] not found"));

            return _context7.abrupt("return", null);

          case 7:
            targetQN = targets[0];
            _context7.next = 10;
            return listTabsWithQN(targetQN);

          case 10:
            tabs = _context7.sent;
            return _context7.abrupt("return", tabs);

          case 12:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function listTabsWithPort(_x14) {
    return _ref8.apply(this, arguments);
  };
}();

exports.listTabsWithPort = listTabsWithPort;

var getPort =
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8() {
    var localPorts, portsResult, filetQNPorts, allQNs, tabs, valid;
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return (0, _adp.findLocalPorts)();

          case 2:
            localPorts = _context8.sent;
            _context8.next = 5;
            return Promise.all(localPorts.map(getFiletQNPort));

          case 5:
            portsResult = _context8.sent;
            filetQNPorts = portsResult.filter(function (p) {
              return p !== null;
            });
            _context8.next = 9;
            return (0, _adp.findAllQNs)();

          case 9:
            allQNs = _context8.sent;
            _context8.next = 12;
            return Promise.all(allQNs.filter(function (qn) {
              return !filetQNPorts.includes(qn.port);
            }).map(listTabsWithQN));

          case 12:
            tabs = _context8.sent;
            valid = tabs.filter(function (tab) {
              return tab !== null;
            });

            _logger.logger.debug("valid ports: ".concat(JSON.stringify(valid)));

            if (!valid.length) {
              _context8.next = 17;
              break;
            }

            return _context8.abrupt("return", valid[0]);

          case 17:
            return _context8.abrupt("return", null);

          case 18:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function getPort() {
    return _ref9.apply(this, arguments);
  };
}();

exports.getPort = getPort;