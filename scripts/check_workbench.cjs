const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync}=require('node:child_process');
const m=require('../assets/workbench01-model.js');
for(const preset of ['standard','minimal']){
 let s=m.initial(preset);
 for(let step=1;step<=6;step++){
  s=m.reduce(s,{type:'next'});
  assert.equal(s.stage,step);
  assert.equal(m.view(s).bound,step===6);
  assert.equal(m.view(s).ready,step>=5);
 }
 assert.deepEqual(m.view(s).capabilities,m.capabilities[preset]);
 assert.equal(m.reduce(s,{type:'next'}),s);
 s=m.reduce(s,{type:'draft',text:'<script>test</script>'});
 assert.equal(s.draft,'<script>test</script>');
 s=m.reduce(s,{type:'stop'});
 assert.equal(m.view(s).bound,false);assert.equal(m.view(s).root,false);
 s=m.reduce(s,{type:'reset'});assert.equal(s.stage,0);assert.equal(s.events.length,0);assert.equal(s.draft,'');
}
let failed=m.initial('standard',true);
for(let i=0;i<4;i++)failed=m.reduce(failed,{type:'next'});
assert.equal(failed.status,'failed');assert.equal(m.view(failed).ready,false);assert.equal(m.view(failed).root,false);
assert.equal(m.reduce(failed,{type:'next'}),failed);
for(let i=1;i<=5;i++){
 let s=m.initial();for(let k=0;k<i;k++)s=m.reduce(s,{type:'next'});
 s=m.reduce(s,{type:'stop'});assert.equal(m.view(s).root,false);assert.equal(m.reduce(s,{type:'next'}),s);
}
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'lessons/01/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/workbench01.js'),'utf8');
const sources=JSON.parse(fs.readFileSync(path.join(root,'lessons/01/sources.json'),'utf8')).sources;
for(const [, , ref] of m.steps)assert.ok(sources[ref]);
for(const [,id] of js.matchAll(/get\('([^']+)'\)/g))assert.ok(html.includes('id="'+id+'"'),id);
for(const file of ['workbench01-model.js','workbench01.js'])execFileSync('node',['--check',path.join(root,'assets',file)]);
console.log('Workbench: both presets, ready/binding boundary, failure cleanup, stop at every startup stage, reset, source references and DOM IDs passed.');
