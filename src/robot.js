/**
 * Created by Felix hu on 2016/11/26.
 */

import fetch from 'node-fetch';

export default class Robot{
  constructor(){
   this.key = "www.tuling123.com";   //QQ 申请个图灵机器人
  }

  getReply(text){
    return fetch("http://www.tuling123.com/openapi/api",{
      method:"POST",
      headers: { 'Content-Type': 'application/json' },
      body:JSON.stringify({
        key:this.key,
        info:text
      })
    }).then(res=> res.json())
  }
}