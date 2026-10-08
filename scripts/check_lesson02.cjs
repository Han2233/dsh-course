const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const m=require('../assets/workbench02-model.js');
function host(preset='standard'){let s=m.initial(preset);for(let i=0;i<6;i++)s=m.reduce(s,{type:'base',action:{type:'next'}});return s;}
const go=(s,type,extra={})=>m.reduce(s,{type,...extra});
for(const preset of ['standard','minimal']){
 let s=host(preset);assert.equal(s.base.status,'bound');assert.equal(s.plugin,'ABSENT');
 s=go(s,'install');assert.equal(s.plugin,'PENDING');assert.deepEqual(s.resources,[]);
 s=go(s,'fs');assert.equal(s.plugin,'LOADING');s=go(s,'settle');assert.equal(s.plugin,'ACTIVE');assert.equal(s.resources.length,2);
 const uid=s.uid;
 for(let i=0;i<5;i++){s=go(s,'restart');assert.equal(s.plugin,'UNLOADING');s=go(s,'settle');assert.deepEqual(s.resources,[]);assert.equal(s.plugin,'LOADING');s=go(s,'settle');assert.equal(s.resources.length,2);assert.equal(s.uid,uid);}
 s=go(s,'fs');assert.equal(s.plugin,'UNLOADING');s=go(s,'settle');assert.equal(s.plugin,'PENDING');assert.equal(s.resources.length,0);
 s=go(s,'probe');assert.match(s.log.at(-1).message,/接收数为 0/);
 s=go(s,'fs');s=go(s,'settle');assert.equal(s.plugin,'ACTIVE');s=go(s,'probe');assert.match(s.log.at(-1).message,/收到一次/);
 s=go(s,'dispose');s=go(s,'settle');assert.equal(s.plugin,'DISPOSED');assert.equal(s.installed,false);
 s=go(go(s,'fs'),'fs');assert.equal(s.plugin,'DISPOSED');assert.equal(s.resources.length,0);
 s=go(s,'install');assert.equal(s.uid,uid+1);s=go(s,'settle');assert.equal(s.plugin,'ACTIVE');
 s=go(s,'base',{action:{type:'draft',text:'<b>task</b>'}});assert.equal(s.base.draft,'<b>task</b>');
 s=go(s,'base',{action:{type:'stop'}});assert.equal(s.plugin,'DISPOSED');assert.deepEqual(s.resources,[]);assert.equal(s.fs,false);
 assert.equal(go(s,'install'),s);s=go(s,'reset');assert.equal(s.base.stage,0);assert.equal(s.uid,0);assert.equal(s.base.draft,'');
}
let s=host();s=go(s,'install');s=go(s,'fs');s=go(s,'fail',{value:true});s=go(s,'settle');assert.equal(s.plugin,'UNLOADING');assert.equal(s.resources.length,1);s=go(s,'settle');assert.equal(s.plugin,'FAILED');assert.equal(s.resources.length,0);s=go(s,'fail',{value:false});s=go(s,'restart');s=go(go(s,'settle'),'settle');assert.equal(s.plugin,'ACTIVE');
s=go(s,'fs');s=go(s,'fs');s=go(s,'settle');assert.equal(s.plugin,'LOADING');assert.equal(s.resources.length,0);s=go(s,'settle');assert.equal(s.resources.length,2);
for(const at of ['PENDING','LOADING','ACTIVE','UNLOADING','FAILED']){
 let v=host();v=go(v,'install');if(at!=='PENDING')v=go(v,'fs');if(['ACTIVE','UNLOADING'].includes(at))v=go(v,'settle');if(at==='UNLOADING')v=go(v,'fs');if(at==='FAILED'){v=go(v,'fail',{value:true});v=go(go(v,'settle'),'settle');}
 v=go(v,'dispose');v=go(v,'settle');assert.equal(v.plugin,'DISPOSED');assert.equal(v.resources.length,0);
}
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'lessons/02/index.html'),'utf8'),js=fs.readFileSync(path.join(root,'assets/lesson02.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'lessons/02/sources.json'),'utf8'));
for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(html.includes('id="'+id+'"'),id);
for(const id of ['lab-install','lab-fs','lab-settle','lab-restart','lab-dispose','lab-probe'])assert.ok(html.includes('id="'+id+'"'));
for(const e of s.log)assert.ok(manifest.sources[e.ref],e.ref);
for(const file of ['lesson02.js','workbench02-model.js'])execFileSync('node',['--check',path.join(root,'assets',file)]);
assert.ok(!html.includes('data-quiz'));
console.log('Lesson 02: both presets, 5 repeat restarts without duplicate contributions, dependency loss/recovery, teardown churn, partial startup failure, stop/reset, dispose from 5 states, references and DOM IDs passed.');
// Reinstallation must never replace an instance while its cleanup is outstanding.
let pending=m.reduce(host(),{type:'install'});pending=go(pending,'fs');pending=go(pending,'settle');pending=go(pending,'dispose');
assert.match(m.controls(pending).install,/清理/);assert.equal(go(pending,'install'),pending);assert.equal(pending.resources.length,2);
pending=go(pending,'settle');assert.equal(pending.resources.length,0);pending=go(pending,'install');assert.equal(pending.uid,2);
let guided=m.initial();for(let i=0;i<4;i++)guided=m.reduce(guided,m.nextAction(guided));assert.equal(guided.plugin,'ACTIVE');
console.log('Guided next-action and reinstall-before-cleanup regressions passed.');
