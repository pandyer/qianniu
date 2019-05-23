"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkNewVersion = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _electronUpdater = require("electron-updater");

var _logger = require("./logger");

var _settings = require("./settings");

_electronUpdater.autoUpdater.checkForUpdatesAndNotify = function () {
  var _this = this;

  if (!this.app.isPackaged) {
    _logger.logger.info('Skip checkForUpdatesAndNotify because application is not packed');

    return Promise.resolve(null);
  }

  var checkForUpdatesPromise = this.checkForUpdates();
  checkForUpdatesPromise.then(function (it) {
    var downloadPromise = it.downloadPromise;

    if (downloadPromise == null) {
      var debug = _this._logger.debug;

      if (debug != null) {
        debug("checkForUpdatesAndNotify called, downloadPromise is null");
      }

      return;
    }
  }).catch(function () {
    _logger.logger.error("suppress checking update error");
  });
  return checkForUpdatesPromise;
}.bind(_electronUpdater.autoUpdater);

_electronUpdater.autoUpdater.on('checking-for-update', function (event, info) {
  _logger.logger.verbose('checking for update');
});

_electronUpdater.autoUpdater.on('update-not-available', function (event, info) {
  _logger.logger.verbose('update not available');
});

_electronUpdater.autoUpdater.on('update-available', function (event, info) {
  _logger.logger.warn('update available');
});

_electronUpdater.autoUpdater.on('download-progress', function (event, progressObj) {
  _logger.logger.warn('downloading');
});

_electronUpdater.autoUpdater.on('update-downloaded', function (event, info) {
  _logger.logger.warn('update downloaded');
});

_electronUpdater.autoUpdater.on('error', function (event, error) {
  _logger.logger.error('update error', error);
});

var checkNewVersion =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    var checkInterval;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            checkInterval = 60 * 1000; // check every 10min

            _electronUpdater.autoUpdater.logger = _logger.logger;

            if (_settings.settings.get('big_heart') === true) {
              _logger.logger.warn('Beloved BETA Assistant FOUND');

              _electronUpdater.autoUpdater.channel = 'beta';
            } else {
              _electronUpdater.autoUpdater.channel = 'latest';
            }

            _electronUpdater.autoUpdater.checkForUpdatesAndNotify();

            setInterval(
            /*#__PURE__*/
            (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee() {
              return _regenerator.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _logger.logger.verbose('checking new version');

                      _electronUpdater.autoUpdater.checkForUpdatesAndNotify();

                    case 2:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            })), checkInterval);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function checkNewVersion() {
    return _ref.apply(this, arguments);
  };
}();

exports.checkNewVersion = checkNewVersion;