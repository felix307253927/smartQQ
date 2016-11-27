/**
 * Created by Felix hu on 2016/11/26.
 */

import fetch from 'node-fetch';

export default class Robot{
  constructor(){
//    this.key = "2e0e9061206244f9b4876c641908eb0b";   //QQ
    this.key = "61dbcca4c9fd4f00850198f5ef835bb0";     //微信
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