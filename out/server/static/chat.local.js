!(function (e) {
  const n = {};

  function t(r) {
    if (n[r]) return n[r].exports;
    const o = n[r] = {
      i: r,
      l: !1,
      exports: {},
    };
    return e[r].call(o.exports, o, o.exports, t), o.l = !0, o.exports
  }
  t.m = e, t.c = n, t.d = function (e, n, r) {
    t.o(e, n) || Object.defineProperty(e, n, {
      enumerable: !0,
      get: r,
    })
  }, t.r = function (e) {
    typeof Symbol !== 'undefined' && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
      value: 'Module',
    }), Object.defineProperty(e, '__esModule', {
      value: !0,
    })
  }, t.t = function (e, n) {
    if (1 & n && (e = t(e)), 8 & n) return e;
    if (4 & n && typeof e === 'object' && e && e.__esModule) return e;
    const r = Object.create(null);
    if (t.r(r), Object.defineProperty(r, 'default', {
      enumerable: !0,
      value: e,
    }), 2 & n && typeof e !== 'string') {
      for (const o in e) {
        t.d(r, o, ((n) => e[n]).bind(null, o));
      }
    }
    return r
  }, t.n = function (e) {
    const n = e && e.__esModule ? function () {
      return e.default
    } : function () {
      return e
    };
    return t.d(n, 'a', n), n
  }, t.o = function (e, n) {
    return Object.prototype.hasOwnProperty.call(e, n)
  }, t.p = '', t(t.s = 4)
}([function (e, n, t) {
  (function (r) {
    function o() {
      let e;
      try {
        e = n.storage.debug
      } catch (e) {}
      return !e && void 0 !== r && 'env' in r && (e = r.env.DEBUG), e
    }(n = e.exports = t(2)).log = function () {
      return typeof console === 'object' && console.log && Function.prototype.apply.call(console.log, console, arguments)
    }, n.formatArgs = function (e) {
      const t = this.useColors;
      if (e[0] = `${(t ? '%c' : '') + this.namespace + (t ? ' %c' : ' ') + e[0] + (t ? '%c ' : ' ')}+${n.humanize(this.diff)}`, !t) return;
      const r = `color: ${this.color}`;
      e.splice(1, 0, r, 'color: inherit');
      let o = 0;
      let i = 0;
      e[0].replace(/%[a-zA-Z%]/g, (e) => {
        e !== '%%' && (o++, e === '%c' && (i = o))
      }), e.splice(i, 0, r)
    }, n.save = function (e) {
      try {
        e == null ? n.storage.removeItem('debug') : n.storage.debug = e
      } catch (e) {}
    }, n.load = o, n.useColors = function () {
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') return !0;
      return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)
    }, n.storage = typeof chrome !== 'undefined' && void 0 !== chrome.storage ? chrome.storage.local : (function () {
      try {
        return window.localStorage
      } catch (e) {}
    }()), n.colors = ['lightseagreen', 'forestgreen', 'goldenrod', 'dodgerblue', 'darkorchid', 'crimson'], n.formatters.j = function (e) {
      try {
        return JSON.stringify(e)
      } catch (e) {
        return `[UnexpectedJSONParseError]: ${e.message}`
      }
    }, n.enable(o())
  }).call(this, t(1))
}, function (e, n) {
  let t; let r; const
    o = e.exports = {};

  function i() {
    throw new Error('setTimeout has not been defined')
  }

  function c() {
    throw new Error('clearTimeout has not been defined')
  }

  function a(e) {
    if (t === setTimeout) return setTimeout(e, 0);
    if ((t === i || !t) && setTimeout) return t = setTimeout, setTimeout(e, 0);
    try {
      return t(e, 0)
    } catch (n) {
      try {
        return t.call(null, e, 0)
      } catch (n) {
        return t.call(this, e, 0)
      }
    }
  }!(function () {
    try {
      t = typeof setTimeout === 'function' ? setTimeout : i
    } catch (e) {
      t = i
    }
    try {
      r = typeof clearTimeout === 'function' ? clearTimeout : c
    } catch (e) {
      r = c
    }
  }());
  let s; let u = [];
  let l = !1;
  let f = -1;

  function d() {
    l && s && (l = !1, s.length ? u = s.concat(u) : f = -1, u.length && m())
  }

  function m() {
    if (!l) {
      const e = a(d);
      l = !0;
      for (let n = u.length; n;) {
        for (s = u, u = []; ++f < n;) s && s[f].run();
        f = -1, n = u.length
      }
      s = null, l = !1,
      (function (e) {
        if (r === clearTimeout) return clearTimeout(e);
        if ((r === c || !r) && clearTimeout) return r = clearTimeout, clearTimeout(e);
        try {
          r(e)
        } catch (n) {
          try {
            return r.call(null, e)
          } catch (n) {
            return r.call(this, e)
          }
        }
      }(e))
    }
  }

  function p(e, n) {
    this.fun = e, this.array = n
  }

  function h() {}
  o.nextTick = function (e) {
    const n = new Array(arguments.length - 1);
    if (arguments.length > 1) { for (let t = 1; t < arguments.length; t++) n[t - 1] = arguments[t]; }
    u.push(new p(e, n)), u.length !== 1 || l || a(m)
  }, p.prototype.run = function () {
    this.fun.apply(null, this.array)
  }, o.title = 'browser', o.browser = !0, o.env = {}, o.argv = [], o.version = '', o.versions = {}, o.on = h, o.addListener = h, o.once = h, o.off = h, o.removeListener = h, o.removeAllListeners = h, o.emit = h, o.prependListener = h, o.prependOnceListener = h, o.listeners = function (e) {
    return []
  }, o.binding = function (e) {
    throw new Error('process.binding is not supported')
  }, o.cwd = function () {
    return '/'
  }, o.chdir = function (e) {
    throw new Error('process.chdir is not supported')
  }, o.umask = function () {
    return 0
  }
}, function (e, n, t) {
  let r;

  function o(e) {
    function t() {
      if (t.enabled) {
        const e = t;
        const o = +new Date();
        const i = o - (r || o);
        e.diff = i, e.prev = r, e.curr = o, r = o;
        for (var c = new Array(arguments.length), a = 0; a < c.length; a++) c[a] = arguments[a];
        c[0] = n.coerce(c[0]), typeof c[0] !== 'string' && c.unshift('%O');
        let s = 0;
        c[0] = c[0].replace(/%([a-zA-Z%])/g, (t, r) => {
          if (t === '%%') return t;
          s++;
          const o = n.formatters[r];
          if (typeof o === 'function') {
            const i = c[s];
            t = o.call(e, i), c.splice(s, 1), s--
          }
          return t
        }), n.formatArgs.call(e, c), (t.log || n.log || console.log.bind(console)).apply(e, c)
      }
    }
    return t.namespace = e, t.enabled = n.enabled(e), t.useColors = n.useColors(), t.color = (function (e) {
      let t; let
        r = 0;
      for (t in e) r = (r << 5) - r + e.charCodeAt(t), r |= 0;
      return n.colors[Math.abs(r) % n.colors.length]
    }(e)), typeof n.init === 'function' && n.init(t), t
  }(n = e.exports = o.debug = o.default = o).coerce = function (e) {
    return e instanceof Error ? e.stack || e.message : e
  }, n.disable = function () {
    n.enable('')
  }, n.enable = function (e) {
    n.save(e), n.names = [], n.skips = [];
    for (let t = (typeof e === 'string' ? e : '').split(/[\s,]+/), r = t.length, o = 0; o < r; o++) t[o] && ((e = t[o].replace(/\*/g, '.*?'))[0] === '-' ? n.skips.push(new RegExp(`^${e.substr(1)}$`)) : n.names.push(new RegExp(`^${e}$`)))
  }, n.enabled = function (e) {
    let t; let
      r;
    for (t = 0, r = n.skips.length; t < r; t++) { if (n.skips[t].test(e)) return !1; }
    for (t = 0, r = n.names.length; t < r; t++) { if (n.names[t].test(e)) return !0; }
    return !1
  }, n.humanize = t(3), n.names = [], n.skips = [], n.formatters = {}
}, function (e, n) {
  const t = 1e3;
  const r = 60 * t;
  const o = 60 * r;
  const i = 24 * o;
  const c = 365.25 * i;

  function a(e, n, t) {
    if (!(e < n)) return e < 1.5 * n ? `${Math.floor(e / n)} ${t}` : `${Math.ceil(e / n)} ${t}s`
  }
  e.exports = function (e, n) {
    n = n || {};
    let s; const
      u = typeof e;
    if (u === 'string' && e.length > 0) {
      return (function (e) {
        if ((e = String(e)).length > 100) return;
        const n = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);
        if (!n) return;
        const a = parseFloat(n[1]);
        switch ((n[2] || 'ms').toLowerCase()) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return a * c;
        case 'days':
        case 'day':
        case 'd':
          return a * i;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return a * o;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return a * r;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return a * t;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return a;
        default:
        }
      }(e));
    }
    if (u === 'number' && !1 === isNaN(e)) {
      return n.long ? a(s = e, i, 'day') || a(s, o, 'hour') || a(s, r, 'minute') || a(s, t, 'second') || `${s} ms` : (function (e) {
        if (e >= i) return `${Math.round(e / i)}d`;
        if (e >= o) return `${Math.round(e / o)}h`;
        if (e >= r) return `${Math.round(e / r)}m`;
        if (e >= t) return `${Math.round(e / t)}s`;
        return `${e}ms`
      }(e));
    }
    throw new Error(`val is not a non-empty string or a valid number. val=${JSON.stringify(e)}`)
  }
}, function (e, n, t) {
  t.r(n);
  const r = t(0);
  const o = t.n(r);
  const i = o()('filet:utils');
  const c = (new Date()).getTime();
  const a = o()('filet:chatSetup');
  const s = window;
  const u = s.imsdk;
  const l = s.location.href;
  const f = (function () {
    const e = JSON.parse(localStorage.getItem('FLT_CONFIG')).port;
    if (!1 === Number.isInteger(e)) throw new Error('missing port');
    return 'http://127.0.0.1:'.concat(e)
  }());
  const d = new URL(l).searchParams.get('dlguniqname');
  u.invoke('im.login.GetCurrentLoginID').then((e) => {
    const n = e.result.nick;
    return (function (e, n, t) {
      const r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 5;
      const o = 'add script ['.concat(e, ']');
      return new Promise(((c, a) => {
        var s = setTimeout(() => {
          s = null;
          const e = ''.concat(o, ': timeout');
          i(e), a(new Error(e))
        }, 1e3 * r);
        if (document.getElementById(e) !== null && s !== null) return clearTimeout(s), i(''.concat(o, ': already added')), c(!1);
        const u = document.getElementsByTagName('head')[0];
        const l = document.createElement('script');
        l.id = e, l.src = n;
        for (let f = Object.keys(t), d = 0; d < f.length; d++) {
          const m = f[d];
          l.setAttribute('data-'.concat(m), t[m])
        }
        l.onload = function () {
          s !== null && (clearTimeout(s), i(''.concat(o, ': added')), c(!0))
        }, u.appendChild(l)
      }))
    }('leyanBundle', 'https://dist.leyantech.com/static/chat.v0.js?ts='.concat(c), {
      dlgid: d,
      ioURI: f,
      nick: n,
    }))
  }).then((e) => {
    if (e) a('bundle injected');
    else {
      const n = window.lySocket.io;
      const t = n.uri;
      t !== f && (a('setting uri ['.concat(t, '] => [').concat(f, ']')), n.uri = f)
    }
  })
}]));
