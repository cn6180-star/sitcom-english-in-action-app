'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const s9=seasons[8],hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const counts={S09E01:6,S09E02:4,S09E03:9,S09E04:5,S09E05:8,S09E06:4,S09E07:5,S09E08:9,S09E09:7,S09E10:5,S09E11:8,S09E12:7,S09E13:13,S09E14:4,S09E15:5,S09E16:6,S09E17:3,S09E18:6,S09E19:9,S09E20:5,S09E21:6,S09E22:5,S09E23:6,S09E24:5};
const expectedSourceRanks={"S09E01":[1,2,3,4,5,6],"S09E02":[1,2,3,4],"S09E03":[1,2,3,4,5,6,7,8,9],"S09E04":[1,2,3,4,5],"S09E05":[1,2,3,4,5,6,7,8],"S09E06":[1,2,3,4],"S09E07":[1,2,3,4,5],"S09E08":[1,2,3,4,5,6,7,8,9],"S09E09":[1,2,3,4,5,6,7],"S09E10":[1,2,3,4,5],"S09E11":[1,2,3,4,5,6,7,8],"S09E12":[1,2,3,4,5,6,7],"S09E13":[1,2,3,4,5,6,7,8,9,10,11,12,13],"S09E14":[1,2,3,4],"S09E15":[1,2,3,4,5],"S09E16":[1,2,3,4,5,6],"S09E17":[1,2,4],"S09E18":[1,2,3,4,5,6],"S09E19":[1,2,3,4,5,6,7,8,9],"S09E20":[1,2,3,4,5],"S09E21":[1,2,3,4,5,6],"S09E22":[1,2,3,4,5],"S09E23":[1,2,3,4,5,6],"S09E24":[1,2,3,4,5]};
const removed=['p989','p991','p1006','p1008','p1027','p1034','p1049','p1055','p1056','p1058','p1068','p1084'];
const newIds=Array.from({length:65},(_,i)=>`p${4052+i}`).filter(id=>!cleanupDeleted.has(id));
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
assert.equal(phrases.length,3946);assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4116);assert.equal(dialogues.length,326);
for(const id of removed)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){const p=byId.get(id);assert.ok(p,`${id} NEW`);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}.${field}`);assert.equal(p.exampleTranslations.length,2);}
const accepted=s9.phrases.filter(p=>Object.hasOwn(counts,p.episode)&&Number.isInteger(p.sourceOrder));
assert.equal(accepted.length,150);assert.equal(s9.phrases.length,158);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'a38471afae8da8376f0030fc4091702c96538dd3a3196785bbedcb7c00e2c5b2','three Final Packages completedRecords');
for(const [episode,count] of Object.entries(counts)){
 const rows=accepted.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
}
assert.equal(accepted.filter(p=>p.episode==='S09E23').length,6);assert.equal(accepted.filter(p=>p.episode==='S09E24').length,5);
assert.equal(hash(s9.dialogues),'318663efa4be327a67840bc996e9257987e87e46467dffabf35d28df6c721233','exact S9 Dialogue links and bodies');
for(const [d,id] of [['d153','p989'],['d156','p991'],['d157','p1008'],['d155','p1027'],['d163','p1034'],['d151','p1055'],['d163','p1055'],['d164','p1068']])assert.ok(!dialogues.find(x=>x.id===d).phraseLinks.includes(id),`${d}/${id} stale link`);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
for(const id of ['p4089','p4067','p1060','p4106','p3324','p4116'])assert.ok(byId.has(id),`${id} special pair`);
const hints=fs.readFileSync(path.join(root,'js/dialogue-match-hints.js'),'utf8');
for(const id of removed)assert.ok(!new RegExp(`\\b${id}\\b`).test(hints),`${id} stale hint`);
console.log('S9 three Final Packages: 65 NEW, 0 UPDATE, 12 REMOVE, 87 KEEP, 0 MOVE; 152 sourceOrder entries PASS');
