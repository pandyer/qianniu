"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _dayjs = _interopRequireDefault(require("dayjs"));

// var Sentry = _interopRequireWildcard(require("@sentry/electron"));

var _winston = require("winston");

var _electron2 = require("electron");

var _settings = require("./settings");

var LOG_SIZE = 20 * 1000 * 1000; // 20MB

var DEBUG_PATH = _path.default.resolve(_electron2.app.getPath('logs'), '..', 'debug');

var SENTRY_DSN = 'https://9e57bc143b944ba39765f60b28a8393b:a65a0f258fc343fb97109297b5cd7d1f@sentry.prd.lain.leyanbot.com/53';

var lyFormat = _winston.format.combine(_winston.format.timestamp({
  format: function format() {
    return (0, _dayjs.default)().format('YYYY-MM-DD HH:mm:ss:SSS');
  }
}), _winston.format.printf(function (info) {
  return "".concat(info.timestamp, " [").concat(info.level, "] ").concat(info.message);
}));

var debugFormat = _winston.format.combine(_winston.format.timestamp({
  format: function format() {
    return (0, _dayjs.default)().format('YYYY-MM-DD HH:mm:ss:SSS');
  }
}), _winston.format.json());

var lyTransports = {
  app: new _winston.transports.File({
    filename: _path.default.resolve(_electron2.app.getPath('logs'), 'app.log'),
    maxFiles: _settings.settings.get('logger.app.maxFiles'),
    maxsize: _settings.settings.get('logger.app.maxsize'),
    level: _settings.settings.get('logger.app.level'),
    format: lyFormat
  }),
  debug: new _winston.transports.File({
    filename: _path.default.resolve(DEBUG_PATH, 'debug.log'),
    maxFiles: 1,
    maxsize: LOG_SIZE,
    level: 'debug',
    format: debugFormat
  }),
  exception: new _winston.transports.File({
    filename: _path.default.resolve(_electron2.app.getPath('logs'), 'exception.log'),
    maxFiles: 5,
    maxsize: LOG_SIZE,
    level: 'debug'
  }),
  console: new _winston.transports.Console({
    level: 'debug',
    format: lyFormat
  })
};
var logger = (0, _winston.createLogger)({
  transports: [lyTransports.app],
  exceptionHandlers: [lyTransports.exception]
});
exports.logger = logger;

if (_fs.default.existsSync(DEBUG_PATH) && _fs.default.lstatSync(DEBUG_PATH).isDirectory()) {
  logger.add(lyTransports.debug);
}
logger.add(lyTransports.console);

// if (_settings.isDev) {
// } else {
//   Sentry.init({
//     dsn: SENTRY_DSN
//   });
// }