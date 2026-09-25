'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(season=>season.phrases),dialogues=seasons.flatMap(season=>season.dialogues);
const byId=new Map(phrases.map(record=>[record.id,record]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canon=record=>Object.fromEntries(Object.keys(record).sort().map(key=>[key,record[key]]));
const newIds=Array.from({length:40},(_,i)=>`p${3782+i}`).filter(id=>!cleanupDeleted.has(id));
const keepIds=['p622','p587','p578','p593','p602','p599','p566','p619','p611','p568','p617','p597','p565','p610','p581','p607','p567','p572','p573','p579','p569','p609','p571','p608','p577','p616','p580','p615','p589','p570','p600','p574','p604','p596','p595'].filter(id=>!cleanupDeleted.has(id));
const removedIds=['p620','p612','p598'];
const episodeCounts={S05E17:7,S05E18:9,S05E19:6,S05E20:13,S05E21:11,S05E22:13,S05E23:9,S05E24:5};
const expectedSourceRanks={"S05E17":[1,2,3,4,5,6,7],"S05E18":[1,2,3,4,5,6,7,8,9],"S05E19":[1,2,3,4,5,6],"S05E20":[1,2,3,4,5,6,7,8,9,10,11,12,13],"S05E21":[1,2,3,4,5,6,7,8,9,10,11],"S05E22":[1,2,3,4,5,6,7,8,9,10,11,12,13],"S05E23":[1,2,4,5,6,7,8,10,11],"S05E24":[1,2,3,4,5]};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3946);
assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>+record.id.slice(1))),4116);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){
 const record=byId.get(id);assert.ok(record,`${id} NEW`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
 assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds].filter(id=>!cleanupDeleted.has(id)).map(id=>byId.get(id));
assert.equal(accepted.length,73);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'ae93b5d1fe1f36c0c604c8d1e72007cac20707ee4f81fb44f57bbce30a8642c3','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,73);
assert.equal(hash(ordered),'283ecb4a68d67fb9c114308f50ade356863c5ed6676ca2fad0a9fb274da3c879','Final Package sourceOrder');
const d79=dialogues.find(d=>d.id==='d79');assert.ok(d79);
assert.deepEqual(d79.phraseLinks,['p600','p609','p606','p610','p622']);
assert.equal(hash(d79.lines),'73d206e76d133440b79fe56e4536b64fd6a109062dbafce31cdbdd5cc88a6a1c','d79 English and Japanese unchanged');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue references');
console.log('S5 E17-E24 Final Package: 40 NEW, 35 KEEP, 3 REMOVE; 75 sourceOrder entries PASS');
