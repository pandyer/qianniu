"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "isDev", {
  enumerable: true,
  get: function get() {
    return _electronIsDev.default;
  }
});
exports.settings = void 0;

var _electronIsDev = _interopRequireDefault(require("electron-is-dev"));

var _electronStore = _interopRequireDefault(require("electron-store")); // 以文件形式缓存配置

var defaults = {
  schema: '2018.12.18',
  interrupt: false,
  account: {
    endpoint: 'https://account.leyanbot.com/api',
    timeout: 3000
  },
  agent: {
    endpoint: 'wss://agent.leyanbot.com/ws',
    timeout: 3000
  },
  wingman: {
    endpoint: 'https://wingman.leyantech.com'
  },
  mimesis: true,
  logger: {
    app: {
      maxsize: 10 * 1000 * 1000,
      maxFiles: 5
    }
  },
  char_per_min: 500,
  spin_time: {
    min: 3,
    max: 5
  },
  skip_q: false,
  big_heart: false
};
var settings = new _electronStore.default({
  defaults: defaults,
  name: 'filet'
});
exports.settings = settings;

if (settings.get('schema') !== defaults.schema || _electronIsDev.default) {
  settings.clear();
  settings.set(defaults);
}