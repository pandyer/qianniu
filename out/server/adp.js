"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ADP = exports.findAllQNs = exports.findLocalPorts = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _electron = require("electron");

var _lyWinTools = _interopRequireDefault(require("ly-win-tools"));

var _nodeNetstat = _interopRequireDefault(require("node-netstat"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _ws = _interopRequireDefault(require("ws"));

var _logger = require("../logger");

var QN_EXE = 'AliWorkbench.exe';

var BENCH_ROOT = _path.default.resolve(_electron.app.getPath('home'), 'AppData', 'Local', 'aef5', 'AliWorkbench');

var MULTI_INSTANCE_ROOT = _path.default.resolve(BENCH_ROOT, 'BackupCache');

var DEBUG_FILE_NAME = 'DevToolsActivePort';

var findLocalPorts = function findLocalPorts() {
  var ports = [];
  var filter = {
    protocol: 'tcp',
    local: {
      address: '127.0.0.1'
    },
    state: 'LISTENING'
  };
  return new Promise(function (resolve) {
    (0, _nodeNetstat.default)({
      filter: filter,
      done: function done() {
        resolve(ports);
      }
    }, function (data) {
      var pid = data.pid,
          port = data.local.port;
      ports.push({
        pid: pid,
        port: port
      });
    });
  });
};

exports.findLocalPorts = findLocalPorts;

var findAllQNs =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var localPorts, pidMap, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, portInfo, pid, port, procs, qnMap, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, proc, others, files, debugInfo, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, info, _port, browser, qn, valid, _arr, _i, key, _qnMap$key, _port2;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return findLocalPorts();

          case 2:
            localPorts = _context.sent;
            pidMap = {};
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 7;

            for (_iterator = localPorts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              portInfo = _step.value;
              pid = portInfo.pid, port = portInfo.port;

              _logger.logger.debug("found PORT<".concat(pid, ": ").concat(port, ">"));

              pidMap[pid] = "".concat(port);
            }

            _context.next = 15;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](7);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 15:
            _context.prev = 15;
            _context.prev = 16;

            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }

          case 18:
            _context.prev = 18;

            if (!_didIteratorError) {
              _context.next = 21;
              break;
            }

            throw _iteratorError;

          case 21:
            return _context.finish(18);

          case 22:
            return _context.finish(15);

          case 23:
            _context.next = 25;
            return _lyWinTools.default.findProcess({
              name: QN_EXE
            });

          case 25:
            procs = _context.sent;

            _logger.logger.info("QN Proc X[".concat(procs.length, "]"));

            qnMap = {};
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 31;

            for (_iterator2 = procs[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              proc = _step2.value;
              pid = proc.pid;
              port = pidMap[pid];

              _logger.logger.debug("found QN<".concat(pid, ": ").concat(port, ">"));

              qnMap[port] = {
                pid: pid,
                port: port,
                browser: null
              };
            }

            _context.next = 39;
            break;

          case 35:
            _context.prev = 35;
            _context.t1 = _context["catch"](31);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 39:
            _context.prev = 39;
            _context.prev = 40;

            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }

          case 42:
            _context.prev = 42;

            if (!_didIteratorError2) {
              _context.next = 45;
              break;
            }

            throw _iteratorError2;

          case 45:
            return _context.finish(42);

          case 46:
            return _context.finish(39);

          case 47:
            _context.next = 49;
            return listDir(MULTI_INSTANCE_ROOT);

          case 49:
            others = _context.sent;
            files = [BENCH_ROOT].concat((0, _toConsumableArray2.default)(others)).map(function (f) {
              return _path.default.resolve(f, DEBUG_FILE_NAME);
            });
            _context.next = 53;
            return Promise.all(files.map(getDebugInfo));

          case 53:
            debugInfo = _context.sent;
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context.prev = 57;
            _iterator3 = debugInfo[Symbol.iterator]();

          case 59:
            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
              _context.next = 69;
              break;
            }

            info = _step3.value;

            if (!(info === null)) {
              _context.next = 63;
              break;
            }

            return _context.abrupt("continue", 66);

          case 63:
            _port = info.port, browser = info.browser;
            qn = qnMap[_port];

            if (qn === undefined) {
              _logger.logger.verbose("stalled QN[".concat(_port, "] found! skip!"));
            } else {
              qn.browser = browser;
            }

          case 66:
            _iteratorNormalCompletion3 = true;
            _context.next = 59;
            break;

          case 69:
            _context.next = 75;
            break;

          case 71:
            _context.prev = 71;
            _context.t2 = _context["catch"](57);
            _didIteratorError3 = true;
            _iteratorError3 = _context.t2;

          case 75:
            _context.prev = 75;
            _context.prev = 76;

            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }

          case 78:
            _context.prev = 78;

            if (!_didIteratorError3) {
              _context.next = 81;
              break;
            }

            throw _iteratorError3;

          case 81:
            return _context.finish(78);

          case 82:
            return _context.finish(75);

          case 83:
            valid = [];
            _arr = Object.keys(qnMap);

            for (_i = 0; _i < _arr.length; _i++) {
              key = _arr[_i];
              _qnMap$key = qnMap[key], pid = _qnMap$key.pid, _port2 = _qnMap$key.port, browser = _qnMap$key.browser;

              if (browser === null) {
                _logger.logger.error("can not inspect QN<".concat(pid, ": ").concat(_port2, ">"));
              } else {
                valid.push({
                  port: Number(_port2),
                  browser: browser
                });
              }
            }

            return _context.abrupt("return", valid);

          case 87:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[7, 11, 15, 23], [16,, 18, 22], [31, 35, 39, 47], [40,, 42, 46], [57, 71, 75, 83], [76,, 78, 82]]);
  }));

  return function findAllQNs() {
    return _ref.apply(this, arguments);
  };
}();

exports.findAllQNs = findAllQNs;

var openFile = function openFile(fPath) {
  return new Promise(function (resolve, reject) {
    _fs.default.open(fPath, 'r', function (err, fd) {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
};

var readDebugFile = function readDebugFile(fPath, fd) {
  return new Promise(function (resolve, reject) {
    _fs.default.readFile(fd, {
      encoding: 'utf8'
    }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        var content = data.trim().split(/[\r\n]/);

        if (content.length !== 2) {
          var tip = "malformed debug file [".concat(fPath, "]");

          _logger.logger.warn(tip);

          resolve(null);
        } else {
          resolve({
            port: content[0],
            browser: content[1].split('/').slice(-1)[0]
          });
        }
      }
    });
  });
};

var getDebugInfo =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(fPath) {
    var fd, content;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            fd = null;
            content = null;
            _context2.prev = 2;
            _context2.next = 5;
            return openFile(fPath);

          case 5:
            fd = _context2.sent;
            _context2.next = 8;
            return readDebugFile(fPath, fd);

          case 8:
            content = _context2.sent;
            _context2.next = 15;
            break;

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2["catch"](2);

            if (!(_context2.t0.code !== 'ENOENT')) {
              _context2.next = 15;
              break;
            }

            throw _context2.t0;

          case 15:
            _context2.prev = 15;

            if (fd !== null) {
              _fs.default.closeSync(fd);
            }

            return _context2.finish(15);

          case 18:
            return _context2.abrupt("return", content);

          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[2, 11, 15, 18]]);
  }));

  return function getDebugInfo(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var listDir = function listDir(dirPath) {
  return new Promise(function (resolve, reject) {
    _fs.default.readdir(dirPath, function (err, files) {
      if (err !== null) {
        if (err.code === 'ENOENT') {
          resolve([]);
        } else {
          reject(new Error("ls error: [".concat(err, "]")));
        }
      } else {
        resolve(files.map(function (f) {
          return _path.default.resolve(dirPath, f);
        }));
      }
    });
  });
};
/*
Ali Debug Protocol...As U Wish...
*/


var ADP =
/*#__PURE__*/
function () {
  function ADP(port, type, target) {
    (0, _classCallCheck2.default)(this, ADP);
    this.port = port;
    this.type = type;
    this.target = target;
    this.registry = {};
    this.requestCounter = 0;
    this.ws = null;
    this.label = "[".concat(port, ":").concat(target, "]");
  }

  (0, _createClass2.default)(ADP, [{
    key: "connect",
    value: function connect() {
      var _this = this;

      var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var port = this.port,
          type = this.type,
          target = this.target;
      return new Promise(function (_resolve, _reject) {
        var tid = setTimeout(function () {
          tid = null;
          var tip = "".concat(_this.label, " connection timeout ").concat(timeout, "s");

          _reject(new Error(tip));
        }, timeout * 1000);

        var resolve = function resolve(next) {
          if (tid === null) return;
          clearTimeout(tid);

          _resolve(next);
        };

        var reject = function reject(err) {
          if (tid === null) return;
          clearTimeout(tid);

          _reject(err);
        };

        var url = "ws://127.0.0.1:".concat(port, "/devtools/").concat(type, "/").concat(target);
        var ws = new _ws.default(url);
        ws.on('error', function () {
          tid = null;
          reject(new Error("".concat(_this.label, " connection error")));
        });
        ws.on('message', function (data) {
          var message = JSON.parse(data);

          _this.handleMessage(message);
        });
        ws.on('open', function () {
          _this.ws = ws;
          resolve();
        });
      });
    }
  }, {
    key: "send",
    value: function send(name, method, params) {
      var _this2 = this;

      var timeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
      var id = this.requestCounter++;
      var payload = {
        id: id,
        method: method,
        params: params
      };
      return new Promise(function (_resolve, _reject) {
        var tid = setTimeout(function () {
          tid = null;
          var tip = "".concat(name, " on ").concat(_this2.label, " timeout ").concat(timeout, "s");

          _reject(new Error(tip));
        }, timeout * 1000);

        var resolve = function resolve(next) {
          if (tid === null) return;
          clearTimeout(tid);

          _resolve(next);
        };

        var reject = function reject(err) {
          if (tid === null) return;
          clearTimeout(tid);

          _reject(err);
        };

        _this2.ws.send(JSON.stringify(payload), function (err) {
          if (err) {
            reject(err);
          } else {
            _this2.registry[id] = {
              resolve: resolve,
              reject: reject
            };
          }
        });
      });
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(_ref3) {
      var id = _ref3.id,
          error = _ref3.error,
          result = _ref3.result;
      var request = this.registry[id];

      if (request !== undefined) {
        delete this.registry[id];

        if (error === undefined) {
          request.resolve(result);
        } else {
          request.reject(new Error(error));
        }
      }
    }
  }, {
    key: "close",
    value: function close() {
      if (this.ws) {
        this.ws.close();
      }
    }
  }]);
  return ADP;
}();

exports.ADP = ADP;