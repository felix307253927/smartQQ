/**
 * Created by Felix hu on 2016/11/26.
 */

import fetch from 'node-fetch';
import Auth from './auth';
import Robot from './robot';

let auth  = new Auth();
let robot = new Robot();

class QQ {
  constructor() {
    let t           = (new Date()).getTime();
    t               = (t - t % 1000) / 1000;
    t               = t % 10000 * 10000;
    this.messageId  = t + 10;
    this.user       = void 0;
    this.friends    = [];
    this.infoList   = [];
    this.categories = [];
    this.marknames  = [];
    this.chatMap    = new Map();
    auth.login(auth => {
      this.getInfo();
      console.log("获取好友列表>>>>>>>>>>");
      this.getFrieds().then(() => {
        console.log("启动心跳程序>>>>>>>>>>");
        this.poll();
      });
    });
  }

  getInfo() {
    let url = "http://s.web2.qq.com/api/get_self_info2?t=" + Date.now();
    fetch(url, {
      headers: {
        Cookie : Auth.getCookieStr(),
        Referer: "http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1",
        Host   : "s.web2.qq.com"
      }
    }).then(res => res.json()).then(data => {
      if (data.retcode == 0) {
        this.user = data.result;
      }
//      console.log(data)
    })
  }

  getFrieds() {
    return fetch("http://s.web2.qq.com/api/get_user_friends2", {
      method : 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie        : Auth.getCookieStr(),
        Host          : "s.web2.qq.com",
        Origin        : "http://s.web2.qq.com",
        Referer       : "http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1",
        "User-Agent"  : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2914.3 Safari/537.36"
      },
      body   : "r=" + encodeURIComponent(JSON.stringify({
          "vfwebqq": auth.vfwebqq,
          "hash"   : this.hash(auth.uin, auth.ptwebqq)
        }
      ))
    }).then(res => res.json()).then(data => {
      if (data.retcode == 0) {
        this.friends    = data.result.friends;
        this.infoList   = data.result.infoList;
        this.categories = data.result.categories;
        this.marknames  = data.result.marknames;
      }
    })
  }

  poll() {
    fetch("https://d1.web2.qq.com/channel/poll2", {
      method : 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie        : Auth.getCookieStr(),
        Host          : "d1.web2.qq.com",
        Origin        : "https://d1.web2.qq.com",
        "User-Agent"  : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2914.3 Safari/537.36",
        Referer       : "https://d1.web2.qq.com/cfproxy.html?v=20151105001&callback=1"
      },
      body   : 'r=' + encodeURIComponent(JSON.stringify({
        "ptwebqq"   : auth.ptwebqq,
        "clientid"  : 53999199,
        "psessionid": auth.psessionid,
        "key"       : ""
      }))
    }).then(res => res.json())
      .then(data => {
        if (data.retcode == 0) {
          if (data.result) {
            this.dealMessage(data.result, data => {
//            console.log(222,this.messageId,data);
              console.log('豆豆：', data.text);
              this.poll();
            });
          } else {
            this.poll();
          }
        } else {
          console.log(111, data);
        }
      }).catch(() => {
      this.poll();
    })
  }

  sendMessage(uid, message, font) {
    font = font || ["font", {"name": "宋体", "size": 10, "style": [0, 0, 0], "color": "000000"}];
    return fetch("https://d1.web2.qq.com/channel/send_buddy_msg2", {
      method : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie        : Auth.getCookieStr(),
        Host          : "d1.web2.qq.com",
        Origin        : "https://d1.web2.qq.com",
        Referer       : "https://d1.web2.qq.com/cfproxy.html?v=20151105001&callback=1"
      },
      body   : "r=" + encodeURIComponent(JSON.stringify({
        "to"        : uid,
        "content"   : "[" + JSON.stringify(message) + "," + JSON.stringify(font) + "]",
        "face"      : 525,
        "clientid"  : 53999199,
        "msg_id"    : ++this.messageId,
        "psessionid": auth.psessionid
      }))
    }).then(res => res.json());
  }

  dealMessage(msgs, callback) {
    let flag = false;
    msgs.forEach(m => {
      if (m.poll_type === "message") {
        let msg = m.value.content[1], cur = {};
        flag    = true;
        if (this.chatMap.has(m.value.from_uin)) {
          cur       = this.chatMap.get(m.value.from_uin);
          cur.first = false;
        } else {
          this.marknames.find(f => {
            if (f.uin == m.value.from_uin) {
              cur = f;
              return cur.first = true;
            }
          });
          this.chatMap.set(m.value.from_uin, cur);
        }
        console.log(cur.markname, msg);
        let send = (msg) => {
          this.sendMessage(m.value.from_uin, '豆豆：' + msg, m.value.content[0]).then(data => {
            data.text = msg;
            console.log(0, data);
            callback && callback(data);
          }).catch(err => {
            console.error('error', err);
            callback && callback({text: msg});
          });
        };
        if (cur.first) {
          msg = `${cur.markname||"你好"},我是主人的小宠物豆豆，我有什么可以帮你的? 你可以说：\n  豆豆别说话  --我就不说话了\n  豆豆醒醒     --我就回来了`;
          send(msg);
        } else {
          if (msg.trim() == "豆豆醒醒") {
            send("哎哎，我来了\n  (づ｡◕‿‿◕｡)づ");
            return cur.stop = false;
          } else if (cur.stop || msg.trim() == "豆豆别说话") {
            cur.stop ? (callback && callback({text: msg})) : send("(๑•́ ₃ •̀๑)  我不说了");
            return cur.stop = true;
          }
          robot.getReply(msg).then(data => {
            if (data.code >= 100000) {
              if(data.text != "这是问号"){
                msg = data.text;
                if(data.url){
                  msg += "\n详情：" + data.url;
                }
                if(data.list){
                  let info = "";
                  for(let i=0,d;i<2;i++){
                    d = data.list[i];
                    info += `\n ${i+1}. 详情：${d.info}\n 地址：${d.detailurl}`
                  }
                  msg += info;
                }
              } else{
                msg = '主人没告诉我这是什么 \n(๑•́ ₃ •̀๑)';
              }
            } else {
              msg = '(๑•́ ₃ •̀๑) :' + msg;
              console.log(44444, data);
            }
            send(msg);
          });
        }
      }
    });
    !flag && callback && callback();
  }

  hash(uin, ptvfwebqq) {
    uin += "";
    let ptb = [];
    for (let i = 0; i < ptvfwebqq.length; i++) {
      let ptbIndex = i % 4;
      ptb[ptbIndex] ^= ptvfwebqq.charCodeAt(i);
    }
    let salt    = ["EC", "OK"];
    let uinByte = [];
    uinByte[0]  = (((uin >> 24) & 0xFF) ^ salt[0].charCodeAt(0));
    uinByte[1]  = (((uin >> 16) & 0xFF) ^ salt[0].charCodeAt(1));
    uinByte[2]  = (((uin >> 8) & 0xFF) ^ salt[1].charCodeAt(0));
    uinByte[3]  = ((uin & 0xFF) ^ salt[1].charCodeAt(1));
    let result  = [];
    for (let i = 0; i < 8; i++) {
      if (i % 2 == 0)
        result[i] = ptb[i >> 1];
      else
        result[i] = uinByte[i >> 1];
    }

    let hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    let buf = "";

    for (let i = 0; i < result.length; i++) {
      buf += (hex[(result[i] >> 4) & 0xF]);
      buf += (hex[result[i] & 0xF]);
    }
    return buf;
  }
}


new QQ();