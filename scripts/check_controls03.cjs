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
const html=fs.readFileSync(path.join(root,'lessons/03/index.html'),'utf8');
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const section=new Element();section.id='workbench';
const sandbox={document:{getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.structuredClone=structuredClone;sandbox.setInterval=()=>1;sandbox.clearInterval=()=>{};sandbox.matchMedia=()=>({matches:false});sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/03/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/workbench03-model.js','assets/lesson03.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
assert.equal(nodes['lab-install'].disabled,true);assert.match(nodes['lab-install-reason'].textContent,/先完成/);
nodes['lab-continue'].click();assert.equal(nodes['lab-install'].disabled,false);assert.equal(nodes['lab-fs'].disabled,false);
nodes['lab-install'].click();assert.equal(nodes['lab-fiber'].textContent,'PENDING');
nodes['lab-continue'].click();assert.equal(nodes['lab-fiber'].textContent,'LOADING');
nodes['lab-continue'].click();assert.equal(nodes['lab-fiber'].textContent,'ACTIVE');
nodes['lab-dispose'].click();assert.equal(nodes['lab-install'].disabled,true);assert.match(nodes['lab-install-reason'].textContent,/清理/);
nodes['lab-install'].click();assert.equal(nodes['lab-fiber'].textContent,'UNLOADING');
nodes['lab-continue'].click();assert.equal(nodes['lab-fiber'].textContent,'DISPOSED');assert.equal(nodes['lab-install'].disabled,false);
nodes['lab-continue'].click();assert.equal(nodes['lab-fiber'].textContent,'LOADING');
nodes['lab-continue'].click();nodes['lab-stop'].click();assert.equal(nodes['lab-install'].disabled,true);
nodes['lab-continue'].click();nodes['lab-continue'].click();assert.equal(nodes['lab-install'].disabled,false);

nodes['lab-install'].click();nodes['lab-fs'].click();nodes['lab-settle'].click();
nodes['lab-task'].value='读取配置，修正错误，再运行检查。';nodes['loop-target'].value='followup';nodes['loop-send'].click();
assert.equal(nodes['loop-next'].disabled,false);
for(let i=0;i<50&&!nodes['loop-next'].disabled;i++)nodes['loop-next'].click();
assert.match(nodes['loop-counts'].textContent,/Turn 1 \/ Step 4 \/ Attempt 4/);
assert.match(nodes['loop-outcome'].textContent,/completed/);
assert.match(nodes['loop-request'].textContent,/teaching-mock/);
assert.equal(nodes['loop-request-choice'].children.length,4);
nodes['loop-request-choice'].value='0';nodes['loop-request-choice'].handlers.change();
assert.equal(JSON.parse(nodes['loop-request'].textContent).messages.filter(m=>m.role==='tool').length,0);
nodes['lab-reset'].click();nodes['lab-continue'].click();
nodes['lab-task'].value='取消测试';nodes['loop-send'].click();
for(let i=0;i<4;i++)nodes['loop-next'].click();nodes['loop-cancel'].click();
assert.match(nodes['loop-outcome'].textContent,/aborted/);assert.equal(nodes['loop-next'].disabled,true);
console.log('Lesson 03 UI wiring: inherited plugin controls, full task, request selection, reset, stream cancellation passed (DOM test double, not visual QA).');
