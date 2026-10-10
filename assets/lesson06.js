(function(){
'use strict';
const $=id=>document.getElementById(id),m=window.DSHWorkbench06;
let state=m.initial(),lab=m.labInitial(),expanded=false,chatKey='';
const names={parent:'父 Agent',a:'Spawn 检查员',b:'Fork 复核员'};
const sources={send:'child',spawn:'spawn',fork:'fork',message:'message',a:'resident',b:'resident',resume:'continuation',collect:'dispose',interrupt:'interrupt',sibling:'message'};
for(const [key,label] of Object.entries(m.labels)){if(key==='send')continue;const o=document.createElement('option');o.value=key;o.textContent=label;$('team-action').append(o);}
$('team-action').value='spawn';
function act(type){state=m.reduce(state,{type,text:$('desk-task').value});render();}
function select(id){state=m.reduce(state,{type:'select',id});render();}
function render(){
 const c=m.controls(state),next=m.recommended(state);
 $('desk-send').disabled=!!c.send;$('desk-task').disabled=!!c.send;$('team-next').disabled=!next;$('team-next').textContent=next?m.labels[next]:'引导完成';$('desk-hint').textContent=state.notice;
 for(const id of ['desk-send','team-next']){const on=next&&(next==='send'?id==='desk-send':id==='team-next');if(on){$(id).setAttribute('data-recommended','true');$(id).setAttribute('aria-label','建议下一步：'+$(id).textContent);}else{$(id).removeAttribute('data-recommended');$(id).removeAttribute('aria-label');}}
 $('team-source').href=window.LESSON_SOURCES.sources[sources[next]||'continuation'].url;
 $('team-session').replaceChildren();for(const id of ['parent',...Object.keys(state.children)]){const o=document.createElement('option');o.value=id;o.textContent=names[id];$('team-session').append(o);}$('team-session').value=state.selected;
 $('team-roster').replaceChildren();for(const id of ['parent',...Object.keys(state.children)]){const child=state.children[id],b=document.createElement('button');b.type='button';b.textContent=names[id]+'\n'+(child?child.status+' · 激活 #'+child.epoch+' · '+child.queue.length+' 条未领取\n继承 '+child.seedCount+' 条教学消息':state.ready?'父任务已完成 · 等待复核':'准备读改查');b.setAttribute('aria-pressed',String(id===state.selected));b.addEventListener('click',()=>select(id));$('team-roster').append(b);}
 $('team-env').textContent='共享虚拟文件：'+(state.base.environment?'timeout = '+JSON.parse(state.base.environment.file).timeout:'尚未执行父任务');
 for(const o of $('team-action').children)o.disabled=!!c[o.value];availability();renderChat();inspect();
}
function availability(){const reason=m.controls(state)[$('team-action').value];$('team-run').disabled=!!reason;$('team-disabled').textContent=reason||'仅改变当前页面内的教学状态。';}
function renderChat(){const rows=state.selected==='parent'?state.chat:state.children[state.selected].chat,key=state.selected+JSON.stringify(rows);$('team-chat-title').textContent=names[state.selected]+' · 完整对话';if(key===chatKey)return;const box=$('desk-chat'),top=box.scrollTop||0,near=!chatKey.startsWith(state.selected+'[')||box.scrollHeight-box.clientHeight-top<48;chatKey=key;box.replaceChildren();if(!rows.length){const el=document.createElement('p');el.className='desk-welcome';el.textContent=state.selected==='parent'?'先运行父任务，随后委派检查员。':'尚未领取初始任务，收件箱回执不等于模型已看到。';box.append(el);}for(const row of rows){const el=document.createElement('article'),label=document.createElement('small'),body=document.createElement('p');el.className='desk-bubble '+row.role;label.textContent=row.role==='user'?'输入 / 通知':row.role==='tool'?'工具结果':'模拟 Agent';body.textContent=row.text;el.append(label,body);box.append(el);}box.scrollTop=near?box.scrollHeight:top;}
function inspect(){const child=state.children[state.selected],view=$('team-view').value||'inbox';let v;if(view==='events')v=state.events;else if(view==='context')v={boundary:'教学消息列表，省略真实系统提示词、request/header 与 Surface 投影。',messages:child?child.chat:state.chat};else v=child?{resident:child.resident,activation:child.epoch,pending:child.queue,claimed:child.current}:{note:'父任务自动完成；结算通知在本模型中立即显示，真实运行经 Inbox 投递。'};$('team-inspection').textContent=JSON.stringify(v,null,2);}
$('desk-send').addEventListener('click',()=>act('send'));$('team-next').addEventListener('click',()=>{const next=m.recommended(state);if(next)act(next);});$('team-run').addEventListener('click',()=>act($('team-action').value));$('team-action').addEventListener('change',availability);$('team-view').addEventListener('change',inspect);$('team-session').addEventListener('change',()=>select($('team-session').value));$('desk-reset').addEventListener('click',()=>{state=m.initial();render();});
for(const view of ['task','file','inspect'])$('view-'+view).addEventListener('click',()=>{$('agent-desk').setAttribute('data-mobile-view',view);for(const other of ['task','file','inspect'])$('view-'+other).setAttribute('aria-pressed',String(other===view));});
function expand(value){expanded=value;$('agent-desk').classList.toggle('is-expanded',value);$('desk-expand').textContent=value?'退出专注 · Esc':'专注模式';$('desk-expand').setAttribute('aria-pressed',String(value));document.body.classList.toggle('desk-focused',value);}
$('desk-expand').addEventListener('click',()=>expand(!expanded));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)expand(false);});
function renderLab(){$('lab-goal').textContent=JSON.stringify(lab.goal,null,2);$('lab-job').textContent=JSON.stringify(lab.job,null,2);$('lab-schedule').textContent=JSON.stringify({...lab.schedule,pending:lab.inbox.length,executed:lab.executed},null,2);$('lab-notice').textContent=lab.notice;}
for(const button of document.querySelectorAll('[data-lab]'))button.addEventListener('click',()=>{lab=m.labReduce(lab,button.dataset.lab);renderLab();});renderLab();render();
$('mobile-nav').addEventListener('change',()=>{if($('mobile-nav').value)location.hash=$('mobile-nav').value;});
const sections=[...document.querySelectorAll('.lesson-section')];let scheduled=false;
function reading(){const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.max(0,Math.min(100,scrollY/max*100)):100;$('reading-progress').value=percent;$('reading-percent').textContent='阅读位置 '+Math.round(percent)+'%';let current=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<160)current=s;document.querySelectorAll('.toc a').forEach(a=>{const active=a.hash==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scheduled=false;}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(reading);}},{passive:true});window.addEventListener('resize',reading);reading();
})();
