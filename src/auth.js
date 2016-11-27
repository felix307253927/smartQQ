/**
 * @license Created by felix on 16-11-24.
 * @email   307253927@qq.com
 */

'use strict';
const fetch = require('node-fetch');
const fs    = require('fs');
const open  = require('opn');

const qr       = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=" + Math.random();
const qrLogin  = "https://ssl.ptlogin2.qq.com/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-14-96067&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10145&login_sig=&pt_randsalt=0";
const loginUrl = "http://d1.web2.qq.com/channel/login2";
//详情:http://www.cnblogs.com/hands/p/5116745.html
let _cookies   = new Map(), _cookieStr = '';
let _callback;

export default class Auth {

  constructor() {
    this.vfwebqq    = '';
    this.ptwebqq    = '';
    this.cip        = '';
    this.f          = '';
    this.index      = '';
    this.psessionid = '';
    this.status     = '';
    this.uin        = '';
    this.user_state = '';
  }

  login(callback) {
    _callback = callback;
    this.getQR().then(qrData => {
      this.qrData = qrData;
      this.loopCheck();
    });
  }

  static getCookieStr(force) {
    if (force) {
      let ret = '';
      _cookies.forEach((v, k) => {
        ret += `${k}=${v};`
      });
      return _cookieStr = ret;
    }
    return _cookieStr;
  }

  static getCookieByKey(key) {
    return _cookies.get(key);
  }

  static getCookie() {
    return _cookies;
  }

  static setCookie(cookie) {
    if (/(\w+)=([^;]*);/.test(cookie)) {
      if (RegExp.$2 || !_cookies.has(RegExp.$1)) {
        _cookies.set(RegExp.$1, RegExp.$2);
        Auth.getCookieStr(true);
      }
    }
  }

  getQR() {
    let type = '';
    return fetch(qr, {
      headers: {
        Host   : "ssl.ptlogin2.qq.com",
        Referer: "https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001"
      }
    })
      .then(res => {
        type       = res.headers.get("content-type");
        let cookie = res.headers.getAll("set-cookie");
        cookie.forEach(c => Auth.setCookie(c));
        let dest = fs.createWriteStream('./qr.png');
        res.body.pipe(dest);
        return res.buffer()
      })
      .then(buff => {
        setTimeout(() => {
          open('./qr.png');
        }, 1000);
        return "data:" + type + ";base64," + buff.toString('base64');
      })
  }

  checkQR() {
    return fetch(qrLogin, {
      headers: {
        Cookie : Auth.getCookieStr(),
        Host   : "ssl.ptlogin2.qq.com",
        Referer: "https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001"
      }
    }).then(res => {
      let ck = res.headers.getAll("set-cookie");
      if (ck && ck.length) {
        ck.forEach(c => Auth.setCookie(c));
      }
      return res.text()
    }).then(text => {
      /ptuiCB\('(\d+)','(\d+)','(.*)','(\d+)','(.*)', '(.*)'\)/.test(text);
      return {
        code: RegExp.$1, //0:无错误, 66:已失效, 66:未失效, 67:验证中
        arg2: RegExp.$2,
        url : RegExp.$3, //跳转url,只有访问过跳转URL才算真正第一次登录完毕。
        arg4: RegExp.$4,
        msg : RegExp.$5,
        arg6: RegExp.$6
      };
    });
  }

  loopCheck() {
    setTimeout(() => {
      this.checkQR().then(data => {
        console.log('code:', data.code, data.msg);
        if (data.code == 65) {
          console.log('二维码已失效! 正在重新获取。。。');
          this.login();
        } else if (data.code == 0) {
          this.login1(data.url);
        } else {
          this.loopCheck();
        }
      });
    }, 3000);
  }

  login1(url) {
    return fetch(url, {
      redirect: "manual", // 手动提取重定向头
      headers : {
        Cookie: Auth.getCookieStr()
      }
    }).then(res => {
      let ck = res.headers.getAll("set-cookie");
      if (ck && ck.length) {
        ck.forEach(c => Auth.setCookie(c));
      }
      this.getvfwebqq();
      this.report();
    });
  }

  report(){
    fetch("http://cgi.connect.qq.com/report/report?strValue=0&nValue=11202&tag=0&qver=0.0.1&t="+Date.now(),{
      headers:{
        Cookie: Auth.getCookieStr(),
        Referer:"http://w.qq.com/",
        Host:"cgi.connect.qq.com"
      }
    }).then(res=>res.json()).then(console.log)
  }

  getvfwebqq() {
    let vfUrl = `http://s.web2.qq.com/api/getvfwebqq?ptwebqq=${this.ptwebqq = Auth.getCookieByKey('ptwebqq')}&clientid=53999199&psessionid=&t=${Date.now()}`;
    fetch(vfUrl, {
      method : "GET",
      headers: {
        Cookie : Auth.getCookieStr(),
        Host   : "s.web2.qq.com",
        Referer: "http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1"
      }
    }).then(res => res.json()).then(data => {
      this.vfwebqq = data.result.vfwebqq;
      this.login2();
    })
  }

  login2() {
    fetch(loginUrl, {
      method : "POST",
      body   : 'r=' + encodeURIComponent(JSON.stringify({
        "ptwebqq"   : this.ptwebqq,
        "clientid"  : 53999199,
        "psessionid": "", "status": "online"
      })),
      headers: {
        Cookie      : Auth.getCookieStr(),
        Origin      : "http://d1.web2.qq.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2914.3 Safari/537.36",
        Referer     : "http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2"
      }
    }).then(res => res.json()).then(data => {
      if (data.retcode == 0) {
        this.cip        = data.result.cip;
        this.f          = data.result.f;
        this.index      = data.result.index;
        this.psessionid = data.result.psessionid;
        this.status     = data.result.status;
        this.uin        = data.result.uin;
        this.user_state = data.result.user_state;
        _callback && _callback(this);
      } else {
        throw new Error(JSON.stringify(data));
      }
    })
  }
}