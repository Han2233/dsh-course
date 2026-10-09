(function(){
'use strict';
function recommend(ids, target){
 for(const id of ids){
  const button=document.getElementById(id);
  if(id===target&&!button.disabled){button.setAttribute('data-recommended','true');button.setAttribute('aria-label','建议下一步：'+button.textContent);}
  else{button.removeAttribute('data-recommended');button.removeAttribute('aria-label');}
 }
}

const get=id=>document.getElementById(id), model=window.DSHWorkbench01;
let state=model.initial();
function source(anchor,ref){anchor.href=window.LESSON_SOURCES.sources[ref].url;}
function inspect(index){
 const item=state.events[index]||{title:model.steps[0][0],detail:model.steps[0][1],ref:'profiles'};
 get('wb-detail-title').textContent=item.title;
 get('wb-detail').textContent=item.detail;
 source(get('wb-source'),item.ref);
 document.querySelectorAll('[data-wb-event]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.wbEvent)===index)));
}
function dispatch(action){state=model.reduce(state,action);render();}
function render(){
 const v=model.view(state), dead=['failed','stopped'].includes(state.status);
 get('wb-status').textContent={idle:'待组装',running:'启动中',ready:'宿主就绪',bound:'会话已绑定',failed:'启动失败 · 已清理',stopped:'已停止 · 已释放'}[state.status];
 get('wb-progress').value=dead?0:state.stage;
 get('wb-next').disabled=dead||v.bound;
 get('wb-next').textContent=['准备组合 →','建立 Context / Loader →','准备宿主服务 →','挂载并审计 →','提交宿主就绪 →','创建并绑定会话 →','第一课搭建完成'][state.stage];
 if(dead)get('wb-next').textContent='重置后可再次启动';
 get('wb-stop').disabled=!['running','ready','bound'].includes(state.status);
 get('wb-preset').disabled=state.status!=='idle';get('wb-fault').disabled=state.status!=='idle';
 get('wb-components').replaceChildren();
 [['Context / Loader',v.root],['宿主服务',v.host],['插件树 / Preset 注册表',v.tree],['appReady',v.ready],['Agent · '+state.preset,v.bound]].forEach(([name,on])=>{
  const li=document.createElement('li'),label=document.createElement('span'),status=document.createElement('b');
  label.textContent=name;status.textContent=on?'已建立':dead?'已释放 / 未建立':'待建立';li.classList.toggle('on',on);li.append(label,status);get('wb-components').append(li);
 });
 get('wb-capabilities').replaceChildren();
 const caps=v.capabilities.length?v.capabilities:['绑定会话后，显示所选 Preset 的代表能力'];
 caps.forEach(cap=>{const li=document.createElement('li');li.textContent=cap;get('wb-capabilities').append(li);});
 get('wb-capability-note').textContent=v.bound?'声明摘选；显示能力不表示已经执行工具，也不等于执行权限已获批准。':'本课只建立与查看能力，不执行文件或 Shell 操作。';
 source(get('wb-preset-source'),state.preset);
 get('wb-session').textContent=v.bound?'学习会话 001 · '+state.preset:'学习会话 · 尚未绑定';
 get('wb-empty').hidden=state.events.length>0;
 get('wb-events').replaceChildren();
 state.events.forEach((entry,index)=>{
  const li=document.createElement('li'),button=document.createElement('button'),badge=document.createElement('small'),title=document.createElement('span');
  button.type='button';button.dataset.wbEvent=index;badge.textContent='系统 · '+String(index+1).padStart(2,'0');title.textContent=entry.title;button.append(badge,title);
  button.addEventListener('click',()=>inspect(index));li.append(button);get('wb-events').append(li);
 });
 get('wb-draft-preview').hidden=!state.draft;
 get('wb-draft-text').textContent=state.draft;
 get('wb-save-draft').disabled=!v.bound;
 get('wb-task').disabled=!v.bound;
 get('wb-task-help').textContent=v.bound?'可把任务放入草稿。第三课再接入模拟模型循环；本课不会发送模型请求。':'完成启动与会话绑定后，可保存任务草稿。';
 get('wb-summary').textContent=v.bound?'本课成果：应用已组装、宿主已就绪、会话已绑定 '+state.preset+'。下一课将把插件依赖和卸载过程展开。':dead?'当前没有活跃会话。可重置后取消故障开关，再观察正常启动。':'跟随按钮完成六个组装里程碑；点击系统记录可以回看内部变化。';
 recommend(['wb-next','wb-reset','wb-save-draft'],dead?'wb-reset':!v.bound?'wb-next':!state.draft?'wb-save-draft':null);
 inspect(state.events.length-1);
}
get('wb-next').addEventListener('click',()=>dispatch({type:'next'}));
get('wb-stop').addEventListener('click',()=>dispatch({type:'stop'}));
get('wb-reset').addEventListener('click',()=>{dispatch({type:'reset'});get('wb-task').value='读取配置，修正错误，再运行检查。';get('wb-draft-status').textContent='';});
function configure(){dispatch({type:'configure',preset:get('wb-preset').value,fault:get('wb-fault').checked});}
get('wb-preset').addEventListener('change',configure);get('wb-fault').addEventListener('change',configure);
get('wb-form').addEventListener('submit',event=>{
 event.preventDefault();if(state.status!=='bound')return;
 const text=get('wb-task').value.trim();if(!text){get('wb-draft-status').textContent='先输入任务内容。';return;}
 dispatch({type:'draft',text});get('wb-draft-status').textContent='草稿已更新，仅保存在当前页面内存中；尚未开始 Turn。';
});
render();
})();
