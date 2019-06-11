const axios = require('axios');
const { settings } = require('../settings.es6');
const { logger } = require('../logger.es6');

class Shop {
  constructor() {
    this.sid = null;
    this.aid = null;
    this.client = null;
  }

  isSubAccount(account) {
    if (account === null || this.aid === null) {
      logger.warn(`account[${account}] account[${this.aid}] is null`);

      return true;
    }

    const mainAccount = this.aid.split(':')[0];

    const targetAccount = account.slice(8).split(':')[0];
    return mainAccount === targetAccount;
  }

  refreshConfig() {
    logger.info(`refreshing config for [${this.sid}]`);

    return this.client.get('/shop/client-config').then((resp) => {
      const rc = resp.data.config;

      if (rc.CHAR_PER_MIN !== undefined) {
        settings.set('char_per_min', rc.CHAR_PER_MIN);
      }
      if (rc.SPIN_TIME_MIN !== undefined) {
        settings.set('spin_time.min', rc.SPIN_TIME_MIN);
      }

      if (rc.SPIN_TIME_MAX !== undefined) {
        settings.set('spin_time.max', rc.SPIN_TIME_MAX);
      }

      if (rc.CUSTOMER_COOLDOWN_TIMEOUT !== undefined) {
        settings.set('cooldown', rc.CUSTOMER_COOLDOWN_TIMEOUT);
      }

      if (rc.MIMESIS !== undefined) {
        settings.set('mimesis', rc.MIMESIS);
      }

      if (rc.SKIP_Q !== undefined) {
        settings.set('skip_q', rc.SKIP_Q);
      }

      if (rc.INTERRUPT !== undefined) {
        settings.set('interrupt', rc.INTERRUPT);
      }
    }).catch((err) => {
      logger.error(`load config error: ${err}`);
    })
  }

  loadConfig(sid, aid, authToken) {
    logger.info(`going to load remote config for ${sid}`);

    this.sid = sid;
    this.aid = aid;
    this.client = axios.create({
      baseURL: settings.get('account.endpoint'),
      timeout: settings.get('account.timeout'),
      headers: {
        'Authentication-Token': authToken,
      },
    })

    setInterval(() => this.refreshConfig(), 1000 * 60 * 10);

    return this.refreshConfig;
  }
}

export default Shop;
