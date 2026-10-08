(function(){
'use strict';
const $=id=>document.getElementById(id),m=window.DSHWorkbench02,b=window.DSHWorkbench01;
let state=m.initial();
function inspect(message,ref){$('lab-detail').textContent=message;$('lab-source').href=window.LESSON_SOURCES.sources[ref].url;}
function act(action){state=m.reduce(state,action);render();}
function render(){
 const ready=state.base.status==='bound', ended=['stopped','failed'].includes(state.base.status);
 $('lab-status').textContent=ready?'宿主已就绪 · 插件 '+state.plugin:ended?'宿主已停止':b.steps[state.base.stage][0];
 $('lab-preset').disabled=state.base.status!=='idle';
 $('lab-boot').disabled=ready||ended;$('lab-boot').textContent=ready?'六步组装已完成':ended?'重置后重新组装':'组装 '+(state.base.stage+1)+'/6 · '+b.steps[Math.min(6,state.base.stage+1)][0];
 $('lab-stop').disabled=!['running','ready','bound'].includes(state.base.status);
 $('lab-install').disabled=!ready||state.installed;
 $('lab-fs').disabled=!ready;$('lab-fs').textContent=state.fs?'撤掉 fs 服务':'接通 fs 服务';
 $('lab-settle').disabled=!ready||!['LOADING','UNLOADING'].includes(state.plugin);
 $('lab-restart').disabled=!ready||!state.installed||!['ACTIVE','FAILED','PENDING'].includes(state.plugin);
 $('lab-dispose').disabled=!ready||!state.installed;
 $('lab-fail').disabled=!ready;$('lab-fail').checked=state.fail;
 $('lab-probe').disabled=!ready;$('lab-save').disabled=!ready;$('lab-task').disabled=!ready;
 const availability=m.controls(state);
 for(const [type,reason] of Object.entries(availability)){
  const button=$('lab-'+type);button.disabled=!!reason;button.title=reason;
  $('lab-'+type+'-reason').textContent=reason;
 }
 const next=m.nextAction(state);$('lab-continue').textContent=next.label;
 $('lab-next-help').textContent=ready?'绿色按钮给出当前可执行的下一步；左侧按钮用于自由实验。':'可一键完成第一课的六步组装，也可用左侧按钮逐步观察。';
 $('lab-settle').textContent=state.plugin==='UNLOADING'?'完成卸载清理':state.plugin==='LOADING'?'完成插件初始化':'完成当前转换';

 $('lab-uid').textContent=state.uid?'教学 Fiber #'+state.uid:'未创建';$('lab-fiber').textContent=state.plugin;
 $('lab-fiber').dataset.state=state.plugin;
 $('lab-services').textContent=ready?'tools ✓ · systemPrompt ✓ · fs '+(state.fs?'✓':'缺席'):'等待宿主与会话绑定';
 $('lab-resources').textContent=state.resources.length?state.resources.join(' / '):'0 项';
 $('lab-caps').replaceChildren();(ready?b.capabilities[state.base.preset]:['尚未绑定 Preset']).forEach(t=>{const li=document.createElement('li');li.textContent=t;$('lab-caps').append(li);});
 const guides={ABSENT:'先安装教学插件，让它等待 fs。',PENDING:'缺少 fs 时，实例存在但不会注册能力。接通 fs 再完成转换。',LOADING:'依赖已就绪，初始化进行中。完成当前转换，观察登记的贡献。',ACTIVE:'能力已登记。发送观察事件，或撤掉 fs 再完成清理。',UNLOADING:'清理还没完成，旧贡献可能尚在。完成当前转换，查看归零后的状态。',FAILED:'初始化失败，已登记贡献已回滚。关闭故障后重启，再完成卸载与加载。',DISPOSED:'这个实例已经结束。恢复 fs 不会复活它；重新安装会创建新编号。'};
 $('lab-guide').textContent=ready?guides[state.plugin]:ended?'宿主停止会清理教学状态；重置后可以再试。':'先完成六步组装：沿用第一课的宿主与会话模型。';
 $('lab-log').replaceChildren();
 const entries=[...state.base.events.map(e=>({message:e.title+'：'+e.detail,ref:e.ref})),...state.log];
 entries.forEach((entry,i)=>{
  const li=document.createElement('li'),button=document.createElement('button'),badge=document.createElement('small'),text=document.createElement('span');
  button.type='button';badge.textContent='教学记录 '+String(i+1).padStart(2,'0');text.textContent=entry.message;button.append(badge,text);
  button.setAttribute('aria-pressed',String(i===entries.length-1));
  button.addEventListener('click',()=>{inspect(entry.message,entry.ref);$('lab-log').querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));});li.append(button);$('lab-log').append(li);
 });
 const last=entries[entries.length-1];inspect(last?last.message:'从宿主组装开始，再观察消费者的依赖生命周期。',last?last.ref:'registry');
}
$('lab-continue').addEventListener('click',()=>{const action=m.nextAction(state);act(action);if(action.type==='reset')$('lab-draft').textContent='';});
$('lab-boot').addEventListener('click',()=>act({type:'base',action:{type:'next'}}));
$('lab-stop').addEventListener('click',()=>{act({type:'base',action:{type:'stop'}});$('lab-draft').textContent='宿主已停止；重置会清除任务草稿。';});
$('lab-preset').addEventListener('change',()=>act({type:'preset',value:$('lab-preset').value}));
for(const [id,type] of [['lab-install','install'],['lab-fs','fs'],['lab-settle','settle'],['lab-restart','restart'],['lab-dispose','dispose'],['lab-probe','probe']])$(id).addEventListener('click',()=>act({type}));
$('lab-fail').addEventListener('change',()=>act({type:'fail',value:$('lab-fail').checked}));
$('lab-reset').addEventListener('click',()=>{act({type:'reset'});$('lab-task').value='读取配置，修正错误，再运行检查。';$('lab-draft').textContent='';});
$('lab-form').addEventListener('submit',event=>{event.preventDefault();if(state.base.status!=='bound')return;const text=$('lab-task').value.trim();if(!text){$('lab-draft').textContent='请填写任务草稿。';return;}act({type:'base',action:{type:'draft',text}});$('lab-draft').textContent='已保存，尚未开始 Turn：'+state.base.draft;});
function runEvent(){
 const trace=[];let result;
 function core(){trace.push('核心：返回 OK');return 'OK';}
 function B(next){trace.push('B：进入');if($('event-block').checked){trace.push('B：短路，直接返回 BLOCKED');return 'BLOCKED';}const out=next();trace.push('B：接收 '+out);return out;}
 function A(next){trace.push('A：进入');const out=next();trace.push('A：接收 '+out);return out;}
 result=A(()=>B(core));$('event-trace').replaceChildren();trace.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('event-trace').append(li);});$('event-result').textContent='最终返回：'+result+'。这段代码执行的是教学同步函数，不是 dsh 事件。';
}
$('event-run').addEventListener('click',runEvent);$('event-block').addEventListener('change',runEvent);runEvent();render();
$('mobile-nav').addEventListener('change',()=>{if($('mobile-nav').value)location.hash=$('mobile-nav').value;});
const sections=[...document.querySelectorAll('.lesson-section')];let scheduled=false;
function reading(){const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.max(0,Math.min(100,scrollY/max*100)):100;$('reading-progress').value=percent;$('reading-percent').textContent='阅读位置 '+Math.round(percent)+'%';let current=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<160)current=s;document.querySelectorAll('.toc a').forEach(a=>{const active=a.hash==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scheduled=false;}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(reading);}},{passive:true});window.addEventListener('resize',reading);reading();
})();
