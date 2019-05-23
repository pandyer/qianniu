"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startQNHelper = void 0;

var _electronIsDev = _interopRequireDefault(require("electron-is-dev"));

var _electron = require("electron");

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var binDir = _path.default.dirname(_electron.app.getAppPath());

if (_electronIsDev.default) {
  binDir = __dirname;
}

var cmdPath = _path.default.join(binDir, 'elevate.exe');

var exePath = _path.default.join(binDir, 'QNHelp.exe');

var startQNHelper = function startQNHelper() {
  var subprocess = (0, _child_process.spawn)(cmdPath, [exePath], {
    detached: true,
    stdio: 'ignore'
  });
  subprocess.unref();
};

exports.startQNHelper = startQNHelper;