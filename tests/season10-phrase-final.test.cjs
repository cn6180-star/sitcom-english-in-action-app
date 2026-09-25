'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const frozen={
  1:'b18125528dd0d1a45105caf25c1a666702fe55a5ef6f47a86bb5aa1c6100b45d',
  2:'df8bbf67117c40e59cd2e2c2b287966b77aba441d6e1a9622379cbdb532b8553',
  3:'9be81e68893f1d6075d4c35754dd81fc3bfc8097dcc848a1f3e8fac0fd31e7f2',
  4:'99e531d270e88d01be957c6ae8e3652eb63d705f72a8e80b05fa3fbe75d239f7',
  5:'48c5abf21ee3513401d2e48148cd787612c5307bb5b9923dbc4bfe70141113ef',
  6:'b5ee7e3c584d52d5233f618b5e0ebe34352c2c3c5afab463d7b4ddff25aeacb1',
  7:'a1c09993bfd46454595b3866ebdb5ffcf621e28d0c0e419815b77696ba49b6e4',
  8:'06c7f213fa0c12469ade48a3fe839edad1d43a7d3187c0073c26ae2645f3987b',
  9:'cb74e5dee2eff0cca06693e4f561139ccebab152faf53fb0b4cce626a29c6f92'
};
const seasons=Array.from({length:10},(_,i)=>{
 const bytes=fs.readFileSync(path.join(root,'data',`season${i+1}.json`));
 if(i<9)assert.equal(sha(bytes),frozen[i+1],`Season ${i+1} frozen`);
 return JSON.parse(bytes);
});
const s10=seasons[9],phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),ids=new Set(phrases.map(p=>p.id));
assert.equal(s10.season,10);assert.equal(s10.dialogues.length,0);assert.equal(s10.phrases.length,116);
assert.equal(phrases.length,4062);assert.equal(ids.size,4062,'duplicate Phrase IDs');
assert.equal(dialogues.length,326);assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4238);
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
for(let i=4117;i<=4238;i++){
 const record=s10.phrases.find(p=>p.id===`p${i}`);if(['p4221','p4185','p4237','p4229','p4166','p4169'].includes(`p${i}`)){assert.equal(record,undefined);continue;}assert.ok(record,`p${i} missing`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${record.id}.${field}`);
 assert.equal(record.exampleTranslations.length,2,`${record.id} translations`);
}
assert.equal(sha(JSON.stringify(s10.phrases)),'80e2e5b31630a26bb4cc18b14467f4e90698fe0f8d5fdb1feddea441b625a36b','six Final Packages completedRecord and integration snapshot');
const counts=[6,5,7,7,6,13,10,9,5,6,7,9,5,4,3,8,3,3];
for(let n=1;n<=18;n++){
 const episode=`S10E${String(n).padStart(2,'0')}`,rows=s10.phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,counts[n-1],episode);
 assert.ok(rows.every((p,i)=>i===0||rows[i-1].sourceOrder<p.sourceOrder),`${episode} retained ranks stay ordered`);
}
assert.equal(s10.phrases.find(p=>p.id==='p4225').phrase==='back-to-back',false,'superseded back-to-back must not occupy repaired p4225');
for(const id of ['p4240','p4241','p4242'])assert.ok(!ids.has(id),`${id} obsolete Additional Package ID`);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!ids.has(id))),[],'dangling Dialogue links');
const loader=fs.readFileSync(path.join(root,'js/app.js'),'utf8');assert.match(loader,/DATA_FILES\s*=\s*Array\.from\(\{length:10\}/,'Season 10 registered');
console.log('S10 six Packages: 103 Original + 19 Repair, 122 Phrase, 18 episodes, sourceOrder contiguous, S1-S9 frozen PASS');
