"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.launch = exports.hookup = exports.release = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _electron = require("electron");

var _url = _interopRequireDefault(require("url"));

var _PostOffice = _interopRequireDefault(require("../PostOffice.js"));

var _Postman = _interopRequireDefault(require("./Postman"));

var _Shop = _interopRequireDefault(require("../Shop"));

var _server = require("../server");

var _logger = require("../logger");

var _settings = require("../settings");

var _customerService = require("../customerService");

var _appEvents = require("./appEvents");

var postOffice = new _PostOffice.default();
var qn = new _server.QN();
var postman = new _Postman.default(qn, postOffice, '帮您转接专员哦~');
var customerService = new _customerService.CustomerService(qn, postman);

var release = function release() {
  _logger.logger.info('releasing objects');
};

exports.release = release;

var Reporter = function Reporter(webContents) {
  var _this = this;

  (0, _classCallCheck2.default)(this, Reporter);
  (0, _defineProperty2.default)(this, "updateUI", function (nick) {
    _this.ipc.send(_appEvents.G_UI_SHOP_UPDATE, {
      nick: nick,
      isAdmin: false
    });
  });
  (0, _defineProperty2.default)(this, "nextStep", function () {
    var step = ++_this.step;

    _this.ipc.send(_appEvents.LAUNCH_UI_STEPS_UPDATE, {
      step: step
    });

    return function (error) {
      _this.ipc.send(_appEvents.LAUNCH_UI_STEPS_UPDATE, {
        step: step,
        error: error
      });
    };
  });
  this.step = 0;
  this.ipc = webContents;
};

var hookup = function hookup(mainWindow) {
  var webContents = mainWindow.webContents;

  _electron.ipcMain.on(_appEvents.APP_MAIN_QUIT, function (event) {
    _electron.app.emit('window-all-closed');
  });

  _electron.ipcMain.on(_appEvents.MODE_MAIN_CHANGE, function (event, _ref) {
    var mode = _ref.mode;
    postman.changeMode(mode);
    webContents.send(_appEvents.MODE_UI_CHANGE, {
      mode: mode,
      flags: {
        enabled: true,
        supervised: false
      }
    });
  });

  postman.suitUp(customerService);
};

exports.hookup = hookup;
var DEFAULT_MODE = {
  mode: 'dialog',
  flags: {
    enabled: true,
    supervised: false
  }
};

var launch =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(mainWindow) {
    var webContents, reporter, postOfficeReporter, _url$parse, host, protocol, pathname, query, fixedToken;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            webContents = mainWindow.webContents;
            reporter = new Reporter(webContents);
            reporter.nextStep();
            reporter.nextStep();
            _context.next = 6;
            return qn.setup(customerService, postman);

          case 6:
            _context.next = 8;
            return qn.connect();

          case 8:
            _context.next = 10;
            return _Shop.default.loadConfig(qn.aid, qn.aid, qn.authToken);

          case 10:
            if (!(qn.tokenInfo.rogue === true)) {
              _context.next = 12;
              break;
            }

            return _context.abrupt("return", "[".concat(qn.tokenInfo.nick, "] \u4E0D\u5728\u5E97\u94FA\u6388\u6743\u5217\u8868\u4E2D"));

          case 12:
            reporter.updateUI(_Shop.default.aid);
            postOfficeReporter = reporter.nextStep();
            _url$parse = _url.default.parse(_settings.settings.get('agent.endpoint')), host = _url$parse.host, protocol = _url$parse.protocol, pathname = _url$parse.pathname, query = _url$parse.query;
            fixedToken = new URLSearchParams(query).get('auth_token');
            _context.prev = 16;
            _context.next = 19;
            return postOffice.setup("".concat(protocol, "//").concat(host).concat(pathname), fixedToken || qn.authToken);

          case 19:
            _context.next = 26;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context["catch"](16);

            _logger.logger.error("connect to server error: ".concat(_context.t0));

            postOfficeReporter('连接服务器失败');
            throw new Error(_context.t0);

          case 26:
            webContents.send(_appEvents.G_UI_ACTIVATE_MODES, {
              modes: ['dialog', 'nightWatch'],
              supervised: false
            });
            webContents.send(_appEvents.MODE_UI_CHANGE, DEFAULT_MODE);
            return _context.abrupt("return", null);

          case 29:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[16, 21]]);
  }));

  return function launch(_x) {
    return _ref2.apply(this, arguments);
  };
}();

exports.launch = launch;