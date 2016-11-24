/**
 * @license Created by felix on 16-11-24.
 * @email   307253927@qq.com
 */

'use strict';
const fetch = require('node-fetch');
const fs    = require('fs');
const open  = require('opn');
const FormData = require('form-data');

const qr      = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=" + Math.random();
const qrLogin = "https://ssl.ptlogin2.qq.com/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-14-96067&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10145&login_sig=&pt_randsalt=0";
const loginUrl = "http://d1.web2.qq.com/channel/login2";
//详情:http://www.cnblogs.com/hands/p/5116745.html
let cookie='', ptwebqq='';

function getQR() {
  let type = '';
  return fetch(qr)
    .then(res => {
      type     = res.headers.get("content-type");
      cookie   = res.headers.getAll("set-cookie").join('').replace(/( *PATH=\/; *)|(DOMAIN=[a-zA-Z0-9.]*;)/g, '');
      let dest = fs.createWriteStream('./qr.png');
      res.body.pipe(dest);
      return res.buffer()
    })
    .then(buff => {
      setTimeout(()=>{
        open('./qr.png');
      },1000);
      return "data:" + type + ";base64," + buff.toString('base64');
    })
}

function checkQR() {
  return fetch(qrLogin, {
    headers: {
      Cookie: cookie
    }
  }).then(res => {
    let ck = res.headers.getAll("set-cookie");
    if (ck && ck.length) {
      cookie += ck.join('').replace(/( *PATH=\/; *)|(DOMAIN=[a-zA-Z0-9.]*;)/g, '');
      console.log(cookie)
      cookie.match(/ptwebqq=(\w+);/);
      ptwebqq = RegExp.$1;
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

function login1(url) {
  return fetch(url, {
    headers: {
      Cookie: cookie
    }
  }).then(res => {
    return res.text();
  }).then(() => {
    login2();
  });
}

function getvfwebqq() {
  fetch('http://s.web2.qq.com/api/getvfwebqq?ptwebqq='+ptwebqq+'&clientid=53999199&psessionid=&t=1479989478281',{
    headers:{Cookie:cookie}
  }).then(res=>res.json()).then(data=>{
    console.log(1111,data);
//    login2();
  })
}

function login2() {
  let form = new FormData();
  form.append('r', JSON.stringify({
    "ptwebqq":ptwebqq,
    "clientid":53999199,
    "psessionid":"","status":"online"
  }));
  console.log(form);
  fetch(loginUrl, {
    method:"POST",
    body:form,
    headers:{
      Cookie:cookie,
      Origin:"http://d1.web2.qq.com",
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2914.3 Safari/537.36",
      Referer:"http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2"
    }
  }).then(res=>{
    console.log(res.headers)
    return res.json()
  }).then(data=>{
    console.log(1111,cookie)
    console.log(data)
  })
}

function loopCheck() {
  setTimeout(() => {
    checkQR().then(data => {
      console.log(data.code, data.msg);
      if (data.code == 65) {
        console.log('二维码已失效!')
      } else if (data.code == 0) {
        console.log(data);
        login1(data.url);
      } else {
        loopCheck();
      }
    });
  }, 3000);
}

getQR().then(img => {
  console.log(img);
  loopCheck();
});
