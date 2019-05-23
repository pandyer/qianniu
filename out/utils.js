"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.translate = exports.JsonUtil = exports.getQueryParams = exports.removeUIDPrefix = exports.TB_PREFIX = exports.blockUntil = exports.sleep = exports.shuffle = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _fs = _interopRequireDefault(require("fs"));

var _url = _interopRequireDefault(require("url"));

var _querystring = _interopRequireDefault(require("querystring"));

var shuffle = function shuffle(a) {
  /*
  Fisher–Yates shuffle
  https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  */
  for (var i = a.length; i !== 0; i--) {
    var tmp = null;
    var j = Math.floor(Math.random() * i);
    tmp = a[i - 1];
    a[i - 1] = a[j];
    a[j] = tmp;
  }

  return a;
};

exports.shuffle = shuffle;

var sleep = function sleep(nSeconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      return resolve(nSeconds);
    }, nSeconds * 1000);
  });
};

exports.sleep = sleep;

var blockUntil =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(fn, failCallback) {
    var retryInterval,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            retryInterval = _args.length > 2 && _args[2] !== undefined ? _args[2] : 1;

          case 1:
            if (!true) {
              _context.next = 17;
              break;
            }

            _context.prev = 2;
            _context.next = 5;
            return fn();

          case 5:
            return _context.abrupt("return", _context.sent);

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](2);

            if (!(failCallback(_context.t0) !== true)) {
              _context.next = 14;
              break;
            }

            _context.next = 13;
            return sleep(retryInterval);

          case 13:
            return _context.abrupt("continue", 1);

          case 14:
            return _context.abrupt("break", 17);

          case 15:
            _context.next = 1;
            break;

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 8]]);
  }));

  return function blockUntil(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.blockUntil = blockUntil;
var TB_PREFIX = 'cntaobao';
exports.TB_PREFIX = TB_PREFIX;
var TB_PTN = new RegExp("^".concat(TB_PREFIX));

var removeUIDPrefix = function removeUIDPrefix(uid) {
  return uid.replace(TB_PTN, '');
};

exports.removeUIDPrefix = removeUIDPrefix;

var getQueryParams = function getQueryParams(urlString) {
  var u = _url.default.parse(urlString);

  var params = _querystring.default.parse(u.query || '');

  return params;
};

exports.getQueryParams = getQueryParams;

var JsonUtilCls =
/*#__PURE__*/
function () {
  function JsonUtilCls() {
    (0, _classCallCheck2.default)(this, JsonUtilCls);
  }

  (0, _createClass2.default)(JsonUtilCls, [{
    key: "load",
    value: function load(filePath) {
      if (_fs.default.existsSync(filePath)) {
        var jsonStr = _fs.default.readFileSync(filePath, {
          encoding: 'utf8'
        });

        return JSON.parse(jsonStr);
      }
    }
  }, {
    key: "dump",
    value: function dump(content, filePath) {
      var jsonStr = JSON.stringify(content, null, 2);

      _fs.default.writeFileSync(filePath, jsonStr);
    }
  }]);
  return JsonUtilCls;
}();

var JsonUtil = new JsonUtilCls();
exports.JsonUtil = JsonUtil;

var getEmoji = function getEmoji(url) {
  return url.searchParams.get('shortcut') || '';
};

var IMGS = ['jpg', 'png', 'jpeg', 'gif'];

var getFileURL = function getFileURL(url) {
  var suffix = url.searchParams.get('suffix').toLowerCase();

  if (IMGS.indexOf(suffix) !== -1) {
    return '图片消息';
  }
};

var process = function process(msg) {
  var part = msg || '';
  var url = null;

  if (part.startsWith('http')) {
    url = new _url.default.URL(part);

    if (url.host === 'interface.im.taobao.com') {
      return getFileURL(url);
    } else if (url.host === 'trade.taobao.com') {// 订单卡片 放行
    } else if (url.host === 'item.taobao.com') {// 链接卡片 放行
    } else if (url.host.endsWith('mall.taobao.com')) {
      // 店铺卡片 过滤
      return '';
    }

    return part;
  } else if (part.startsWith('该用户由')) {
    return '';
  } else if (part.startsWith('pic:')) {
    url = new _url.default.URL(part);

    if (part.startsWith('pic:imemotion')) {
      return getEmoji(url);
    } else {
      return '';
    }
  } else {
    return part;
  }
};

var translate = function translate(line) {
  return line.split(',').map(function (part) {
    return (process(part) || '').trim();
  }).filter(function (item) {
    return item;
  }).join(' ');
};

exports.translate = translate;