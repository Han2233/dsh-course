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
const sandbox={document:{getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.structuredClone=structuredClone;sandbox.setInterval=()=>1;sandbox.clearInterval=()=>{};sandbox.matchMedia=()=>({matches:false});sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/04/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/workbench04-model.js','assets/lesson04.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
function highlighted(id){const entries=Object.entries(nodes).filter(([,n])=>n.attributes['data-recommended']==='true');assert.deepEqual(entries.map(([key])=>key),id?[id]:[]);if(id)assert.equal(nodes[id].disabled,false);}
highlighted('lab-continue');
for(let i=0;i<4;i++)nodes['lab-continue'].click();
highlighted('loop-send');assert.equal(nodes['lab-fiber'].textContent,'ACTIVE');
nodes['lab-task'].value='Read edit check';nodes['loop-target'].value='followup';nodes['loop-send'].click();highlighted('loop-next');
for(let i=0;i<100&&nodes['tool-approval'].hidden;i++)nodes['loop-next'].click();
assert.equal(nodes['tool-approval'].hidden,false);assert.equal(nodes['loop-next'].disabled,true);highlighted(null);
assert.equal(nodes['tool-allow'].disabled,false);assert.equal(nodes['tool-deny'].disabled,false);
assert.equal(JSON.parse(nodes['tool-file'].textContent).timeout,0);
nodes['tool-allow'].click();highlighted('loop-next');
for(let i=0;i<150&&!nodes['loop-next'].disabled;i++)nodes['loop-next'].click();
assert.equal(JSON.parse(nodes['tool-file'].textContent).timeout,30);assert.match(nodes['tool-result'].textContent,/PASS/);highlighted('loop-send');
assert.match(nodes['tool-diff'].textContent,/"timeout": 0/);assert.match(nodes['tool-diff'].textContent,/"timeout": 30/);
assert.equal(nodes['loop-request-choice'].children.length,4);
nodes['mode-ptc'].click();assert.match(nodes['mode-code'].textContent,/await tools/);assert.equal(nodes['mode-ptc'].attributes['aria-pressed'],'true');
nodes['mode-native'].click();assert.equal(nodes['mode-native'].attributes['aria-pressed'],'true');
nodes['lab-reset'].click();assert.equal(JSON.parse(nodes['tool-file'].textContent).timeout,0);assert.match(nodes['tool-version'].textContent,/v1/);highlighted('lab-continue');
for(let i=0;i<4;i++)nodes['lab-continue'].click();nodes['loop-send'].click();
for(let i=0;i<100&&nodes['tool-approval'].hidden;i++)nodes['loop-next'].click();
nodes['tool-deny'].click();for(let i=0;i<150&&!nodes['loop-next'].disabled;i++)nodes['loop-next'].click();
assert.match(nodes['tool-result'].textContent,/APPROVAL_REJECTED/);assert.equal(JSON.parse(nodes['tool-file'].textContent).timeout,0);
nodes['tool-mode'].value='read-only';nodes['tool-mode'].handlers.change();assert.equal(nodes['tool-mode'].value,'read-only');
console.log('Lesson 04 UI handlers: guided assembly/send/pipeline, neutral approval pause, allow/reject, live file/diff/result, snapshot selector, presentation tabs, reset and config passed (DOM test double, not browser visual QA).');
