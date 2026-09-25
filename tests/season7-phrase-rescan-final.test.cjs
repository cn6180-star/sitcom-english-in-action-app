'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const s7=seasons[6],hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const counts={S07E01:5,S07E02:4,S07E03:6,S07E04:2,S07E05:5,S07E06:6,S07E07:5,S07E08:3,S07E09:8,S07E10:6,S07E11:10,S07E12:4,S07E13:9,S07E14:4,S07E15:7,S07E16:9,S07E17:5,S07E18:5,S07E19:9,S07E20:5,S07E21:3,S07E22:6,S07E23:4,S07E24:6};
const expectedSourceRanks={"S07E01":[1,2,3,4,5],"S07E02":[1,2,3,4],"S07E03":[1,2,3,4,5,6],"S07E04":[1,2],"S07E05":[1,2,3,4,6],"S07E06":[1,2,3,4,5,6],"S07E07":[1,2,3,4,5],"S07E08":[1,2,3],"S07E09":[1,2,3,4,5,6,7,8],"S07E10":[1,2,3,4,5,6],"S07E11":[1,2,3,4,5,6,7,8,9,10],"S07E12":[1,2,3,4],"S07E13":[1,2,3,4,5,6,7,8,9],"S07E14":[1,2,3,4],"S07E15":[1,2,3,4,5,6,7],"S07E16":[1,2,3,4,5,6,7,8,9],"S07E17":[1,2,3,4,5],"S07E18":[1,2,3,4,5],"S07E19":[1,2,3,4,5,6,7,9,10],"S07E20":[1,2,3,4,5],"S07E21":[1,2,4],"S07E22":[1,2,3,4,5,6],"S07E23":[1,2,3,4],"S07E24":[1,2,3,4,5,6]};
const removed=['p763','p762','p764','p768','p769','p771','p772','p773','p778','p767','p779','p795','p799','p814','p818','p819','p821','p822','p823','p825','p828','p833','p837','p838'];
const newIds=Array.from({length:80},(_,i)=>`p${3909+i}`).filter(id=>!cleanupDeleted.has(id));
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
assert.equal(phrases.length,3946);assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4116);assert.equal(dialogues.length,326);
for(const id of removed)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){const p=byId.get(id);assert.ok(p,`${id} NEW`);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}.${field}`);assert.equal(p.exampleTranslations.length,2);}
const accepted=s7.phrases.filter(p=>Object.hasOwn(counts,p.episode)&&Number.isInteger(p.sourceOrder));
assert.equal(accepted.length,136);assert.equal(s7.phrases.length,143);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'7d55cc41bc3e42e02c072c9d031d44a6a9b006fd1bfb42cfd31df8b758680645','three Final Packages completedRecords');
for(const [episode,count] of Object.entries(counts)){
 const rows=accepted.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
}
assert.ok(!byId.has('p858'));assert.equal(byId.get('p781').episode,'S07E07');assert.equal(byId.get('p781').sourceOrder,2);
assert.equal(accepted.filter(p=>p.episode==='S07E23').length,4);assert.equal(accepted.filter(p=>p.episode==='S07E24').length,6);
assert.equal(hash(s7.dialogues),'7e9ccaab186d51351e20f18aacf4c6ee736a41a1d2e4c6ed5c95c97a2b0b0414','exact S7 Dialogue links and bodies');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
const hints=fs.readFileSync(path.join(root,'js/dialogue-match-hints.js'),'utf8');
for(const id of ['p767','p821','p823'])assert.ok(!new RegExp(`\\b${id}\\b`).test(hints),`${id} stale hint`);
console.log('S7 three Final Packages: 80 NEW, 0 UPDATE, 24 REMOVE, 59 KEEP, 2 MOVE; 141 sourceOrder entries PASS');
