(function(){
'use strict';
const $=id=>document.getElementById(id),m=window.DSHWorkbench04;
let state,playback=null,scenario='normal',selectedRequest=-1,lastRequestCount=0,expanded=false;
const reducedMotion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)').matches:false;
function ready(){let s=m.initial();for(const type of ['assemble','install','fs','settle'])s=m.reduce(s,{type});const configurations={normal:{},readonly:{mode:'read-only'},guard:{guard:true},post:{postBlock:true},deny:{policy:'deny'}};for(const [key,value] of Object.entries(configurations[scenario]))s=m.reduce(s,{type:'tool-config',key,value});return s;}
function pause(){if(playback!==null)clearInterval(playback);playback=null;$('desk-play').textContent='自动推进';$('desk-play').setAttribute('aria-pressed','false');}
function reset(){pause();state=ready();selectedRequest=-1;lastRequestCount=0;render();}
function act(action){state=m.reduce(state,action);render();}
// The earlier lesson's loop runs intact, but only tool boundaries need manual clicks here.
function advance(){
 if(state.env.active?.stage==='approval')return;
 if(state.loop.phase==='idle'){
  const text=$('desk-task').value.trim();if(!text){pause();$('desk-hint').textContent='先填写任务文本。';return;}
  state=m.reduce(state,{type:'loop-send',target:'followup',text});
 }else if(state.loop.phase==='tool')state=m.reduce(state,{type:'loop-next'});
 for(let i=0;i<40&&state.loop.phase!=='tool'&&!m.loopControl(state).disabled;i++)state=m.reduce(state,{type:'loop-next'});
 if(state.loop.phase==='tool'&&!state.env.active)state=m.reduce(state,{type:'loop-next'});
 render();
}
const labels={pre:['准入策略','根据本次调用决定 allow、deny 或 ask。','tool-prepare'],approval:['等待你的审批','同意一次或拒绝；两种分支都可以观察。','tool-ask'],guard:['单调守卫','审批同意后，强制 guard 仍然可以否决。','tool-guard'],execute:['执行工具','文件服务检查写入范围与版本，随后读取或修改内存。','tool-body'],post:['处理候选结果','后置策略可拦截结果；已经发生的修改不会因此回滚。','tool-post'],final:['提交最终结果','最终结果进入历史，循环自动衔接下一次模型请求。','tool-finish']};
function render(){
 const e=state.env,l=state.loop,t=e.active,awaiting=t?.stage==='approval',done=l.phase==='idle'&&!!l.outcome,busy=l.phase!=='idle';
 if(awaiting||done)pause();
 const info=t?labels[t.stage]:done?['本轮结束',l.outcome==='aborted'?'取消不会撤销已发生的修改。':'对照实际文件与最终结果；可重新开始另一个情境。','tool-finish']:['工具已就绪','前置框架已完成，从读取配置开始本课实验。','tool-runtime'];
 $('desk-progress').textContent=t?t.call.name+' · Step '+l.step:done?'工具实验 · '+l.outcome:'第 04 课 · 工具执行';
 $('desk-stage').textContent=info[0];$('desk-explain').textContent=info[1];$('desk-source').href=window.LESSON_SOURCES.sources[info[2]].url;
 $('desk-approval').hidden=!awaiting;$('desk-allow').disabled=!awaiting;$('desk-deny').disabled=!awaiting;
 $('desk-task').disabled=busy;
 $('desk-message').textContent=l.live||l.history.filter(x=>x.role==='assistant').at(-1)?.content.filter(c=>c.type==='text').map(c=>c.text).join('')||'模拟 Agent 将依次请求读取、修改、检查。';
 $('desk-version').textContent='v'+e.version;$('desk-file').textContent=e.file;$('desk-observed').textContent='观察依据：'+(e.observed===null?'尚未读取':'v'+e.observed)+' · 环境：'+e.mode;
 $('desk-external').disabled=!busy;
 $('desk-effect').textContent=e.before?'已发生修改：timeout 0 → 30。即使取消或拦截结果，这项变化仍保留。':'尚未发生 Agent 修改。';
 if(l.requests.length!==lastRequestCount){selectedRequest=l.requests.length-1;lastRequestCount=l.requests.length;}
 $('desk-request-choice').replaceChildren();
 l.requests.forEach((r,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent='请求 '+(i+1)+' · '+r.messages.length+' 条消息';$('desk-request-choice').append(option);});
 $('desk-request-choice').value=selectedRequest<0?'':String(selectedRequest);inspect();
 $('desk-next').textContent=done?'再次运行任务':t?m.toolControl(state).label:'开始读取配置';$('desk-next').disabled=awaiting;
 $('desk-cancel').disabled=!busy;$('desk-play').disabled=awaiting||done||reducedMotion;
 if(reducedMotion)$('desk-play').title='已开启减少动态效果，请单步推进。';
 $('desk-hint').textContent=awaiting?'请在任务区域作出本次审批选择。':done?'本轮已结束，可点击“重新开始”或切换实验情境。':playback!==null?'自动推进中；遇到审批会暂停。':'跟随高亮按钮，只观察本课工具执行阶段。';
 for(const id of ['desk-next','desk-reset']){const on=playback===null&&(done?id==='desk-reset':!awaiting&&id==='desk-next');if(on){$(id).setAttribute('data-recommended','true');$(id).setAttribute('aria-label','建议下一步：'+$(id).textContent);}else{$(id).removeAttribute('data-recommended');$(id).removeAttribute('aria-label');}}
}
function inspect(){
 const e=state.env,value=$('desk-inspect').value||'result';$('desk-request-choice').hidden=value!=='request';
 const views={result:()=>JSON.stringify({call:e.active?.call||null,result:e.active?.result||e.last||'尚无结果'},null,2),diff:()=>e.before===null?'尚无成功修改。':'修改前：\n'+e.before+'\n\n当前：\n'+e.file,trace:()=>e.log.map(x=>x.stage+' — '+x.detail).join('\n\n')||'尚无工具事件。',request:()=>JSON.stringify(state.loop.requests[selectedRequest]||'尚未构建请求',null,2),history:()=>JSON.stringify(state.loop.history,null,2)};
 $('desk-inspection').textContent=(views[value]||views.result)();
}
$('desk-next').addEventListener('click',advance);
$('desk-play').addEventListener('click',()=>{if(playback!==null){pause();render();return;}if(reducedMotion)return;playback=setInterval(advance,1000);$('desk-play').textContent='暂停自动推进';$('desk-play').setAttribute('aria-pressed','true');render();});
$('desk-cancel').addEventListener('click',()=>{pause();act({type:'loop-cancel'});});
$('desk-reset').addEventListener('click',reset);
$('desk-scenario').addEventListener('change',()=>{scenario=$('desk-scenario').value;reset();});
$('desk-allow').addEventListener('click',()=>act({type:'tool-approval',value:'allow'}));
$('desk-deny').addEventListener('click',()=>act({type:'tool-approval',value:'deny'}));
$('desk-external').addEventListener('click',()=>act({type:'tool-external'}));
$('desk-inspect').addEventListener('change',inspect);
$('desk-request-choice').addEventListener('change',()=>{selectedRequest=Number($('desk-request-choice').value);inspect();});
for(const view of ['task','file','inspect'])$('view-'+view).addEventListener('click',()=>{$('agent-desk').setAttribute('data-mobile-view',view);for(const other of ['task','file','inspect'])$('view-'+other).setAttribute('aria-pressed',String(other===view));});
function expand(value){expanded=value;$('agent-desk').classList.toggle('is-expanded',value);$('desk-expand').textContent=value?'退出专注 · Esc':'专注模式';$('desk-expand').setAttribute('aria-pressed',String(value));document.body.classList.toggle('desk-focused',value);}
$('desk-expand').addEventListener('click',()=>expand(!expanded));window.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded)expand(false);});
const presentations={native:{explain:'模型分步选择 read、edit、check；工具结果进入后续请求。',code:'模型请求 1 → demo.read({path: "config.json"})\n模型请求 2 → demo.edit({path: "config.json", timeout: 30})\n模型请求 3 → demo.check({command: "check-config"})\n模型请求 4 → 根据结果总结'},ptc:{explain:'模型提交程序，子调用仍经过工具流水线；外层回传精选结果。此处只对照，不执行。',code:'// 教学伪代码\nconst file = await tools["demo.read"]({path: "config.json"});\nif (JSON.parse(file.text).timeout === 0) {\n  await tools["demo.edit"]({path: "config.json", timeout: 30});\n}\nreturn await tools["demo.check"]({command: "check-config"});'}};
function mode(value){for(const key of ['native','ptc'])$('mode-'+key).setAttribute('aria-pressed',String(key===value));$('mode-explain').textContent=presentations[value].explain;$('mode-code').textContent=presentations[value].code;}
$('mode-native').addEventListener('click',()=>mode('native'));$('mode-ptc').addEventListener('click',()=>mode('ptc'));mode('native');
window.addEventListener('pagehide',pause);reset();
$('mobile-nav').addEventListener('change',()=>{if($('mobile-nav').value)location.hash=$('mobile-nav').value;});
const sections=[...document.querySelectorAll('.lesson-section')];let scheduled=false;
function reading(){const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.max(0,Math.min(100,scrollY/max*100)):100;$('reading-progress').value=percent;$('reading-percent').textContent='阅读位置 '+Math.round(percent)+'%';let current=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<160)current=s;document.querySelectorAll('.toc a').forEach(a=>{const active=a.hash==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scheduled=false;}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(reading);}},{passive:true});window.addEventListener('resize',reading);reading();
})();
