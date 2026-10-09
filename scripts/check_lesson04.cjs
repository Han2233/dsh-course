const assert=require('node:assert/strict');
const m=require('../assets/workbench04-model.js');
function setup(config={}){let s=m.initial();for(const type of ['assemble','install','fs','settle'])s=m.reduce(s,{type});for(const [key,value] of Object.entries(config))s=m.reduce(s,{type:'tool-config',key,value});return s;}
function send(s){return m.reduce(s,{type:'loop-send',target:'followup',text:'Fix config'});}
function until(s,predicate){for(let n=0;n<150;n++){if(predicate(s))return s;assert.equal(m.loopControl(s).disabled,false,'Unexpected disabled step '+JSON.stringify(s.env.active));s=m.reduce(s,{type:'loop-next'});}throw new Error('did not reach state');}
function finish(s,approval='allow'){for(let n=0;n<150;n++){if(s.loop.phase==='idle'&&s.loop.outcome&&!s.loop.wake)return s;s=m.reduce(s,s.env.active?.stage==='approval'?{type:'tool-approval',value:approval}:{type:'loop-next'});}throw new Error('did not finish');}
let s=send(setup());s=until(s,x=>x.env.active?.stage==='approval');
assert.equal(s.env.version,1);assert.equal(s.env.observed,1);assert.equal(m.loopControl(s).disabled,true);
assert.deepEqual(m.reduce(s,{type:'loop-next'}),s,'approval is not auto-granted');
assert.equal(m.reduce(s,{type:'tool-config',key:'policy',value:'allow'}).env.policy,'ask','cannot change policy while active');
s=finish(s);assert.equal(JSON.parse(s.env.file).timeout,30);assert.equal(s.env.version,2);assert.equal(s.loop.step,4);assert.equal(s.loop.requests.length,4);assert.match(s.env.last.content,/PASS/);
assert.equal(s.loop.requests[0].messages.filter(x=>x.role==='tool').length,0,'old request remains unchanged');
assert.equal(s.loop.requests.at(-1).messages.filter(x=>x.role==='tool').length,3);
for(const [config,approval,error] of [[{},'deny','APPROVAL_REJECTED'],[{policy:'deny'},'allow','POLICY_DENIED'],[{guard:true},'allow','GUARD_DENIED'],[{mode:'read-only'},'allow','FS_SANDBOX_DENIED']]){
 const x=finish(send(setup(config)),approval);assert.equal(JSON.parse(x.env.file).timeout,0);assert.equal(x.env.version,1);assert.match(x.env.last.content,new RegExp(error));assert.equal(x.loop.history.filter(x=>x.role==='tool').length,2);
}
s=until(send(setup()),x=>x.env.active?.stage==='approval');s=m.reduce(s,{type:'tool-external'});assert.equal(s.env.version,2);assert.equal(s.env.observed,1);s=finish(s);assert.match(s.env.last.content,/FS_CONFLICT/);assert.equal(JSON.parse(s.env.file).timeout,0);
s=finish(send(s));assert.equal(JSON.parse(s.env.file).timeout,30,'fresh task rereads before modifying');assert.match(s.env.file,/external change/);
s=finish(send(setup({postBlock:true})));assert.equal(JSON.parse(s.env.file).timeout,30);assert.match(s.env.last.content,/POST_BLOCKED/);assert.equal(s.env.last.isError,true);
s=until(send(setup({policy:'allow'})),x=>x.env.active?.call.name==='demo.edit'&&x.env.active.stage==='post');assert.equal(s.env.version,2);s=m.reduce(s,{type:'loop-cancel'});assert.equal(s.env.version,2);assert.equal(JSON.parse(s.env.file).timeout,30);assert.match(s.loop.history.at(-1).content[0].text,/ABORTED_AFTER_EXECUTION/);assert.equal(s.env.active,null);
s=until(send(setup()),x=>x.env.active?.stage==='approval');s=m.reduce(s,{type:'loop-cancel'});assert.equal(s.env.version,1);assert.equal(s.env.active,null);assert.equal(s.loop.phase,'idle');
s=until(send(setup()),x=>x.env.active?.stage==='approval');s=m.reduce(s,{type:'base',action:{type:'stop'}});assert.equal(s.env.active,null);assert.equal(s.loop.phase,'idle');assert.equal(s.base.status,'stopped');
s=m.reduce(s,{type:'reset'});assert.equal(s.env.log.length,0);assert.equal(s.env.version,1);assert.equal(s.env.observed,null);
s=setup({policy:'allow'});s=m.reduce(s,{type:'loop-scenario',value:'retry'});s=finish(send(s));assert.equal(s.loop.requests.length,5);assert.equal(s.env.version,2);assert.equal(s.loop.history.filter(x=>x.role==='user').length,1);
s=until(send(setup({policy:'allow'})),x=>x.env.active?.stage==='execute');s=m.reduce(s,{type:'dispose'});s=finish(s);assert.match(s.env.last.content,/UNKNOWN_TOOL/);assert.equal(s.env.version,1);
console.log('Lesson 04 model: live file mutation, request snapshots, approval boundaries, deny/guard/read-only, conflict/re-read, post-block side effects, cancellation before/after execution, host stop/reset, retry and missing tool passed.');
