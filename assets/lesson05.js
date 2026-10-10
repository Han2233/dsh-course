(function(){
'use strict';
const $=id=>document.getElementById(id),m=window.DSHWorkbench05;
let state=m.initial(),transcriptKey='',expanded=false;
const labels={send:'发送任务并记录',save:'保存教学快照',note:'添加未保存消息',restore:'从保存点恢复',prune:'修剪长工具结果',compact:'准备摘要',commit:'提交摘要',cancel:'取消摘要',fork:'Fork 当前会话',parent:'切回父会话'};
const sources={send:'append',save:'flush',note:'append',restore:'restore',prune:'prune-session',compact:'compact-transaction',commit:'compact-commit',cancel:'compact-transaction',fork:'fork-seed',parent:'session-fork'};
function act(type){if(type==='send'&&!$('desk-task').value.trim()){$('desk-hint').textContent='先输入任务文本。';return;}state=m.reduce(state,{type,text:$('desk-task').value,fail:$('mem-fail').checked});render();}
function render(){
 const a=m.active(state),availability=m.controls(state),recommended=m.recommendation(state),saved=state.disk[state.active]?JSON.parse(state.disk[state.active]):null;
 $('desk-task').disabled=!!availability.send;$('desk-send').disabled=!!availability.send;$('mem-cancel').disabled=!!availability.cancel;$('mem-fail').disabled=!!state.pending;
 $('mem-branch').replaceChildren();for(const session of Object.values(state.sessions)){const option=document.createElement('option');option.value=session.id;option.textContent=session.id+(session.parent?' ← '+session.parent:' · 主会话');$('mem-branch').append(option);}$('mem-branch').value=state.active;$('mem-branch').disabled=!!availability.switch;
 $('mem-log-count').textContent=a.events.length;$('mem-node-count').textContent=m.surface(a).length;$('mem-saved-count').textContent=saved?saved.events.length:0;
 const visible=m.chars(m.messages(a)),original=m.chars(a.events.filter(e=>e.message&&e.op==='append').map(e=>e.message));$('mem-meter').max=Math.max(visible,original,1);$('mem-meter').value=visible;$('mem-size').textContent=visible+' 字符 / 原始追加消息 '+original+' 字符（JSON code points，非 token）';
 $('mem-env').textContent='虚拟文件：'+(state.environment?'timeout = '+JSON.parse(state.environment.file).timeout:'任务执行后建立')+'；会话恢复不会回滚它。';
 $('mem-lineage').textContent=a.parent?'父会话 '+a.parent+' · 继承 '+a.inherited+' 条前缀事件':'当前为主会话 · '+Object.keys(state.sessions).length+' 个分支';
 $('mem-next').textContent=recommended?labels[recommended]:'引导完成';$('mem-next').disabled=!recommended;
 $('mem-source').href=window.LESSON_SOURCES.sources[sources[recommended]||'surface'].url;
 $('desk-hint').textContent=state.notice;
 for(const id of ['desk-send','mem-next']){const on=recommended&&(recommended==='send'?id==='desk-send':id==='mem-next');if(on){$(id).setAttribute('data-recommended','true');$(id).setAttribute('aria-label','建议下一步：'+$(id).textContent);}else{$(id).removeAttribute('data-recommended');$(id).removeAttribute('aria-label');}}
 for(const option of $('mem-action').children)option.disabled=!!availability[option.value];
 actionAvailability();renderChat();inspect();
}
function actionAvailability(){const type=$('mem-action').value||'save',reason=m.controls(state)[type];$('mem-run').disabled=!!reason;$('mem-disabled').textContent=reason||'所选操作只影响当前教学会话。';}
function renderChat(){
 const entries=m.transcript(m.active(state)),key=state.active+JSON.stringify(entries);if(key===transcriptKey)return;const switched=!transcriptKey.startsWith(state.active+'[');transcriptKey=key;
 const chat=$('desk-chat'),top=chat.scrollTop||0,nearBottom=switched||!chat.children.length||chat.scrollHeight-chat.clientHeight-top<48;chat.replaceChildren();const calls=new Map();
 for(const e of entries){const message=e.message,box=document.createElement('article'),label=document.createElement('small');box.className='desk-bubble '+message.role;label.textContent=(message.role==='user'?'你':message.role==='tool'?'工具结果 · '+(calls.get(message.callId)||'虚拟工具'):'模拟 Agent')+' · #'+e.seq;box.append(label);
  for(const item of message.content){if(item.type==='tool-call'){calls.set(item.id,item.name);const code=document.createElement('pre');code.className='desk-call';code.textContent='调用 '+item.name+'\n'+item.arguments;box.append(code);}else if(item.type==='text'){const body=document.createElement('p');body.textContent=item.text;box.append(body);}}
  chat.append(box);
 }
 if(!entries.length){const welcome=document.createElement('p');welcome.className='desk-welcome';welcome.textContent='前四课框架已就绪。发送任务后，将自动运行虚拟工具，接着观察如何保存与压缩这段经历。';chat.append(welcome);}
 if(nearBottom||!entries.length)chat.scrollTop=chat.scrollHeight;else chat.scrollTop=top;
}
function inspect(){
 const a=m.active(state),view=$('mem-view').value||'surface';let text,note;
 if(view==='surface'){text=JSON.stringify(m.surface(a).map(seq=>({seq,message:a.events[seq].message})),null,2);note='按 Surface 顺序派生，不按 seq 数值重排。';}
 else if(view==='events'){text=a.events.map(e=>JSON.stringify(e)).join('\n');note='教学事件结构，不是可导入真实 dsh 的 JSONL。原始事件未被修剪或摘要删除。';}
 else if(view==='saved'){text=state.disk[state.active]?JSON.stringify(JSON.parse(state.disk[state.active]),null,2):'当前分支还没有保存点。';note='教学存储仅在页面内存；刷新即丢失。';}
 else if(view==='request'){text=JSON.stringify(a.lastRequest||'尚无教学请求',null,2);note='上次教学输入的简化消息快照；后续压缩不会反向改写过去的请求。';}
 else{text=state.pending?.summary||'尚无待提交摘要。';note='固定教学模板；准备候选不会立刻替换模型上下文。';}
 $('mem-inspection').textContent=text;$('mem-view-note').textContent=note;
}
$('desk-send').addEventListener('click',()=>act('send'));
$('mem-next').addEventListener('click',()=>{const type=m.recommendation(state);if(type)act(type);});
$('mem-run').addEventListener('click',()=>act($('mem-action').value||'save'));
$('mem-action').addEventListener('change',actionAvailability);$('mem-view').addEventListener('change',inspect);
$('mem-cancel').addEventListener('click',()=>act('cancel'));
$('desk-reset').addEventListener('click',()=>{state=m.initial();$('mem-fail').checked=false;render();});
$('mem-branch').addEventListener('change',()=>{state=m.reduce(state,{type:'switch',id:$('mem-branch').value});render();});
for(const view of ['task','file','inspect'])$('view-'+view).addEventListener('click',()=>{$('agent-desk').setAttribute('data-mobile-view',view);for(const other of ['task','file','inspect'])$('view-'+other).setAttribute('aria-pressed',String(other===view));});
function expand(value){expanded=value;$('agent-desk').classList.toggle('is-expanded',value);$('desk-expand').textContent=value?'退出专注 · Esc':'专注模式';$('desk-expand').setAttribute('aria-pressed',String(value));document.body.classList.toggle('desk-focused',value);}
$('desk-expand').addEventListener('click',()=>expand(!expanded));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)expand(false);});
render();
$('mobile-nav').addEventListener('change',()=>{if($('mobile-nav').value)location.hash=$('mobile-nav').value;});
const sections=[...document.querySelectorAll('.lesson-section')];let scheduled=false;
function reading(){const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.max(0,Math.min(100,scrollY/max*100)):100;$('reading-progress').value=percent;$('reading-percent').textContent='阅读位置 '+Math.round(percent)+'%';let current=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<160)current=s;document.querySelectorAll('.toc a').forEach(a=>{const active=a.hash==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scheduled=false;}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(reading);}},{passive:true});window.addEventListener('resize',reading);reading();
})();
