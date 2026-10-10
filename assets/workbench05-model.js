/* Lesson 05: simplified event log and projections, not the dsh persistence format.
   The simulated durable store is serialized text in memory; refreshing clears it. */
(function(root){
'use strict';
const tools=typeof module!=='undefined'&&module.exports?require('./workbench04-model.js'):root.DSHWorkbench04;
const clone=x=>structuredClone(x);
function surface(session){const nodes=[];for(const e of session.events){if(!e.message)continue;if(e.op==='append')nodes.push(e.seq);else{const a=nodes.indexOf(e.op.start),b=nodes.indexOf(e.op.end);if(a<0||b<a||a===0)throw new Error('Invalid teaching replacement span');nodes.splice(a,b-a+1,e.seq);}}return nodes;}
function append(session,type,data={},message,op='append'){
 const event={seq:session.events.length,type,data:clone(data)};if(message){event.message=clone(message);event.op=clone(op);}
 const candidate={...session,events:[...session.events,event]};surface(candidate);session.events.push(event);return event;
}
function msg(role,text,extra={}){return {role,content:[{type:'text',text}],...extra};}
function messages(session){return surface(session).map(seq=>clone(session.events[seq].message));}
function transcript(session){return session.events.filter(e=>e.message&&e.op==='append'&&['user','assistant','tool'].includes(e.message.role));}
function active(s){return s.sessions[s.active];}
function chars(ms){return Array.from(JSON.stringify(ms)).length;}
function initial(){const session={id:'main',parent:null,inherited:0,events:[]};append(session,'system/message',{},msg('system','你是课程中的固定脚本 Agent。只操作虚拟文件，不调用真实模型。'));return {sessions:{main:session},active:'main',disk:{},environment:null,pending:null,guide:0,notice:'发送任务，沿用第四课工具执行，再观察本课的事件日志。',lastRequest:null,forkCount:0};}
function controls(s){const a=active(s),has=a.events.some(e=>e.type==='turn/end'),pending=!!s.pending;return {
 switch:pending?'Finish summary first.':'',
 send:pending?'摘要事务进行中，先提交或取消。':'',
 save:pending?'先结束摘要事务。':!has?'先完成一轮教学任务。':'',
 note:pending?'先结束摘要事务。':!has?'先完成任务。':'',
 restore:pending?'先结束摘要事务。':!s.disk[s.active]?'此分支尚无已保存快照。':'',
 prune:pending?'先结束摘要事务。':!messages(a).some(m=>m.role==='tool'&&chars(m.content)>220)?'当前没有超过教学阈值的工具结果。':'',
 compact:pending?'已有摘要事务。':surface(a).length<5?'可压缩的上下文不足。':'',
 commit:pending?'':'先准备摘要。',cancel:pending?'':'没有待处理摘要。',
 fork:pending?'先结束摘要事务。':!has?'先完成一轮教学任务。':'',
 parent:a.parent===null?'当前已是主分支。':pending?'先结束摘要事务。':''
};}
function runTask(s,text){
 const a=active(s);append(a,'turn/start',{turn:1});append(a,'request/header',{provider:'teaching-mock',model:'scripted-agent',tools:['demo.read','demo.edit','demo.check']});
 let base=tools.initial();for(const type of ['assemble','install','fs','settle'])base=tools.reduce(base,{type});base=tools.reduce(base,{type:'tool-config',key:'policy',value:'allow'});base=tools.reduce(base,{type:'loop-send',target:'followup',text});
 for(let i=0;i<150;i++){base=tools.reduce(base,{type:'loop-next'});if(base.loop.outcome&&base.loop.phase==='idle')break;}
 if(!base.loop.outcome)throw new Error('Teaching tool loop did not finish');
 for(const message of base.loop.history){if(message.role==='system')continue;const type=message.role==='tool'?'tool/result':message.role+'/message';append(a,type,{},message);}
 s.environment=clone(base.env);append(a,'turn/end',{reason:'completed'});
 // A paired, long diagnostic result is added for the pruning experiment.
 append(a,'turn/start',{turn:2});append(a,'assistant/message',{}, {role:'assistant',content:[{type:'text',text:'再收集一份教学诊断，演示长工具输出。'},{type:'tool-call',id:'audit-1',name:'demo.audit',arguments:'{}'}]});
 const report='配置检查：timeout = 30，PASS。\n'+Array.from({length:35},(_,i)=>'诊断 '+(i+1)+': 已核对虚拟配置，当前没有新增错误。').join('\n')+'\n结论：检查通过；后续只需观察会话状态。';
 append(a,'tool/result',{demo:true},msg('tool',report,{callId:'audit-1'}));append(a,'assistant/message',{},msg('assistant','配置已修正为 timeout = 30，检查通过。现在可以保存会话并观察上下文变化。'));append(a,'turn/end',{reason:'completed'});s.lastRequest=messages(a).slice(0,-1);a.lastRequest=clone(s.lastRequest);
}
function closeSummary(s,error){append(active(s),'compaction/end',{error});s.pending=null;s.notice=error?'摘要没有替换原上下文：'+error:'摘要已落入新事件；原始日志和对话记录仍保留。';}
function reduce(old,action){
 if(action.type==='reset')return initial();
 if(!(action.type in controls(old))||controls(old)[action.type])return old;
 const s=clone(old),a=active(s);s.notice='';
 switch(action.type){
 case 'switch':if(!s.sessions[action.id])return old;s.active=action.id;break;
 case 'send':{
  const text=String(action.text||'').trim().slice(0,2000);if(!text)return old;
  if(!s.environment){runTask(s,text);s.guide=Math.max(s.guide,1);s.notice='工具执行已完成。左侧是对话，右侧可对照原始事件与模型上下文。';}
  else{append(a,'turn/start',{});append(a,'user/message',{},msg('user',text));s.lastRequest=messages(a);a.lastRequest=clone(s.lastRequest);append(a,'assistant/message',{},msg('assistant','教学回应：本次请求携带 '+s.lastRequest.length+' 条模型消息；这是固定脚本，不理解自由文本。虚拟文件仍为 timeout = '+JSON.parse(s.environment.file).timeout+'。'));append(a,'turn/end',{reason:'completed'});s.notice='新对话追加在当前分支，已保存快照不会自动更新。';}break;
 }
 case 'save':s.disk[s.active]=JSON.stringify(a);s.guide=Math.max(s.guide,2);s.notice='已复制到教学存储。只是页面内存中的序列化快照，不是本机 JSONL 或 fsync。';break;
 case 'note':append(a,'user/message',{},msg('user','尚未保存的补充：请额外检查部署参数。'));append(a,'assistant/message',{},msg('assistant','已收到补充；这两条新消息还没有进入教学存储。'));s.guide=s.guide===8?9:Math.max(s.guide,3);s.notice='已增加未保存尾部；现在恢复可对照丢失范围。';break;
 case 'restore':{
  const restored=JSON.parse(s.disk[s.active]);surface(restored);s.sessions[s.active]=restored;append(restored,'session/end-seed',{});s.guide=Math.max(s.guide,4);s.notice='已从保存点重新派生会话，未保存消息消失；虚拟文件没有回滚。';break;
 }
 case 'prune':{
  let count=0;for(const seq of surface(a)){
   const e=a.events[seq];if(e.message.role!=='tool')continue;
   const text=e.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'),points=Array.from(text);if(points.length<=220)continue;
   const projected=clone(e.message);projected.content=[{type:'text',text:points.slice(0,80).join('')+'\n[教学修剪：中间内容省略]\n'+points.slice(-55).join('')}];
   append(a,'compaction/prune',{shadowedSeqs:[seq],unit:'code-points'});append(a,'tool/result',{sourceEventSeqs:[seq]},projected,{start:seq,end:seq});count++;
  }s.guide=Math.max(s.guide,5);s.notice='修剪了 '+count+' 条长结果，保留 callId。模型视图变短，聊天中的原始结果保留。';break;
 }
 case 'compact':{
  const nodes=surface(a),selected=nodes.slice(1,-1);if(selected.length<2)return old;
  append(a,'compaction/start',{turn:null});
  const source=selected.map(seq=>a.events[seq].message);
  s.pending={session:s.active,selected,source:clone(source),fail:!!action.fail,summary:'<compacted-summary>\n教学模板摘要：用户要求读取配置、修正错误、运行检查；config.json 的 timeout 已改为 30，检查通过。后续正在学习会话保存与上下文投影。工具结果的中间诊断可从原日志回看。\n</compacted-summary>'};
  s.guide=Math.max(s.guide,6);s.notice='摘要候选已准备，尚未替换上下文。下一步提交，或取消以观察失败边界。';break;
 }
 case 'commit':{
  const p=s.pending,current=surface(a),span=current.slice(current.indexOf(p.selected[0]),current.indexOf(p.selected.at(-1))+1);
  if(p.fail){closeSummary(s,'模拟摘要失败');s.guide=5;break;}
  if(JSON.stringify(span)!==JSON.stringify(p.selected)){closeSummary(s,'选区已经变化');s.guide=5;break;}
  const checkpoint=msg('user',p.summary,{source:'compact-checkpoint'});
  if(chars([checkpoint])>=chars(p.source)){closeSummary(s,'候选摘要没有缩小选区');s.guide=5;break;}
  append(a,'compaction/summary',{summary:p.summary,sourceEventSeqs:p.selected});append(a,'user/message',{sourceEventSeqs:p.selected},checkpoint,{start:p.selected[0],end:p.selected.at(-1)});closeSummary(s,null);s.guide=Math.max(s.guide,7);break;
 }
 case 'cancel':closeSummary(s,'用户取消');s.guide=5;break;
 case 'fork':{
  const id='fork-'+(++s.forkCount),child=clone(a);child.id=id;child.parent=s.active;child.inherited=a.events.length;append(child,'session/end-seed',{inherited:true});s.sessions[id]=child;s.active=id;s.guide=Math.max(s.guide,8);s.notice='从当前完整事件前缀创建分支；后续消息只写入子分支。虚拟文件共享，不创建文件副本。';break;
 }
 case 'parent':s.active=a.parent;s.guide=10;s.notice='已切回父会话。子分支的消息没有写进父日志；分支也没有回滚虚拟文件。';break;
 }
 return s;
}
function recommendation(s){if(s.guide>=10&&!s.pending)return null;const order=['send','save','note','restore','prune','compact','commit','fork','note','parent'];let type=s.pending?'commit':order[Math.min(s.guide,9)];if(controls(s)[type])type=Object.keys(controls(s)).find(k=>!controls(s)[k]&&!['send','switch','commit','cancel'].includes(k));return type;}
const api={initial,reduce,active,surface,messages,transcript,controls,recommendation,chars};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DSHWorkbench05=api;
})(typeof globalThis!=='undefined'?globalThis:this);
