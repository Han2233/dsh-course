const assert=require('node:assert/strict');const m=require('../assets/workbench03-model.js');
const go=(s,type,extra={})=>m.reduce(s,{type,...extra});
function ready(plugin=true){let s=go(m.initial(),'assemble');if(plugin){s=go(s,'install');s=go(s,'fs');s=go(s,'settle');}return s;}
function send(s,text='读取配置，修改错误并检查',target='followup'){return go(s,'loop-send',{text,target});}
function finish(s){for(let i=0;i<100;i++){if(m.loopControl(s).disabled)return s;s=go(s,'loop-next');}throw Error('loop did not settle');}
let s=finish(send(ready()));assert.equal(s.loop.outcome,'completed');assert.equal(s.loop.turn,1);assert.equal(s.loop.step,4);assert.equal(s.loop.requestCount,4);assert.equal(s.loop.history.filter(m=>m.role==='tool').length,3);assert.equal(s.loop.history.filter(m=>m.role==='user').length,1);
assert.equal(s.loop.requests[0].messages.filter(m=>m.role==='tool').length,0);assert.equal(s.loop.requests[1].messages.filter(m=>m.role==='tool').length,1);
s=ready();s=go(s,'loop-scenario',{value:'retry'});s=finish(send(s));assert.equal(s.loop.requestCount,5);assert.equal(s.loop.step,4);assert.equal(s.loop.history.filter(m=>m.role==='user').length,1);assert.deepEqual(s.loop.requests[0],s.loop.requests[1]);assert.equal(s.loop.events.filter(e=>e.type==='assistant/attempt').length,1);
s=ready();s=go(s,'loop-scenario',{value:'fatal'});s=finish(send(s));assert.equal(s.loop.outcome,'error');assert.equal(s.loop.history.filter(m=>m.role==='assistant').length,0);
s=ready();s=go(s,'loop-scenario',{value:'max'});s=finish(send(s));assert.equal(s.loop.outcome,'max-tokens');assert.equal(s.loop.history.filter(m=>m.role==='tool').length,0);
s=finish(send(ready(false)));assert.equal(s.loop.requestCount,1);assert.equal(s.loop.requests[0].tools.length,0);
s=send(ready(),'只排队','inject');assert.equal(m.loopControl(s).disabled,true);s=send(s,'唤醒','followup');s=finish(s);assert.equal(s.loop.history.filter(m=>m.role==='user').length,2);
s=send(ready());for(let i=0;i<4;i++)s=go(s,'loop-next');assert.equal(s.loop.phase,'stream');assert.ok(s.loop.live);const prefix=s.loop.live;s=go(s,'loop-cancel');assert.equal(s.loop.outcome,'aborted');assert.equal(s.loop.history.at(-1).interrupted,true);assert.equal(s.loop.history.at(-1).content[0].text,prefix);s=finish(send(s,'继续'));assert.ok(s.loop.requests.some(r=>r.messages.some(m=>m.interrupted)));
s=send(ready());for(let i=0;i<3;i++)s=go(s,'loop-next');const snap=structuredClone(s.loop.request);s=send(s,'中途修改要求','steer');assert.deepEqual(s.loop.request,snap);s=finish(s);assert.equal(s.loop.turn,1);assert.ok(s.loop.requests[1].messages.some(m=>m.content[0].text==='中途修改要求'));
s=send(ready());for(let i=0;i<3;i++)s=go(s,'loop-next');s=send(s,'下一轮','followup');s=finish(s);assert.equal(s.loop.turn,2);
s=send(ready());s=go(s,'loop-next');s=send(s,'尾消息');s=go(s,'loop-keep',{value:true});s=go(s,'loop-cancel');assert.equal(s.loop.queueTurn.length,1);assert.equal(m.loopControl(s).disabled,true);
s=send(ready());while(s.loop.phase!=='tool')s=go(s,'loop-next');s=go(s,'loop-cancel');assert.equal(s.loop.history.at(-1).content[0].text,'ABORTED_BEFORE_DISPATCH');
s=send(ready());while(s.loop.phase!=='tool')s=go(s,'loop-next');s=go(s,'fs');s=go(s,'settle');s=finish(s);assert.equal(s.loop.outcome,'completed');assert.equal(s.loop.history.filter(m=>m.role==='tool').length,1);
s=go(send(ready()),'base',{action:{type:'stop'}});assert.equal(s.loop.queueTurn.length,0);assert.equal(m.loopControl(s).disabled,true);s=go(s,'reset');assert.equal(s.loop.history.length,0);
console.log('Lesson 03: four-step task, frozen request snapshots, retry without duplicate user input, terminal error, max tokens, absent tools, injection/waking, steering vs followup, interrupted prefix, parked inbox, paired cancellation, service removal, stop/reset passed.');
