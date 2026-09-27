'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const frozen={
  1:'b18125528dd0d1a45105caf25c1a666702fe55a5ef6f47a86bb5aa1c6100b45d',
  2:'f48fa8e3bcda831b1ed881083af6a2a023cc9a616f115d7736b0914503bb5320',
  3:'d358652d4f2763792d1ada65b1f1b959722436c4409bfeb52bebb4cdebe72c1a',
  4:'f6e4f0903b471b233a7f41c1b341f001d4642a6efa898ba3e36199d3439bf7ca',
  5:'2f55d5be9fa2ac6d8086e2795ce31d0c4e82bdbe419f3b260531e02a63cd037d',
  6:'4b88cb55be406bffb987aacf6ca6e67c8e48a4aa1ad89f0c346af59198c86d7d',
  7:'2954af6170f295c441f2ef3d1def4460d30207fb137188855929b4858e74eac6',
  8:'41a1dbce6acb31cc37329f11bf77312129c025b710f2107b661339651da65495',
  9:'d0927d16a30621b6177b22f6984b3e301af34ef58b87042d451dfdc452d997e0'
};
const seasons=Array.from({length:10},(_,i)=>{
 const bytes=fs.readFileSync(path.join(root,'data',`season${i+1}.json`));
 if(i<9)assert.equal(sha(bytes),frozen[i+1],`Season ${i+1} frozen`);
 return JSON.parse(bytes);
});
const s10=seasons[9],phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),ids=new Set(phrases.map(p=>p.id));
assert.equal(s10.season,10);assert.equal(s10.dialogues.length,12);assert.equal(s10.phrases.length,116);
assert.equal(phrases.length,4062);assert.equal(ids.size,4062,'duplicate Phrase IDs');
assert.equal(dialogues.length,334);assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4238);
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
