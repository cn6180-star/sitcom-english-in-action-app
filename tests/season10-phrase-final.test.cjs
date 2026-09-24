'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const frozen={
  1:'b18125528dd0d1a45105caf25c1a666702fe55a5ef6f47a86bb5aa1c6100b45d',
  2:'df8bbf67117c40e59cd2e2c2b287966b77aba441d6e1a9622379cbdb532b8553',
  3:'9be81e68893f1d6075d4c35754dd81fc3bfc8097dcc848a1f3e8fac0fd31e7f2',
  4:'5d456ab313078c76251dbd532d9d6996b83944e6fa5a6952f025ff5e2cd07fa8',
  5:'eb145ef8648ba9500cecb5c78ae240246fcd53fe569b6f67862448dd0fc45611',
  6:'e26e485a5438f1863b2100e20c81a7a3ea0fd6255522103a737e402367619da9',
  7:'a4bc00e2ed656cb194f05657be6af93de3b2d368b668659d542a2c79d0a28c8e',
  8:'a1b1fea89c5e05f04f9c18ee7ffc394b3eba03ef8ccd8cc9c5ff9841718efdb3',
  9:'afece9b42a20c7175bc2ee82fa7127417faa68f2df0e281d320d5bcb5fd6275b'
};
const seasons=Array.from({length:10},(_,i)=>{
 const bytes=fs.readFileSync(path.join(root,'data',`season${i+1}.json`));
 if(i<9)assert.equal(sha(bytes),frozen[i+1],`Season ${i+1} frozen`);
 return JSON.parse(bytes);
});
const s10=seasons[9],phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),ids=new Set(phrases.map(p=>p.id));
assert.equal(s10.season,10);assert.equal(s10.dialogues.length,0);assert.equal(s10.phrases.length,122);
assert.equal(phrases.length,4099);assert.equal(ids.size,4099,'duplicate Phrase IDs');
assert.equal(dialogues.length,326);assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4238);
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
for(let i=4117;i<=4238;i++){
 const record=s10.phrases.find(p=>p.id===`p${i}`);assert.ok(record,`p${i} missing`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${record.id}.${field}`);
 assert.equal(record.exampleTranslations.length,2,`${record.id} translations`);
}
assert.equal(sha(JSON.stringify(s10.phrases)),'9bcc0fac76a11a01b3e9da732ae2b2b55135a1bad065ee83a4fa83af69969be7','six Final Packages completedRecord and integration snapshot');
const counts=[6,6,7,7,6,13,10,12,5,6,8,9,6,4,3,8,3,3];
for(let n=1;n<=18;n++){
 const episode=`S10E${String(n).padStart(2,'0')}`,rows=s10.phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,counts[n-1],episode);
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:rows.length},(_,i)=>i+1),`${episode} ranks`);
}
assert.equal(s10.phrases.find(p=>p.id==='p4225').phrase==='back-to-back',false,'superseded back-to-back must not occupy repaired p4225');
for(const id of ['p4240','p4241','p4242'])assert.ok(!ids.has(id),`${id} obsolete Additional Package ID`);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!ids.has(id))),[],'dangling Dialogue links');
const loader=fs.readFileSync(path.join(root,'js/app.js'),'utf8');assert.match(loader,/DATA_FILES\s*=\s*Array\.from\(\{length:10\}/,'Season 10 registered');
console.log('S10 six Packages: 103 Original + 19 Repair, 122 Phrase, 18 episodes, sourceOrder contiguous, S1-S9 frozen PASS');
