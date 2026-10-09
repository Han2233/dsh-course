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
const html=fs.readFileSync(path.join(root,'lessons/04/index.html'),'utf8');
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const section=new Element();section.id='workbench';
const sandbox={document:{body:new Element(),getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.structuredClone=structuredClone;sandbox.setInterval=()=>1;sandbox.clearInterval=()=>{};sandbox.matchMedia=()=>({matches:false});sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/04/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/workbench04-model.js','assets/lesson04.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
function highlighted(id){const entries=Object.entries(nodes).filter(([,n])=>n.attributes['data-recommended']==='true');assert.deepEqual(entries.map(([key])=>key),id?[id]:[]);if(id)assert.equal(nodes[id].disabled,false);}
function nextUntil(predicate){for(let i=0;i<70&&!predicate();i++){assert.equal(nodes['desk-next'].disabled,false);nodes['desk-next'].click();}assert.ok(predicate());}
function completed(){return nodes['desk-next'].textContent==='再次运行任务';}
nodes['desk-task'].value='Read edit check';
highlighted('desk-send');assert.match(nodes['desk-stage'].textContent,/就绪/);assert.equal(nodes['desk-cancel'].disabled,true);
nodes['desk-send'].click();assert.match(nodes['desk-progress'].textContent,/demo.read/);assert.equal(nodes['desk-task'].disabled,true);
nextUntil(()=>!nodes['desk-approval'].hidden);highlighted(null);assert.equal(nodes['desk-next'].disabled,true);assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,0);
nodes['desk-allow'].click();highlighted('desk-next');nextUntil(completed);assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,30);highlighted('desk-reset');assert.match(nodes['desk-inspection'].textContent,/PASS/);
assert.equal(nodes['desk-request-choice'].children.length,4);
function textOf(el){return el.textContent+' '+el.children.map(textOf).join(' ');}
const conversation=textOf(nodes['desk-chat']);
assert.match(conversation,/Read edit check/);assert.match(conversation,/调用 demo.read/);assert.match(conversation,/调用 demo.edit/);assert.match(conversation,/调用 demo.check/);assert.match(conversation,/工具结果/);assert.match(conversation,/PASS/);assert.match(conversation,/已根据虚拟工具结果/);
assert.equal(nodes['desk-chat'].children.length,8,'one user, four assistant and three tool messages');
const count=nodes['desk-chat'].children.length;nodes['view-file'].click();nodes['view-task'].click();assert.equal(nodes['desk-chat'].children.length,count);

nodes['desk-inspect'].value='request';nodes['desk-inspect'].handlers.change();assert.equal(nodes['desk-request-choice'].hidden,false);nodes['desk-request-choice'].value='0';nodes['desk-request-choice'].handlers.change();assert.equal(JSON.parse(nodes['desk-inspection'].textContent).messages.filter(m=>m.role==='tool').length,0);
nodes['desk-inspect'].value='diff';nodes['desk-inspect'].handlers.change();assert.match(nodes['desk-inspection'].textContent,/"timeout": 0/);assert.match(nodes['desk-inspection'].textContent,/"timeout": 30/);
nodes['desk-expand'].click();assert.equal(nodes['desk-expand'].attributes['aria-pressed'],'true');nodes['desk-expand'].click();assert.equal(nodes['desk-expand'].attributes['aria-pressed'],'false');
nodes['view-file'].click();assert.equal(nodes['agent-desk'].attributes['data-mobile-view'],'file');assert.equal(nodes['view-task'].attributes['aria-pressed'],'false');nodes['view-task'].click();
nodes['desk-reset'].click();assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,0);highlighted('desk-send');assert.equal(nodes['desk-chat'].children.length,1);assert.doesNotMatch(textOf(nodes['desk-chat']),/PASS/);
nextUntil(()=>!nodes['desk-approval'].hidden);nodes['desk-deny'].click();nextUntil(completed);nodes['desk-inspect'].value='result';nodes['desk-inspect'].handlers.change();assert.match(nodes['desk-inspection'].textContent,/APPROVAL_REJECTED/);assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,0);
for(const [scenario,error,timeout] of [['readonly','FS_SANDBOX_DENIED',0],['guard','GUARD_DENIED',0],['post','POST_BLOCKED',30],['deny','POLICY_DENIED',0]]){
 nodes['desk-scenario'].value=scenario;nodes['desk-scenario'].handlers.change();assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,0);
 for(let i=0;i<70&&!completed();i++){if(!nodes['desk-approval'].hidden)nodes['desk-allow'].click();else nodes['desk-next'].click();}
 assert.ok(completed());assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,timeout);assert.match(nodes['desk-inspection'].textContent,new RegExp(error));
}
nodes['desk-scenario'].value='normal';nodes['desk-scenario'].handlers.change();nextUntil(()=>!nodes['desk-approval'].hidden);nodes['desk-external'].click();nodes['desk-allow'].click();nextUntil(completed);assert.match(nodes['desk-inspection'].textContent,/FS_CONFLICT/);
nodes['desk-reset'].click();nodes['desk-next'].click();nodes['desk-cancel'].click();assert.ok(completed());assert.equal(JSON.parse(nodes['desk-file'].textContent).timeout,0);
nodes['mode-ptc'].click();assert.match(nodes['mode-code'].textContent,/await tools/);
console.log('Compact lesson 04 UI: ready prerequisites, tool-only steps, approval, all scenarios, conflict, cancellation, reset, inspector, focus/mobile toggles and guidance passed. DOM test double, not browser visual QA.');
