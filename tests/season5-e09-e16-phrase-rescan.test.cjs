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
const newIds=Array.from({length:42},(_,i)=>`p${3740+i}`).filter(id=>!cleanupDeleted.has(id));
const keepIds=['p545','p548','p554','p539','p542','p559','p524','p506','p556','p529','p487','p476','p474','p500','p525','p475','p544','p481','p534','p520','p538','p532','p492','p515','p501','p560','p549','p562','p482','p478','p603','p594','p585','p583','p618','p564','p582'].filter(id=>!cleanupDeleted.has(id));
const removedIds=['p477','p518','p527','p561'];
const episodeCounts={S05E09:10,S05E10:15,S05E11:8,S05E12:10,S05E13:7,S05E14:9,S05E15:9,S05E16:10};
const expectedSourceRanks={"S05E09":[1,2,3,4,5,6,7,8,9,10],"S05E10":[1,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"S05E11":[1,2,3,4,5,7,8,9],"S05E12":[1,2,3,4,5,6,7,8,9,10],"S05E13":[1,2,3,4,5,6,7],"S05E14":[1,2,3,4,5,6,7,8,9],"S05E15":[1,2,3,4,5,6,7,8,9],"S05E16":[1,2,3,4,5,6,7,8,9,10]};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3946);
assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>+record.id.slice(1))),4116);
assert.equal(dialogues.length,322);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){
 const record=byId.get(id);assert.ok(record,`${id} NEW`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
 assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds,'p621'].filter(id=>!cleanupDeleted.has(id)).map(id=>byId.get(id));
assert.equal(accepted.length,78);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'ca8552e050459be0e984dcfbce853cb30f06ccc74e6605bbcd979a421a1dbaf2','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,78);
assert.equal(hash(ordered),'41e10c05919419e8d4e071f0fb2406835927f30a6714db2d2ffacfb08c22934b','Final Package sourceOrder');
assert.equal(byId.get('p621').episode,'S05E16');assert.equal(byId.get('p621').sourceOrder,9);
assert.equal(byId.get('p621').meaning,'訴え・告発などを立証して成立させる');
for(const id of ['d65','d69','d70','d72','d77'])assert.ok(!dialogues.some(d=>d.id===id),id+' replaced by Notion rebuild');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!require("./helpers/all-production-phrase-ids.cjs").has(id))),[],'no dangling Dialogue references');
console.log('S5 E09-E16 Final Package: 42 NEW, 1 UPDATE, 37 KEEP, 4 REMOVE; 80 sourceOrder entries PASS');
