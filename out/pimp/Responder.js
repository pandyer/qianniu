"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NightwatchResponder = exports.DialogResponder = void 0;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _logger = require("../logger");

var _settings = require("../settings");

var DialogResponder = function DialogResponder() {
  (0, _classCallCheck2.default)(this, DialogResponder);
  (0, _defineProperty2.default)(this, "onDispatch",
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(customer, prompt, to, target) {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!_settings.settings.get('skip_q')) {
                _context.next = 3;
                break;
              }

              _logger.logger.info("skip q enabled [".concat(customer.customerID, "@[").concat(target, "]]"));

              return _context.abrupt("return");

            case 3:
              customer.setManualMode();

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2, _x3, _x4) {
      return _ref.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "onResponse",
  /*#__PURE__*/
  function () {
    var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(customer, prompt, signal) {
      var resp;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (signal === 'DialogueSwitched') {
                customer.switchToDialogue();
              }

              _context2.next = 3;
              return customer.reply(prompt, false);

            case 3:
              resp = _context2.sent;

              _logger.logger.info("response ".concat(customer.customerID, " with ").concat(prompt));

              return _context2.abrupt("return", resp);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x5, _x6, _x7) {
      return _ref2.apply(this, arguments);
    };
  }());
};

exports.DialogResponder = DialogResponder;

var NightwatchResponder =
/*#__PURE__*/
function (_DialogResponder) {
  (0, _inherits2.default)(NightwatchResponder, _DialogResponder);

  function NightwatchResponder() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, NightwatchResponder);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(NightwatchResponder)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "onDispatch",
    /*#__PURE__*/
    function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(customer, prompt, to, target) {
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return customer.reply(prompt || '亲~ 这个问题要等明天专业的客服上班才能解答哦', false);

              case 2:
                _logger.logger.info("nightwatch ".concat(customer.customerID, " with ").concat(prompt, " succeeed"));

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function (_x8, _x9, _x10, _x11) {
        return _ref3.apply(this, arguments);
      };
    }());
    return _this;
  }

  return NightwatchResponder;
}(DialogResponder);

exports.NightwatchResponder = NightwatchResponder;