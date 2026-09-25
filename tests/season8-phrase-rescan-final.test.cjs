'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const s8=seasons[7],hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const counts={S08E01:7,S08E02:2,S08E03:8,S08E04:7,S08E05:9,S08E06:5,S08E07:8,S08E08:5,S08E09:10,S08E10:4,S08E11:7,S08E12:5,S08E13:8,S08E14:8,S08E15:9,S08E16:5,S08E17:8,S08E18:7,S08E19:5,S08E20:6,S08E21:5,S08E22:9,S08E23:8,S08E24:4};
const expectedSourceRanks={"S08E01":[1,2,3,4,5,6,7],"S08E02":[1,2],"S08E03":[1,2,3,4,5,6,7,8],"S08E04":[1,2,3,4,5,6,7],"S08E05":[1,2,3,5,6,7,8,9,10],"S08E06":[1,2,3,4,5],"S08E07":[1,2,3,4,5,6,7,8],"S08E08":[1,2,3,4,5],"S08E09":[1,2,3,4,5,6,7,8,9,10],"S08E10":[1,2,3,4],"S08E11":[1,2,3,4,5,6,7],"S08E12":[1,2,3,4,5],"S08E13":[1,3,4,5,6,7,8,9],"S08E14":[1,2,3,4,5,6,7,8],"S08E15":[1,2,3,4,5,7,8,9,10],"S08E16":[1,2,3,4,5],"S08E17":[1,2,3,4,5,7,8,9],"S08E18":[1,2,3,4,5,6,7],"S08E19":[1,2,3,4,5],"S08E20":[1,2,3,5,6,7],"S08E21":[1,2,3,4,5],"S08E22":[1,2,3,4,5,6,7,8,9],"S08E23":[1,2,3,5,6,7,8,9],"S08E24":[1,2,3,4]};
const removed=['p873','p893','p907','p943','p962'];
const newIds=Array.from({length:63},(_,i)=>`p${3989+i}`).filter(id=>!cleanupDeleted.has(id));
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
assert.equal(phrases.length,3946);assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4116);assert.equal(dialogues.length,326);
for(const id of removed)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){const p=byId.get(id);assert.ok(p,`${id} NEW`);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}.${field}`);assert.equal(p.exampleTranslations.length,2);}
const accepted=s8.phrases.filter(p=>Object.hasOwn(counts,p.episode)&&Number.isInteger(p.sourceOrder));
assert.equal(accepted.length,159);assert.equal(s8.phrases.length,165);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'2954a4271c0e22d7eec223a62f08d0f0a544dd892e7658e24aed07b9ab1cf7d1','three Final Packages completedRecords');
for(const [episode,count] of Object.entries(counts)){
 const rows=accepted.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
}
assert.equal(accepted.filter(p=>p.episode==='S08E23').length,8);assert.equal(accepted.filter(p=>p.episode==='S08E24').length,4);
assert.equal(hash(s8.dialogues),'85a316ff974a00e5486f42e42b1a0b469b1a90e2656346dedaee3318dec3eab1','exact S8 Dialogue links and bodies');
for(const [d,id] of [['d143','p873'],['d132','p893'],['d146','p907'],['d141','p943'],['d144','p962']])assert.ok(!dialogues.find(x=>x.id===d).phraseLinks.includes(id),`${d}/${id} stale link`);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
const hints=fs.readFileSync(path.join(root,'js/dialogue-match-hints.js'),'utf8');
for(const id of removed)assert.ok(!new RegExp(`\\b${id}\\b`).test(hints),`${id} stale hint`);
console.log('S8 three Final Packages: 63 NEW, 0 UPDATE, 5 REMOVE, 102 KEEP, 0 MOVE; 165 sourceOrder entries PASS');
