/* Teaching state machine: manually settles lifecycle transitions; no dsh execution. */
(function(root){
'use strict';
const base=typeof module!=='undefined'&&module.exports?require('./workbench01-model.js'):root.DSHWorkbench01;
function initial(preset='standard'){return {base:base.initial(preset),fs:false,plugin:'ABSENT',installed:false,uid:0,resources:[],fail:false,target:null,log:[]};}
function controls(s){
 const ready=s.base.status==='bound';
 const busy=['LOADING','UNLOADING'].includes(s.plugin);
 const needHost='先完成宿主组装与会话绑定。';
 return {
  install:!ready?needHost:s.plugin==='UNLOADING'?'先完成卸载清理，再安装新实例。':s.installed?'当前实例已安装；可重启或卸载。':'',
  fs:ready?'':needHost,
  settle:!ready?needHost:!busy?'当前没有进行中的初始化或清理。':'',
  restart:!ready?needHost:!s.installed?'先安装插件。':busy?'先完成当前转换。':'',
  dispose:!ready?needHost:!s.installed?'当前没有可卸载的实例。':'',
  probe:ready?'':needHost,
 };
}
function nextAction(s){
 if(['stopped','failed'].includes(s.base.status))return {label:'重新开始组装',type:'reset'};
 if(s.base.status!=='bound')return {label:'一键完成宿主组装',type:'assemble'};
 if(s.plugin==='UNLOADING')return {label:'完成卸载清理',type:'settle'};
 if(s.plugin==='LOADING')return {label:'完成插件初始化',type:'settle'};
 if(!s.installed)return {label:'安装教学插件',type:'install'};
 if(s.plugin==='PENDING')return {label:'接通缺失的 fs 服务',type:'fs'};
 if(s.plugin==='FAILED')return s.fail?{label:'关闭初始化故障',type:'fail',value:false}:{label:'重启失败的实例',type:'restart'};
 return {label:'发送教学观察事件',type:'probe'};
}
function reduce(old,a){
 if(a.type==='reset')return initial(old.base.preset);
 if(a.type==='assemble'){
  if(['stopped','failed'].includes(old.base.status))return old;
  let next=old;
  while(next.base.stage<6)next=reduce(next,{type:'base',action:{type:'next'}});
  return next;
 }
 if(Object.hasOwn(controls(old),a.type)&&controls(old)[a.type])return old;
 const s={...old,resources:[...old.resources],log:[...old.log]};
 const record=(message,ref='fiber-refresh')=>s.log.push({message,ref});
 const ready=s.base.status==='bound';
 if(a.type==='base'){
  s.base=base.reduce(s.base,a.action);
  if(a.action.type==='stop'){s.fs=false;s.installed=false;s.resources=[];s.plugin=s.uid?'DISPOSED':'ABSENT';record('宿主停止：教学插件、服务与贡献均已清理。','fiber-unload');}
  return s;
 }
 if(a.type==='preset'&&s.base.status==='idle')return initial(a.value);
 if(!ready)return old;
 if(a.type==='fail'){s.fail=!!a.value;return s;}
 if(a.type==='install'&&!s.installed){
  s.installed=true;s.uid++;s.plugin=s.fs?'LOADING':'PENDING';s.target=null;
  record('安装教学插件 #'+s.uid+'：'+s.plugin+'。需要 tools、fs、systemPrompt；宿主已提供前后两项。','registry');
 }else if(a.type==='fs'){
  s.fs=!s.fs;record('fs 提供方 '+(s.fs?'上线':'下线')+'；重新检查注入依赖。','provide');
  if(s.installed){
   if(!s.fs&&['ACTIVE','LOADING'].includes(s.plugin)){s.plugin='UNLOADING';s.target='PENDING';}
   else if(s.fs&&s.plugin==='PENDING')s.plugin='LOADING';
  }
 }else if(a.type==='dispose'&&s.installed){
  s.installed=false;s.target='DISPOSED';s.plugin='UNLOADING';record('明确 dispose：等待本实例清理，随后不能自动恢复。','fiber-unload');
 }else if(a.type==='restart'&&s.installed&&['ACTIVE','FAILED','PENDING'].includes(s.plugin)){
  s.target='RESTART';s.plugin='UNLOADING';record('请求 restart：先卸载本轮副作用，再依据依赖重新激活。','restart');
 }else if(a.type==='settle'){
  if(s.plugin==='LOADING'){
   if(s.fail){s.resources=['已登记的临时监听'];s.plugin='UNLOADING';s.target='FAILED';record('教学 apply 在登记一个监听后抛错；进入清理，不会宣告 ACTIVE。','fiber-reload');}
   else{s.resources=['demo.read 工具声明','demo/inspect 监听'];s.plugin='ACTIVE';record('初始化完成：ACTIVE；教学工具和监听各登记一次。','effect');}
  }else if(s.plugin==='UNLOADING'){
   const count=s.resources.length;s.resources=[];
   if(s.target==='DISPOSED')s.plugin='DISPOSED';
   else if(s.target==='FAILED')s.plugin='FAILED';
   else s.plugin=s.fs?'LOADING':'PENDING';
   s.target=null;record('清理 '+count+' 项贡献；进入 '+s.plugin+'。','fiber-unload');
  }
 }else if(a.type==='probe'){
  record(s.plugin==='ACTIVE'?'demo/inspect：教学监听收到一次通知。':'demo/inspect：没有活跃的教学监听，接收数为 0。','events');
 }else return old;
 return s;
}
const api={initial,reduce,controls,nextAction};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DSHWorkbench02=api;
})(typeof globalThis!=='undefined'?globalThis:this);
