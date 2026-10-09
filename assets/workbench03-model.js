/* Lesson 03: deterministic browser mock. No model/network/filesystem calls. */
(function(root){
'use strict';
const parent=typeof module!=='undefined'&&module.exports?require('./workbench02-model.js'):root.DSHWorkbench02;
const plans=[
 {name:'demo.read',args:{path:'config.json'},text:['先查看','配置内容。'],result:'教学预设结果：{"timeout":0}；尚未读真实文件。'},
 {name:'demo.edit',args:{path:'config.json',timeout:30},text:['发现 timeout 为 0。','请求修改为 30。'],result:'教学预设结果：修改成功；未改写任何文件。'},
 {name:'demo.check',args:{command:'check-config'},text:['接下来','请求运行检查。'],result:'教学预设结果：检查通过；未运行任何命令。'},
 {text:['依据本次预设工具结果，','配置修正与检查流程已结束。以上均为教学模拟。']}
];
function loopInitial(){return {phase:'idle',stepOpen:false,turn:0,step:0,attempt:0,requestCount:0,queueTurn:[],queueStep:[],wake:false,history:[],events:[],frames:[],requests:[],assembly:null,request:null,claimed:[],live:'',chunk:0,plan:0,scenario:'normal',retried:false,failedOnce:false,keepInbox:false,errorTool:false,outcome:null};}
function initial(preset='standard'){return {...parent.initial(preset),loop:loopInitial()};}
function active(l){return l.phase!=='idle';}
function textMessage(role,text,extra={}){return {role,content:[{type:'text',text}],...extra};}
function add(l,type,data={}){l.events.push({type,turn:l.turn,step:l.step,...data});}
function end(l,outcome){if(l.stepOpen)add(l,'step/end');l.stepOpen=false;add(l,'turn/end',{reason:outcome});l.phase='idle';l.outcome=outcome;l.live='';l.wake=l.queueTurn.length>0||l.queueStep.length>0;}
function cancel(l){
 if(active(l)){
  if(l.phase==='stream'&&l.live){l.history.push(textMessage('assistant',l.live,{interrupted:true}));add(l,'assistant/message',{interrupted:true});l.frames.push({type:'end',attempt:l.attempt,outcome:'interrupted'});}
  else if(l.phase==='stream'){add(l,'assistant/attempt',{cancelled:true});l.frames.push({type:'end',attempt:l.attempt,outcome:'cancelled'});}
  if(l.phase==='tool'){
   const callId='t'+l.turn+'s'+l.step;
   l.history.push(textMessage('tool','ABORTED_BEFORE_DISPATCH',{callId}));add(l,'tool/call',{callId,synthetic:true});add(l,'tool/result',{code:'ABORTED_BEFORE_DISPATCH'});
  }
  end(l,'aborted');
 }
 if(!l.keepInbox){l.queueTurn=[];l.queueStep=[];}
 l.wake=false; // Preserved queue stays parked until new waking input.
}
function schemas(){return plans.filter(p=>p.name).map(p=>({name:p.name,description:'第三课教学占位工具；仅返回预设结果',parameters:{type:'object',properties:p.name==='demo.check'?{command:{type:'string'}}:{path:{type:'string'},...(p.name==='demo.edit'?{timeout:{type:'number'}}:{})},required:[p.name==='demo.check'?'command':'path']}}));}
function response(l){
 if(l.errorTool)return {text:['教学工具已不可用。','本轮停止后续修改；可恢复插件后发起新任务。']};
 if(!l.assembly?.tools.length)return {text:['本次请求没有教学工具声明。','仅作文字回应，没有读取、修改或检查文件。']};
 return plans[l.plan]||plans[3];
}
function reduce(old,a){
 if(a.type==='reset')return initial(old.base.preset);
 if(a.type==='preset'&&old.base.status==='idle')return initial(a.value);
 if(!a.type.startsWith('loop-')){
  const p=parent.reduce(old,a);if(p===old)return old;
  const next={...p,loop:structuredClone(old.loop)};
  if(p.plugin==='ACTIVE')next.resources=['demo.read / demo.edit / demo.check 声明','demo/inspect 监听'];
  if(a.type==='base'&&a.action.type==='stop'){next.loop.keepInbox=false;cancel(next.loop);}
  return next;
 }
 const s={...old,loop:structuredClone(old.loop)},l=s.loop;
 if(a.type==='loop-keep'){l.keepInbox=!!a.value;return s;}
 if(a.type==='loop-scenario'){if(!active(l))l.scenario=['normal','retry','fatal','max'].includes(a.value)?a.value:'normal';return s;}
 if(a.type==='loop-cancel'){cancel(l);return s;}
 if(s.base.status!=='bound')return old;
 if(a.type==='loop-send'){
  const text=String(a.text||'').trim().slice(0,2000);if(!text)return old;
  const target=a.target==='followup'?'queueTurn':'queueStep';l[target].push(text);add(l,'agent/inbox/spliced',{target,inserted:text});
  if(a.target!=='inject')l.wake=true;
  return s;
 }
 if(a.type!=='loop-next')return old;
 if(l.phase==='idle'){
  if(!l.wake||!(l.queueTurn.length||l.queueStep.length))return old;
  l.turn++;l.step=1;l.plan=0;l.failedOnce=false;l.errorTool=false;l.retried=false;l.outcome=null;l.live='';l.request=null;l.assembly=null;
  add(l,'turn/start');l.claimed=l.queueStep.splice(0);if(l.queueTurn.length)l.claimed.push(l.queueTurn.shift());l.phase='assemble';return s;
 }
 if(l.phase==='assemble'){
  l.assembly={system:'你是课程中的模拟 Agent。所有响应和工具结果均为预设脚本；不得视为真实执行。',tools:s.plugin==='ACTIVE'?schemas():[]};
  add(l,'agent/pre-step',{claimed:l.claimed.length});add(l,'step/start');l.stepOpen=true;l.phase='prepare';return s;
 }
 if(l.phase==='prepare'||l.phase==='retry'){
  const retry=l.phase==='retry';
  if(!l.history.some(x=>x.role==='system'))l.history.unshift(textMessage('system',l.assembly.system));
  if(!retry){for(const text of l.claimed){l.history.push(textMessage('user',text));add(l,'user/message',{text});}}
  const previous=l.requests.at(-1);
  const names=l.assembly.tools.map(t=>t.name);
  if(previous&&JSON.stringify(previous.tools.map(t=>t.name))!==JSON.stringify(names)){
   l.history.push(textMessage('developer','教学工具声明变化：'+(names.join(', ')||'无')));add(l,'developer/message',{tools:names});
  }
  l.request={provider:'teaching-mock',model:'scripted-agent',messages:structuredClone(l.history),tools:structuredClone(l.assembly.tools)};
  l.requests.push(structuredClone(l.request));l.requestCount++;l.attempt++;l.chunk=0;l.live='';
  add(l,'request-built',{attempt:l.attempt,retry});l.frames.push({type:'start',attempt:l.attempt});l.phase='stream';return s;
 }
 if(l.phase==='stream'){
  const r=response(l);
  if(l.chunk<r.text.length){const chunk=r.text[l.chunk++];l.live+=chunk;l.frames.push({type:'text-delta',attempt:l.attempt,text:chunk});return s;}
  if(['retry','fatal'].includes(l.scenario)&&!l.failedOnce){
   l.failedOnce=true;add(l,'assistant/attempt',{failure:'SERVICE_UNAVAILABLE'});l.frames.push({type:'end',attempt:l.attempt,outcome:'attempt-failed'});l.live='';
   if(l.scenario==='retry'){add(l,'llm/retry',{demoDelay:'手动推进，最多重试一次'});l.phase='backoff';}
   else end(l,'error');
   return s;
  }
  const content=[{type:'text',text:l.live}];
  if(r.name&&l.scenario!=='max')content.push({type:'tool-call',id:'t'+l.turn+'s'+l.step,name:r.name,arguments:JSON.stringify(r.args)});
  l.history.push({role:'assistant',content});add(l,'assistant/message',{attempt:l.attempt});l.frames.push({type:'end',attempt:l.attempt,outcome:'committed'});l.live='';
  if(l.scenario==='max'){end(l,'max-tokens');return s;}
  if(r.name)l.phase='tool';else l.phase='boundary';return s;
 }
 if(l.phase==='backoff'){add(l,'llm/retry-started');l.phase='retry';return s;}
 if(l.phase==='tool'){
  const r=response(l);const result=s.plugin==='ACTIVE'?r.result:'TOOL_NOT_AVAILABLE：教学插件已停止，不执行占位调用。';
  l.history.push(textMessage('tool',result,{callId:'t'+l.turn+'s'+l.step}));add(l,'tool/call',{name:r.name});add(l,'tool/result',{text:result});
  if(s.plugin!=='ACTIVE')l.errorTool=true;
  l.phase='boundary';return s;
 }
 if(l.phase==='boundary'){
  const hadTool=!!response(l).name; // error result still needs another model step.
  if(!hadTool&&!l.errorTool&&!l.queueStep.length){end(l,'completed');return s;}
  if(l.errorTool&&l.plan===4&&!l.queueStep.length){end(l,'completed');return s;}
  add(l,'step/end');l.stepOpen=false;l.step++;l.plan=l.errorTool?4:Math.min(l.plan+1,3);l.claimed=l.queueStep.splice(0);l.phase='assemble';l.live='';return s;
 }
 return old;
}
function loopControl(s){
 const l=s.loop;if(s.base.status!=='bound')return {disabled:true,label:'先完成宿主组装',reason:'使用上方绿色按钮完成组装与会话绑定。'};
 if(l.phase==='idle')return {disabled:!l.wake||!(l.queueTurn.length||l.queueStep.length),label:'开始下一轮 Turn',reason:!l.wake?'发送 followup 或 steer 唤醒；单独 inject 不会启动循环。':''};
 return {disabled:false,label:{assemble:'组装提示词与工具',prepare:'构建请求并启动 Attempt',stream:l.chunk<response(l).text.length?'接收下一段文本':'结算本次模型响应',tool:'接收预设工具结果',boundary:'进入下个边界',backoff:'结束模拟退避等待',retry:'重试同一 Step'}[l.phase],reason:''};
}
const api={initial,reduce,controls:parent.controls,nextAction:parent.nextAction,loopControl,schemas};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DSHWorkbench03=api;
})(typeof globalThis!=='undefined'?globalThis:this);
