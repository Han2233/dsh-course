/* Browser teaching model, not the dsh runtime. Milestones aggregate concurrent work. */
(function(root) {
'use strict';
const steps = [
 ['待组装','选择 Web 会话的能力组合，再从第一步开始。','profiles'],
 ['组合已准备','Web Profile 按顺序加载 Base、Web Bundle 和覆盖层。根 cordis.yml 是路径锚点；此处只保存教学数据，不写本机文件。','runner'],
 ['Context / Loader 已建立','boot 创建根 Context 并安装 Loader。此时插件树还未挂载。','boot'],
 ['宿主服务已准备','prepare 提供 Profile、环境、包解析与命令行服务，供后续插件使用。','boot'],
 ['插件树已挂载并通过审计','Include 挂载组合；等待 Loader 稳定并审计。图中将依赖激活折叠为一个里程碑，未模拟每个插件的并发初始化。','audit'],
 ['Web 宿主就绪','根仍活跃、Loader 存在且未中止时，启动器提交 appReady。此时还没有教学会话绑定。','ready'],
 ['教学会话已绑定','模拟 Web 创建 Agent：composeAgent 选择 Preset，再通过 mount 将 Agent 作用域绑定到当前 Generation。尚未开始 Turn。','agent-compose']
];
const capabilities = {
 standard: ['文件工具与搜索','Shell 工具（依平台选择）','Skills','规划与压缩相关能力'],
 minimal: ['精简 Persona','持久 Shell（依平台选择）']
};
function initial(preset='standard', fault=false) {
 return {preset: preset === 'minimal' ? 'minimal' : 'standard',fault:!!fault,stage:0,status:'idle',events:[],draft:''};
}
function reduce(state, action) {
 if(action.type==='reset') return initial(state.preset,state.fault);
 if(action.type==='configure') return initial(action.preset,action.fault);
 if(action.type==='draft') return {...state,draft:String(action.text).slice(0,2000)};
 if(action.type==='stop') {
  if(!['running','ready','bound'].includes(state.status))return state;
  return {...state,status:'stopped',events:[...state.events,{title:'停止并释放',detail:'教学状态中的根、Loader 与会话绑定已释放。实际关闭有异步清理与超时等处理。',ref:'shutdown'}]};
 }
 if(action.type!=='next'||['failed','stopped','bound'].includes(state.status))return state;
 const stage=state.stage+1;
 if(stage===4&&state.fault) return {...state,stage,status:'failed',events:[...state.events,{title:'根 Include 加载失败',detail:'模拟配置加载异常：启动被拒绝，释放已创建的根作用域；未提交 appReady，也没有 Agent 绑定。',ref:'boot'}]};
 const [title,detail,ref]=steps[stage];
 return {...state,stage,status:stage===6?'bound':stage===5?'ready':'running',events:[...state.events,{title,detail,ref}]};
}
function view(state){
 const alive=!['failed','stopped'].includes(state.status);
 return {root:alive&&state.stage>=2,host:alive&&state.stage>=3,tree:alive&&state.stage>=4,ready:alive&&state.stage>=5,bound:state.status==='bound',capabilities:state.status==='bound'?capabilities[state.preset]:[]};
}
const api={steps,capabilities,initial,reduce,view};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DSHWorkbench01=api;
})(typeof globalThis!=='undefined'?globalThis:this);
