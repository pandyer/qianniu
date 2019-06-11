const electronIsDev = require('electron-is-dev');
const electronStore = require('electron-store'); // 以文件形式缓存配置

Object.defineProperty(exports, 'isDev', {
  enumerable: true,
  get: () => electronIsDev,
})

const defaults = {
  schema: '2018.12.18',
  interrupt: false,
  account: {
    endpoint: 'https://account.leyanbot.com/api',
    timeout: 3000,
  },
  agent: {
    endpoint: 'wss://agent.leyanbot.com/ws',
    timeout: 3000,
  },
  wingman: {
    endpoint: 'https://wingman.leyantech.com',
  },
  mimesis: true,
  logger: {
    app: {
      maxsize: 10 * 1000 * 1000,
      maxFiles: 5,
    },
  },
  char_per_min: 500,
  spin_time: {
    min: 3,
    max: 5,
  },
  skip_q: false,
  big_heart: false,
}

// eslint-disable-next-line new-cap
const settings = new electronStore({
  defaults,
  name: 'filet',
})

if (settings.get('schema') !== defaults.schema || electronIsDev) {
  settings.clear();
  settings.set(defaults);
}
