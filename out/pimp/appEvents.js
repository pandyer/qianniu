"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MESSAGE_BOX_MAIN_CLOSED = exports.MESSAGE_BOX_UI = exports.APP_MAIN_QUIT = exports.G_MAIN_OPEN_ADMIN_PANEL = exports.G_UI_ACTIVATE_MODES = exports.G_MAIN_CONTACT_US = exports.G_UI_SHOP_UPDATE = exports.SUPERVISED_MAIN_CHOICE = exports.SUPERVISED_UI_UPDATE = exports.MODE_MAIN_CHANGE = exports.MODE_UI_CHANGE = exports.LAUNCH_MAIN_INFO_CONFIRM = exports.LAUNCH_UI_INFO_UPDATE = exports.LAUNCH_UI_STEPS_UPDATE = void 0;

/* ==========================  启动页  ========================== */

/*
LAUNCH_UI_STEPS_UPDATE
通知UI更新启动步骤
{
  "step": 0
}
*/
var LAUNCH_UI_STEPS_UPDATE = 'LAUNCH_UI_STEPS_UPDATE';
/*
LAUNCH_UI_INFO_UPDATE
通知UI商户分组
{
  "storeGroups": ["疑难组", "调解组", "售前组", "售后组"]
}
*/

exports.LAUNCH_UI_STEPS_UPDATE = LAUNCH_UI_STEPS_UPDATE;
var LAUNCH_UI_INFO_UPDATE = 'LAUNCH_UI_INFO_UPDATE';
/*
LAUNCH_MAIN_INFO_CONFIRM
通知主线程UI选择分组
{
  "Normal": "xxxxx",
  "Presale": "oooo",
  "Postsale": "ooxx"
}
*/

exports.LAUNCH_UI_INFO_UPDATE = LAUNCH_UI_INFO_UPDATE;
var LAUNCH_MAIN_INFO_CONFIRM = 'LAUNCH_MAIN_INFO_CONFIRM';
/* ==========================  功能切换  ========================== */

/*
MODE_UI_CHANGE
通知UI线程切换状态
{
  "mode": "triage", // triage/nightWatch/inquiry
  "flags": {
    enabled: true,
    supervised: false
  }
}
*/

exports.LAUNCH_MAIN_INFO_CONFIRM = LAUNCH_MAIN_INFO_CONFIRM;
var MODE_UI_CHANGE = 'MODE_UI_CHANGE';
/*
MODE_MAIN_CHNAGE
通知主线程UI试图切换状态
{
  "mode": "triage", // triage/nightWatch/inquiry
  "flags": {
    enabled: true,
    supervised: false
  }
}
*/

exports.MODE_UI_CHANGE = MODE_UI_CHANGE;
var MODE_MAIN_CHANGE = 'MODE_MAIN_CHNAGE';
/* ==========================  监督模式  ========================== */

/*
SUPERVISED_UI_UPDATE
通知UI更新监督信息
{
  nick: "leyantech",
  dialogue: [
    {idx: 0, type: "question", content: "在吗"},
    {idx: 1, type: "dispatch", content: "normal/presale/postsale"},
    {idx: 2, type: "answer", content: "有什么可以帮您的么"}
  ]
}
*/

exports.MODE_MAIN_CHANGE = MODE_MAIN_CHANGE;
var SUPERVISED_UI_UPDATE = 'SUPERVISED_UI_UPDATE';
/*
SUPERVISED_MAIN_CHOICE
通知主线程监督决定
{
  nick: "leyantech",
  choice: 1
}
*/

exports.SUPERVISED_UI_UPDATE = SUPERVISED_UI_UPDATE;
var SUPERVISED_MAIN_CHOICE = 'SUPERVISED_MAIN_CHOICE';
/* ==========================  全局功能  ========================== */

/*
G_UI_SHOP_UPDATE
通知UI更新客服信息
{
  nick: "leyantech:HC",
  isAdmin: true
}
*/

exports.SUPERVISED_MAIN_CHOICE = SUPERVISED_MAIN_CHOICE;
var G_UI_SHOP_UPDATE = 'G_UI_SHOP_UPDATE';
/*
G_MAIN_CONTACT_US
通知主线程打开反馈窗口
??? 打开网页/直接传入反馈信息 ???
*/

exports.G_UI_SHOP_UPDATE = G_UI_SHOP_UPDATE;
var G_MAIN_CONTACT_US = 'G_MAIN_CONTACT_US';
/*
G_MAIN_OPEN_ADMIN_PANEL
通知主线程打开管理后台
{
  module: "playbooks" // 打开的具体模块(route of neuron)
}
*/

/*
G_UI_ACTIVATE_MODES
通知主线程可选的模式
{
  "modes": [
    "triage", // 分流模式(尚未决定)
    "inquiry", // 询单模式(重新设计中)
    "dialogue", // 对话模式(现在开放)
    "nightWatch" // 值守模式(尚未决定)
  ],
  "supervised": true
}
*/

exports.G_MAIN_CONTACT_US = G_MAIN_CONTACT_US;
var G_UI_ACTIVATE_MODES = 'G_UI_ACTIVATE_MODES';
exports.G_UI_ACTIVATE_MODES = G_UI_ACTIVATE_MODES;
var G_MAIN_OPEN_ADMIN_PANEL = 'G_MAIN_OPEN_ADMIN_PANEL';
/* ==========================  APP 功能  ========================== */

/*
APP_MAIN_QUIT
通知主线程 UI试图关闭
*/

exports.G_MAIN_OPEN_ADMIN_PANEL = G_MAIN_OPEN_ADMIN_PANEL;
var APP_MAIN_QUIT = 'APP_MAIN_QUIT';
/*
MESSAGE_BOX_UI
通知UI显示弹出框
{
  id: "uniqID",
  type: "OK/CONFIRM",
  title: "确认弹出框",
  text: "需要退出"
}
*/

exports.APP_MAIN_QUIT = APP_MAIN_QUIT;
var MESSAGE_BOX_UI = 'MESSAGE_BOX_UI';
/*
MESSAGE_BOX_MAIN_CLOSED
通知主线程弹出框反馈
{
  id: "uniqID",
  event: "OK"
}
*/

exports.MESSAGE_BOX_UI = MESSAGE_BOX_UI;
var MESSAGE_BOX_MAIN_CLOSED = 'MESSAGE_BOX_MAIN_CLOSED';
exports.MESSAGE_BOX_MAIN_CLOSED = MESSAGE_BOX_MAIN_CLOSED;