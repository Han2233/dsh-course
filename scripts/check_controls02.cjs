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
const html=fs.readFileSync(path.join(root,'lessons/02/index.html'),'utf8');
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const section=new Element();section.id='workbench';
const sandbox={document:{getElementById:id=>nodes[id],createElement:tag=>{const e=new Element();e.tag=tag;return e;},querySelectorAll:sel=>sel==='.lesson-section'?[section]:[],documentElement:{scrollHeight:1000}},innerHeight:600,scrollY:0,location:{},addEventListener(){},requestAnimationFrame:fn=>fn()};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['lessons/02/sources.js','assets/workbench01-model.js','assets/workbench02-model.js','assets/lesson02.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
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
console.log('UI handlers passed: quick assembly unlocks controls, guided steps, pending cleanup blocks reinstall, reinstall after cleanup, stop/reset/recovery. No browser layout assertions.');
