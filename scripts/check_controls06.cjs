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
const html=fs.readFileSync(path.join(root,'lessons/06/index.html'),'utf8');
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const labButtons=Object.fromEntries(['restart','resume','round','kill','done','due','claim','reset'].map(k=>{const e=new Element();e.dataset.lab=k;return [k,e];}));
const section=new Element();section.id='workbench';
const sandbox={document:{body:new Element(),getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:sel==='[data-lab]'?Object.values(labButtons):[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.structuredClone=structuredClone;sandbox.setInterval=()=>1;sandbox.clearInterval=()=>{};sandbox.matchMedia=()=>({matches:false});sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/06/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/workbench04-model.js','assets/workbench05-model.js','assets/workbench06-model.js','assets/lesson06.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
function textOf(el){return el.textContent+' '+el.children.map(textOf).join(' ');}
function recommended(id){const list=Object.entries(nodes).filter(([,e])=>e.attributes['data-recommended']==='true').map(([k])=>k);assert.deepEqual(list,id?[id]:[]);if(id)assert.equal(nodes[id].disabled,false);}
recommended('desk-send');assert.equal(nodes['team-run'].disabled,true);nodes['desk-send'].click();assert.match(nodes['desk-hint'].textContent,/输入/);nodes['desk-task'].value='读取配置，修正错误，再运行检查。';nodes['desk-send'].click();recommended('team-next');assert.match(textOf(nodes['desk-chat']),/PASS/);const parent=textOf(nodes['desk-chat']);
for(const label of ['Spawn 检查员','Fork 复核员','给检查员补充要求','推进检查员','推进检查员','推进复核员','推进复核员','冷恢复检查员','推进检查员','推进检查员','父 Agent 汇总']){assert.equal(nodes['team-next'].textContent,label);nodes['team-next'].click();}
recommended(null);assert.equal(nodes['team-next'].disabled,true);assert.equal(nodes['team-session'].children.length,3);assert.match(textOf(nodes['desk-chat']),/结算通知/);assert.ok(textOf(nodes['desk-chat']).startsWith(parent));nodes['team-session'].value='a';nodes['team-session'].handlers.change();assert.match(textOf(nodes['desk-chat']),/额外说明/);assert.match(textOf(nodes['desk-chat']),/再次|再检查/);nodes['team-view'].value='inbox';nodes['team-view'].handlers.change();assert.match(nodes['team-inspection'].textContent,/"activation": 2/);
nodes['team-action'].value='sibling';nodes['team-action'].handlers.change();nodes['team-run'].click();assert.match(nodes['desk-hint'].textContent,/UNAUTHORIZED/);nodes['team-action'].value='resume';nodes['team-action'].handlers.change();nodes['team-run'].click();nodes['team-action'].value='interrupt';nodes['team-action'].handlers.change();nodes['team-run'].click();assert.match(nodes['desk-hint'].textContent,/中断/);nodes['team-action'].value='a';nodes['team-action'].handlers.change();assert.equal(nodes['team-run'].disabled,true);
nodes['desk-expand'].click();assert.equal(nodes['desk-expand'].attributes['aria-pressed'],'true');nodes['desk-expand'].click();nodes['view-file'].click();assert.equal(nodes['agent-desk'].attributes['data-mobile-view'],'file');nodes['view-task'].click();nodes['desk-reset'].click();recommended('desk-send');assert.equal(nodes['team-session'].children.length,1);
labButtons.kill.click();assert.match(nodes['lab-job'].textContent,/stopping/);labButtons.done.click();assert.match(nodes['lab-job'].textContent,/cancelled/);labButtons.due.click();assert.match(nodes['lab-schedule'].textContent,/"executed": 0/);labButtons.claim.click();assert.match(nodes['lab-schedule'].textContent,/"executed": 1/);labButtons.restart.click();assert.match(nodes['lab-goal'].textContent,/disarmed/);labButtons.resume.click();labButtons.round.click();labButtons.round.click();labButtons.round.click();assert.match(nodes['lab-goal'].textContent,/blocked/);labButtons.reset.click();assert.match(nodes['lab-job'].textContent,/running/);
console.log('Lesson 06 UI: full recommended journey, persistent parent/child conversations, message controls, inspector, reset, focus/mobile controls and all comparison-lab buttons passed (DOM test double; not visual QA).');
