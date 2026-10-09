/* Lesson 04: deterministic browser mock. No model/network/filesystem calls. */
(function(root){
'use strict';
const parent=typeof module!=='undefined'&&module.exports?require('./workbench02-model.js'):root.DSHWorkbench02;
const plans=[
 {name:'demo.read',args:{path:'config.json'},text:['先查看','配置内容。']},
 {name:'demo.edit',args:{path:'config.json',timeout:30},text:['发现 timeout 为 0。','请求修改为 30。']},
 {name:'demo.check',args:{command:'check-config'},text:['接下来','请求运行检查。']},
 {text:['已根据虚拟工具结果完成读、改、查。','请对照文件版本与检查输出；未操作本机文件。']}
];
function loopInitial(){return {phase:'idle',stepOpen:false,turn:0,step:0,attempt:0,requestCount:0,queueTurn:[],queueStep:[],wake:false,history:[],events:[],frames:[],requests:[],assembly:null,request:null,claimed:[],live:'',chunk:0,plan:0,scenario:'normal',retried:false,failedOnce:false,keepInbox:false,errorTool:false,outcome:null};}
function initial(preset='standard'){return {...parent.initial(preset),loop:loopInitial(),env:environment()};}
function active(l){return l.phase!=='idle';}
function textMessage(role,text,extra={}){return {role,content:[{type:'text',text}],...extra};}
function add(l,type,data={}){l.events.push({type,turn:l.turn,step:l.step,...data});}
function end(l,outcome){if(l.stepOpen)add(l,'step/end');l.stepOpen=false;add(l,'turn/end',{reason:outcome});l.phase='idle';l.outcome=outcome;l.live='';l.wake=l.queueTurn.length>0||l.queueStep.length>0;}
function cancel(l,env){
 if(active(l)){
  if(l.phase==='stream'&&l.live){l.history.push(textMessage('assistant',l.live,{interrupted:true}));add(l,'assistant/message',{interrupted:true});l.frames.push({type:'end',attempt:l.attempt,outcome:'interrupted'});}
  else if(l.phase==='stream'){add(l,'assistant/attempt',{cancelled:true});l.frames.push({type:'end',attempt:l.attempt,outcome:'cancelled'});}
  if(l.phase==='tool'){
   const callId='t'+l.turn+'s'+l.step;
   const executed=!!env?.active?.executed;
   const code=executed?'ABORTED_AFTER_EXECUTION：副作用保留，取消不回滚。':'ABORTED_BEFORE_DISPATCH';
   l.history.push(textMessage('tool',code,{callId}));if(!env?.active)add(l,'tool/call',{callId,synthetic:true});add(l,'tool/result',{code});
   if(env){env.log.push({stage:'cancel',detail:code});env.last={isError:true,content:code};env.active=null;}
  }
  end(l,'aborted');
 }
 if(!l.keepInbox){l.queueTurn=[];l.queueStep=[];}
 l.wake=false; // Preserved queue stays parked until new waking input.
}
function schemas(){return plans.filter(p=>p.name).map(p=>({name:p.name,description:'第四课虚拟工具；对浏览器内存中的配置执行操作',parameters:{type:'object',properties:p.name==='demo.check'?{command:{type:'string'}}:{path:{type:'string'},...(p.name==='demo.edit'?{timeout:{type:'number'}}:{})},required:[p.name==='demo.check'?'command':'path']}}));}
function response(l){
 if(l.errorTool)return {text:['本轮工具返回错误。','本轮停止后续修改；请查看错误与文件现状，调整条件后发起新任务。']};
 if(!l.assembly?.tools.length)return {text:['本次请求没有教学工具声明。','仅作文字回应，没有读取、修改或检查文件。']};
 return plans[l.plan]||plans[3];
}
function reduce(old,a){
 if(a.type==='reset')return initial(old.base.preset);
 if(a.type==='preset'&&old.base.status==='idle')return initial(a.value);
 if(a.type.startsWith('tool-'))return toolAction(old,a);
 if(!a.type.startsWith('loop-')){
  const p=parent.reduce(old,a);if(p===old)return old;
  const next={...p,loop:structuredClone(old.loop),env:structuredClone(old.env)};
  if(p.plugin==='ACTIVE')next.resources=['demo.read / demo.edit / demo.check 声明','demo/inspect 监听'];
  if(a.type==='base'&&a.action.type==='stop'){next.loop.keepInbox=false;cancel(next.loop,next.env);}
  return next;
 }
 const s={...old,loop:structuredClone(old.loop),env:structuredClone(old.env)},l=s.loop;
 if(a.type==='loop-keep'){l.keepInbox=!!a.value;return s;}
 if(a.type==='loop-scenario'){if(!active(l))l.scenario=['normal','retry','fatal','max'].includes(a.value)?a.value:'normal';return s;}
 if(a.type==='loop-cancel'){cancel(l,s.env);return s;}
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
  l.assembly={system:'你是课程中的模拟 Agent。模型响应为固定脚本；工具只操作浏览器内存中的虚拟配置。',tools:s.plugin==='ACTIVE'?schemas():[]};
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
 if(l.phase==='tool'){toolNext(s);return s;}
 if(l.phase==='boundary'){
  const hadTool=!!response(l).name; // error result still needs another model step.
  if(!hadTool&&!l.errorTool&&!l.queueStep.length){end(l,'completed');return s;}
  if(l.errorTool&&l.plan===4&&!l.queueStep.length){end(l,'completed');return s;}
  add(l,'step/end');l.stepOpen=false;l.step++;l.plan=l.errorTool?4:Math.min(l.plan+1,3);l.claimed=l.queueStep.splice(0);l.phase='assemble';l.live='';return s;
 }
 return old;
}

function environment(){return {file:'{\n  "timeout": 0,\n  "note": "initial"\n}',version:1,observed:null,before:null,mode:'workspace-write',policy:'ask',guard:false,postBlock:false,active:null,last:null,log:[]};}
function fail(code){return {isError:true,content:'Error: '+code};}
function record(e,stage,detail){e.log.push({stage,detail});}
function toolAction(old,a){
 const s=structuredClone(old),e=s.env;
 if(a.type==='tool-config'&&s.loop.phase==='idle'){
  if(a.key==='mode'&&['workspace-write','read-only'].includes(a.value))e.mode=a.value;
  if(a.key==='policy'&&['ask','allow','deny'].includes(a.value))e.policy=a.value;
  if(['guard','postBlock'].includes(a.key))e[a.key]=!!a.value;
 }else if(a.type==='tool-external'&&s.base.status==='bound'){
  const file=JSON.parse(e.file);file.note='external change '+(e.version+1);e.file=JSON.stringify(file,null,2);e.version++;record(e,'external','模拟其他编辑者修改 note；旧观察版本未更新。');
 }else if(a.type==='tool-approval'&&e.active?.stage==='approval'){
  if(!['allow','deny'].includes(a.value))return old;
  record(e,'approval',a.value==='allow'?'仅同意这一次；仍须经过 guard 与执行环境。':'拒绝本次调用，不执行修改。');
  if(a.value==='allow')e.active.stage='guard';else{e.active.result=fail('APPROVAL_REJECTED');e.active.stage='post';}
 }else return old;
 return s;
}
function executeVirtual(s,t){
 const e=s.env;
 if(s.plugin!=='ACTIVE')return fail('UNKNOWN_TOOL：教学插件已不可用');
 t.executed=true;
 if(t.call.name==='demo.read'){
  e.observed=e.version;return {isError:false,value:{path:'config.json',text:e.file,version:e.version},content:e.file};
 }
 if(t.call.name==='demo.edit'){
  if(e.mode==='read-only')return fail('FS_SANDBOX_DENIED：只读模式不允许修改');
  if(e.observed===null)return fail('FS_NOT_OBSERVED：先读取配置');
  if(e.observed!==e.version)return fail('FS_CONFLICT（教学标记）：观察版本已过期，先重新读取');
  const before=e.file;
  if(!before.includes('"timeout": 0'))return fail('EDIT_NO_MATCH（教学标记）：固定脚本的旧文本不存在');
  e.before=before;e.file=before.replace('"timeout": 0','"timeout": 30');e.version++;e.observed=e.version;
  return {isError:false,value:{path:'config.json',before,after:e.file},content:'虚拟 config.json 已修改，timeout = 30。'};
 }
 const config=JSON.parse(e.file),passed=Number.isFinite(config.timeout)&&config.timeout>0;
 return {isError:false,value:{exitCode:passed?0:1,stdout:passed?'PASS: timeout > 0':'FAIL: timeout must be positive'},content:(passed?'PASS':'FAIL')+' [exit code: '+(passed?0:1)+']；这是固定检查器，未执行 Shell。'};
}
function toolNext(s){
 const e=s.env,l=s.loop;
 if(!e.active){
  const message=l.history.at(-1),call=message?.content.find(c=>c.type==='tool-call');
  if(!call)throw new Error('Missing committed tool call');
  e.active={call:structuredClone(call),stage:'pre',result:null,executed:false};add(l,'tool/call',{name:call.name,callId:call.id});record(e,'capture','冻结调用 '+call.name+' '+call.arguments);return;
 }
 const t=e.active,edit=t.call.name==='demo.edit';
 if(t.stage==='pre'){
  const policy=edit?e.policy:'allow';record(e,'pre-execute',policy+'：修改策略，其余虚拟工具允许。');
  if(policy==='deny'){t.result=fail('POLICY_DENIED');t.stage='post';}else t.stage=policy==='ask'?'approval':'guard';return;
 }
 if(t.stage==='approval')return;
 if(t.stage==='guard'){
  record(e,'guard',edit&&e.guard?'拒绝修改，审批不能覆盖此 guard。':'单调守卫通过。');
  if(edit&&e.guard){t.result=fail('GUARD_DENIED');t.stage='post';}else t.stage='execute';return;
 }
 if(t.stage==='execute'){t.result=executeVirtual(s,t);record(e,'execute',t.result.content);t.stage='post';return;}
 if(t.stage==='post'){
  if(edit&&e.postBlock&&!t.result.isError){t.result=fail('POST_BLOCKED：结果被拦截；已经提交的文件修改仍然存在');}
  record(e,'post-execute',t.result.content);t.stage='final';return;
 }
 if(t.stage==='final'){
  e.last=structuredClone(t.result);record(e,'tools/result','最终结果只读观察；随后写入模型历史。');
  l.history.push(textMessage('tool',t.result.content,{callId:t.call.id}));add(l,'tool/result',{name:t.call.name,...structuredClone(t.result)});
  if(t.result.isError)l.errorTool=true;
  e.active=null;l.phase='boundary';
 }
}
function toolControl(s){
 const stage=s.env.active?.stage;
 return {disabled:stage==='approval',label:({pre:'运行 pre-execute 策略',approval:'等待模拟审批选择',guard:'检查单调 guard',execute:'执行虚拟工具',post:'处理执行后结果',final:'提交最终工具结果'})[stage]||'捕获本次工具调用',reason:stage==='approval'?'请在模拟审批卡中选择“同意一次”或“拒绝”。此选择仅影响虚拟文件。':''};
}

function loopControl(s){
 const l=s.loop;if(l.phase==='tool')return toolControl(s);if(s.base.status!=='bound')return {disabled:true,label:'先完成宿主组装',reason:'使用上方高亮按钮完成组装与会话绑定。'};
 if(l.phase==='idle')return {disabled:!l.wake||!(l.queueTurn.length||l.queueStep.length),label:'开始下一轮 Turn',reason:!l.wake?'发送 followup 或 steer 唤醒；单独 inject 不会启动循环。':''};
 return {disabled:false,label:{assemble:'组装提示词与工具',prepare:'构建请求并启动 Attempt',stream:l.chunk<response(l).text.length?'接收下一段文本':'结算本次模型响应',boundary:'进入下个边界',backoff:'结束模拟退避等待',retry:'重试同一 Step'}[l.phase],reason:''};
}
const api={initial,reduce,toolControl,controls:parent.controls,nextAction:parent.nextAction,loopControl,schemas};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DSHWorkbench04=api;
})(typeof globalThis!=='undefined'?globalThis:this);
