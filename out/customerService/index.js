"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CustomerService = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _customer = require("./customer");

var _logger = require("../logger");

var CustomerService = function CustomerService(_qn, _postman) {
  var _this = this;

  (0, _classCallCheck2.default)(this, CustomerService);
  (0, _defineProperty2.default)(this, "getNext", function () {
    var customers = _this.customers;
    var firstCustomer = null;
    var capacity = 0;

    var _arr = Object.keys(customers);

    for (var _i = 0; _i < _arr.length; _i++) {
      var uid = _arr[_i];
      var customer = customers[uid];
      var botReplied = customer.botReplied,
          visited = customer.visited;

      if (botReplied === null || visited) {
        continue;
      }

      capacity += 1;

      if (firstCustomer === null || botReplied < firstCustomer.botReplied) {
        firstCustomer = customer;
      }
    }

    return {
      customer: firstCustomer,
      capacity: capacity
    };
  });
  (0, _defineProperty2.default)(this, "getCustomer", function (uid) {
    var customer = _this.customers[uid];

    if (customer === undefined) {
      var qn = _this.qn,
          postman = _this.postman;
      customer = new _customer.Customer(qn, postman, uid);
      _this.customers[uid] = customer;
    }

    return customer;
  });
  (0, _defineProperty2.default)(this, "syncMessages", function (uid, msgs, timestamp, offset) {
    _this.getCustomer(uid).syncMessages(msgs, timestamp, offset);
  });
  (0, _defineProperty2.default)(this, "onNewMessage", function (msg) {
    var aid = _this.qn.aid;
    var nick = "cntaobao".concat(aid);
    var fromID = msg.fromID,
        toID = msg.toID,
        incoming = msg.incoming,
        msgContent = msg.value;

    if (incoming) {
      if (toID !== nick) {
        _logger.logger.warn("keep message from other assistant: [".concat(toID, "]: ").concat(msgContent));
      }

      _this.getCustomer(fromID).ask(msgContent);
    } else {
      if (fromID !== nick) {
        _logger.logger.warn("drop message from other assistant: [".concat(fromID, "]: ").concat(msgContent));

        return;
      }

      _this.getCustomer(toID).outgoing(msgContent);
    }
  });
  (0, _defineProperty2.default)(this, "onConversationClose", function (appkey, nick) {
    var customer = _this.getCustomer("".concat(appkey).concat(nick));

    customer.onClose();
  });
  this.customers = {};
  this.qn = _qn;
  this.postman = _postman;
};

exports.CustomerService = CustomerService;