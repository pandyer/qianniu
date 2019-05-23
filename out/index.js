"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _electron = require("electron");

var _settings = require("./settings");

var _pimp = require("./pimp");

var _logger = require("./logger");

var _updater = require("./updater");

var _QNHelper = require("./QNHelper");

var mainWindow = null;
process.on('exit', function (code) {
  _logger.logger.warn("FILET OUT code=".concat(code));
});
process.on('uncaughtException', function (err) {
  _logger.logger.error("FILET OUT exception=".concat(err));
});
process.on('unhandledRejection', function (reason) {
  _logger.logger.error("unhandled rejection reason=".concat(reason, "}"));
});

_electron.app.on('quit', function (event, exitCode) {
  _logger.logger.warn("EVENT: ".concat(JSON.stringify(event), " CODE: ").concat(exitCode, "}"));
});

_electron.app.on('window-all-closed', function () {
  (0, _pimp.release)();

  _electron.app.quit();
});

_electron.app.on('ready',
/*#__PURE__*/
(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee2() {
  return _regenerator.default.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // (0, _QNHelper.startQNHelper)();
          (0, _updater.checkNewVersion)();
          mainWindow = new _electron.BrowserWindow({
            show: false,
            frame: false,
            transparent: true,
            width: 1000,
            height: 640,
            useContentSize: true,
            resizable: true
          });
          mainWindow.loadURL("file://".concat(__dirname, "/ui/index.html#/launch"));

          if (_settings.isDev) {
            mainWindow.openDevTools();

            require('devtron').install();
          }

          mainWindow.webContents.once('did-finish-load',
          /*#__PURE__*/
          (0, _asyncToGenerator2.default)(
          /*#__PURE__*/
          _regenerator.default.mark(function _callee() {
            var errMsg;
            return _regenerator.default.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    mainWindow.show();
                    mainWindow.focus();
                    _context.prev = 2;
                    _context.next = 5;
                    return (0, _pimp.launch)(mainWindow);

                  case 5:
                    errMsg = _context.sent;

                    if (!(errMsg !== null)) {
                      _context.next = 10;
                      break;
                    }

                    _electron.dialog.showErrorBox('限制登录', errMsg);

                    _electron.app.emit('window-all-closed');

                    return _context.abrupt("return");

                  case 10:
                    _context.next = 12;
                    return (0, _pimp.hookup)(mainWindow);

                  case 12:
                    _context.next = 17;
                    break;

                  case 14:
                    _context.prev = 14;
                    _context.t0 = _context["catch"](2);

                    _logger.logger.error("launch error: ".concat(_context.t0));

                  case 17:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[2, 14]]);
          })));
          mainWindow.on('closed', function () {
            mainWindow = null;
          });
          mainWindow.setMenu(null);

        case 8:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2, this);
})));