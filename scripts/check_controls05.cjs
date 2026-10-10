/* UI wiring regression using a small DOM test double; not browser visual QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
class Element{
 constructor(){this.children=[];this.handlers={};this.dataset={};this.attributes={};this.disabled=false;this.checked=false;this.value='';this.textContent='';this.classList={toggle(){}};}
 addEventListener(name,fn){this.handlers[name]=fn;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 replaceChildren(...els){this.children=els;}
 append(...els){this.children.push(...els);}
 querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}
 click(){if(!this.disabled)this.handlers.click?.({preventDefault(){}});}
 getBoundingClientRect(){return {top:0};}
}
const html=fs.readFileSync(path.join(root,'lessons/05/index.html'),'utf8');
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const section=new Element();section.id='workbench';
const sandbox={document:{body:new Element(),getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.structuredClone=structuredClone;sandbox.setInterval=()=>1;sandbox.clearInterval=()=>{};sandbox.matchMedia=()=>({matches:false});sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/05/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/workbench04-model.js','assets/workbench05-model.js','assets/lesson05.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
function textOf(el){return el.textContent+' '+el.children.map(textOf).join(' ');}
function recommended(id){const list=Object.entries(nodes).filter(([,e])=>e.attributes['data-recommended']==='true').map(([k])=>k);assert.deepEqual(list,id?[id]:[]);if(id)assert.equal(nodes[id].disabled,false);}
recommended('desk-send');assert.equal(nodes['mem-run'].disabled,true);
nodes['desk-task'].value='读取配置，修正错误，再运行检查。';nodes['desk-send'].click();recommended('mem-next');assert.match(textOf(nodes['desk-chat']),/调用 demo.edit/);assert.match(textOf(nodes['desk-chat']),/PASS/);
const transcript=textOf(nodes['desk-chat']),count=nodes['desk-chat'].children.length;
for(const label of ['保存教学快照','添加未保存消息','从保存点恢复','修剪长工具结果','准备摘要']){assert.equal(nodes['mem-next'].textContent,label);nodes['mem-next'].click();}
assert.equal(nodes['desk-chat'].children.length,count);assert.equal(textOf(nodes['desk-chat']),transcript);assert.equal(nodes['desk-send'].disabled,true);assert.equal(nodes['mem-cancel'].disabled,false);
nodes['mem-view'].value='summary';nodes['mem-view'].handlers.change();assert.match(nodes['mem-inspection'].textContent,/compacted-summary/);
nodes['mem-next'].click();assert.equal(nodes['desk-send'].disabled,false);assert.equal(textOf(nodes['desk-chat']),transcript);
nodes['mem-view'].value='surface';nodes['mem-view'].handlers.change();assert.match(nodes['mem-inspection'].textContent,/compact-checkpoint/);assert.ok(Number(nodes['mem-node-count'].textContent)<Number(nodes['mem-log-count'].textContent));
for(const label of ['Fork 当前会话','添加未保存消息','切回父会话']){assert.equal(nodes['mem-next'].textContent,label);nodes['mem-next'].click();}
assert.equal(nodes['mem-branch'].value,'main');assert.equal(nodes['mem-branch'].children.length,2);recommended(null);assert.equal(textOf(nodes['desk-chat']),transcript);
nodes['mem-branch'].value='fork-1';nodes['mem-branch'].handlers.change();assert.match(textOf(nodes['desk-chat']),/尚未保存的补充/);
nodes['desk-expand'].click();assert.equal(nodes['desk-expand'].attributes['aria-pressed'],'true');nodes['desk-expand'].click();nodes['view-file'].click();assert.equal(nodes['agent-desk'].attributes['data-mobile-view'],'file');nodes['view-task'].click();
nodes['desk-reset'].click();assert.equal(nodes['desk-chat'].children.length,1);assert.equal(nodes['mem-branch'].children.length,1);recommended('desk-send');
nodes['desk-send'].click();nodes['mem-fail'].checked=true;nodes['mem-action'].value='compact';nodes['mem-action'].handlers.change();nodes['mem-run'].click();assert.equal(nodes['mem-branch'].disabled,true);nodes['mem-next'].click();assert.match(nodes['desk-hint'].textContent,/模拟摘要失败/);assert.equal(nodes['desk-send'].disabled,false);
nodes['mem-fail'].checked=false;nodes['mem-next'].click();nodes['mem-cancel'].click();assert.match(nodes['desk-hint'].textContent,/用户取消/);assert.equal(nodes['mem-branch'].disabled,false);
console.log('Lesson 05 UI: full guided journey, persistent chat, compacted model view, saved prefix recovery, branch comparison, failure/cancel, disabled guards, focus/mobile and reset passed (DOM test double, not browser visual QA).');
