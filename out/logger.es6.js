const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const Sentry = require('@sentry/electron');
const { format, transports, createLogger } = require('winston');
const { app } = require('electron');
const { settings, isDev } = require('./settings');

const LOG_SIZE = 20 * 1000 * 1000;

const DEBUG_PATH = path.resolve(app.getPath('logs'), '..', 'debug');

const SENTRY_DSN = 'https://9e57bc143b944ba39765f60b28a8393b:a65a0f258fc343fb97109297b5cd7d1f@sentry.prd.lain.leyanbot.com/53';

const lyFormat = format.combine(format.timestamp({
  format: () => dayjs().format('YYYY-MM-DD HH:mm:ss:SSS'),
}), format.printf((info) => `${info.timestamp} [${info.level}] ${info.message}`))

const debugFormat = format.combine(format.timestamp({ format: () => dayjs().format('YYYY-MM-DD HH:mm:ss:SSS') }), format.json());

const lyTransports = {
  app: new transports.File({
    filename: path.resolve(app.getPath('logs', 'app.log')),
    maxFiles: settings.get('logger.app.maxFiles'),
    maxsize: settings.get('logger.app.maxsize'),
    level: settings.get('logger.app.level'),
    format: lyFormat,
  }),
  debug: new transports.File({
    filename: path.resolve(DEBUG_PATH, 'debug.log'),
    maxFiles: 1,
    maxsize: LOG_SIZE,
    level: 'debug',
    format: debugFormat,
  }),
  exception: new transports.File({
    filename: path.resolve(app.getPath('logs'), 'exception.log'),
    maxFiles: 5,
    maxsize: LOG_SIZE,
    level: 'debug',
  }),
  console: new transports.Console({
    level: 'debug',
    format: lyFormat,
  }),
}

const logger = createLogger({
  transports: [lyTransports.app],
  exceptionHandlers: [lyTransports.exception],
})

if (fs.existsSync(DEBUG_PATH) && fs.lstatSync(DEBUG_PATH).isDirectory()) {
  logger.add(lyTransports.debug);
}
logger.add(lyTransports.console);

module.exports = logger;

if (!isDev) {
  Sentry.init({
    dsn: SENTRY_DSN,
  });
}
