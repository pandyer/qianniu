const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

exports.shuffle = function shuffle(aa) {
  const a = aa;
  for (let i = a.length; i !== 0; i -= 1) {
    let tmp = null;
    const j = Math.floor(Math.random() * i);
    tmp = a[i - 1];
    a[i - 1] = a[j];
    a[j] = tmp;
  }
}

function sleep(nSeconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(nSeconds), nSeconds * 1000);
  })
}

exports.sleep = sleep;
export const blockUntil = async (fn, failCallback, retryInterval = 1) => {
  try {
    return fn();
  } catch (e) {
    if (failCallback(e) !== true) {
      return sleep(retryInterval);
    }
    return false;
  }
}

const TB_PREFIX = 'cntaobao';
exports.TB_PREFIX = TB_PREFIX;
const TB_PTN = new RegExp('^'.concat(TB_PREFIX));

const removeUIDPrefix = function removeUIDPrefix(uid) {
  return uid.replace(TB_PTN, '');
};

exports.removeUIDPrefix = removeUIDPrefix;

export const getQueryParams = (urlString) => {
  const u = url.parse(urlString);
  const params = querystring.parse(u.query || '');
  return params;
}

class JsonUtilCls {
  load(filePath) {
    if (fs.existsSync(filePath)) {
      const jsonStr = fs.readFileSync(filePath, {
        encoding: 'utf8',

      })
      return JSON.parse(jsonStr);
    }
    return null;
  }

  dump(content, filePath) {
    const jsonStr = JSON.stringify(content);
    fs.writeFileSync(filePath, jsonStr);
  }
}

export const JsonUtil = new JsonUtilCls();

const getEmoji = (_url) => _url.searchParams.get('shortcut') || '';

const IMGS = ['jpg', 'png', 'jpeg', 'gif'];

const getFileURL = (_url) => {
  const suffix = _url.searchParams.get('suffix').toLowerCase();

  if (IMGS.indexOf(suffix) !== -1) {
    return '图片消息';
  }

  return '';
}

function process(msg) {
  const part = msg || '';
  let urlCopy = null;

  if (part.startsWith('http')) {
    urlCopy = new url.URL(part);

    if (urlCopy.host === 'interface.im.taobao.com') {
      return getFileURL(urlCopy);
    } if (urlCopy.host === 'trade.taobao.com') { // 订单卡片 放行
    } else if (urlCopy.host === 'item.taobao.com') { // 链接卡片 放行
    } else if (urlCopy.host.endsWith('mall.taobao.com')) {
      // 店铺卡片 过滤
      return '';
    }

    return part;
  } if (part.startsWith('该用户由')) {
    return '';
  } if (part.startsWith('pic:')) {
    urlCopy = new url.URL(part);

    if (part.startsWith('pic:imemotion')) {
      return getEmoji(urlCopy);
    }
    return '';
  }
  return part;
}

const translate = (line) => line.split(',').map((part) => (process(part) || '').trim())
  .filter((item) => item)
  .join(' ');

exports.translate = translate;
