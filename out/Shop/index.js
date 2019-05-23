"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _axios = _interopRequireDefault(require("axios"));

var _settings = require("../settings");

var _logger = require("../logger");

var Shop = function Shop() {
  var _this = this;

  (0, _classCallCheck2.default)(this, Shop);
  (0, _defineProperty2.default)(this, "isSubAccount", function (account) {
    if (account === null || _this.aid === null) {
      _logger.logger.warn("account[".concat(account, "] account[").concat(_this.aid, "] is null"));

      return true;
    }

    var mainAccount = _this.aid.split(':')[0];

    var targetAccount = account.slice(8).split(':')[0];
    return mainAccount === targetAccount;
  });
  (0, _defineProperty2.default)(this, "refreshConfig", function () {
    _logger.logger.info("refreshing config for [".concat(_this.sid, "]"));

    return _this.client.get("/shop/client-config").then(function (resp) {
      var rc = resp.data.config;

      if (rc.CHAR_PER_MIN !== undefined) {
        _settings.settings.set('char_per_min', rc.CHAR_PER_MIN);
      }

      if (rc.SPIN_TIME_MIN !== undefined) {
        _settings.settings.set('spin_time.min', rc.SPIN_TIME_MIN);
      }

      if (rc.SPIN_TIME_MAX !== undefined) {
        _settings.settings.set('spin_time.max', rc.SPIN_TIME_MAX);
      }

      if (rc.CUSTOMER_COOLDOWN_TIMEOUT !== undefined) {
        _settings.settings.set('cooldown', rc.CUSTOMER_COOLDOWN_TIMEOUT);
      }

      if (rc.MIMESIS !== undefined) {
        _settings.settings.set('mimesis', rc.MIMESIS);
      }

      if (rc.SKIP_Q !== undefined) {
        _settings.settings.set('skip_q', rc.SKIP_Q);
      }

      if (rc.INTERRUPT !== undefined) {
        _settings.settings.set('interrupt', rc.INTERRUPT);
      }
    }).catch(function (err) {
      _logger.logger.error("load config error: ".concat(err));
    });
  });
  (0, _defineProperty2.default)(this, "loadConfig", function (sid, aid, authToken) {
    _logger.logger.info("going to load remote config for ".concat(sid));

    _this.sid = sid;
    _this.aid = aid;
    _this.client = _axios.default.create({
      baseURL: _settings.settings.get('account.endpoint'),
      timeout: _settings.settings.get('account.timeout'),
      headers: {
        'Authentication-Token': authToken
      }
    });
    setInterval(function () {
      return _this.refreshConfig();
    }, 1000 * 60 * 10);
    return _this.refreshConfig();
  });
  this.sid = null;
  this.aid = null;
  this.client = null;
};

var shop = new Shop();
var _default = shop;
exports.default = _default;