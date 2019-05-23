export const blockUntil = async (fn, failCallback, retryInterval = 1) => {
  await fn();

  if (failCallback()) {
    await sleep(retryInterval);
  }
}

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
  }
  dump(content, filePath) {
    const jsonStr = JSON.stringify(content);
    fs.writeFileSync(filePath, jsonStr);
  }
}

export const JsonUtil = new JsonUtilCls();

function process(msg) {
  var part = msg || '';
  var url = null;

  if (part.startsWith('http')) {
    url = new url.URL(part);

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
    url = new url.URL(part);

    if (part.startsWith('pic:imemotion')) {
      return getEmoji(url);
    } else {
      return '';
    }
  } else {
    return part;
  }
};
