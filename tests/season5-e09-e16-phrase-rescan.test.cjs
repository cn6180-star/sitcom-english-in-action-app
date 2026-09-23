'use strict';
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
const newIds=Array.from({length:42},(_,i)=>`p${3740+i}`);
const keepIds=['p545','p548','p554','p539','p542','p559','p524','p506','p556','p529','p487','p476','p474','p500','p525','p475','p544','p481','p534','p520','p538','p532','p492','p515','p501','p560','p549','p562','p482','p478','p603','p594','p585','p583','p618','p564','p582'];
const removedIds=['p477','p518','p527','p561'];
const episodeCounts={S05E09:10,S05E10:16,S05E11:9,S05E12:10,S05E13:7,S05E14:9,S05E15:9,S05E16:10};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3707);
assert.equal(byId.size,3707,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>+record.id.slice(1))),3781);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){
 const record=byId.get(id);assert.ok(record,`${id} NEW`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
 assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds,'p621'].map(id=>byId.get(id));
assert.equal(accepted.length,80);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'2fb90dcef03b7be5118bb3f2180e4fbd96429d94a1714fbe8861b51877c5567b','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,80);
assert.equal(hash(ordered),'9aec08b0037c47cd93d8eb93502cf92ee59c0a9e2348737d57f5240b250ed0c7','Final Package sourceOrder');
assert.equal(byId.get('p621').episode,'S05E16');assert.equal(byId.get('p621').sourceOrder,9);
assert.equal(byId.get('p621').meaning,'訴え・告発などを立証して成立させる');
const expectedDialogues={
 d65:{links:['p479','p500','p485','p514','p480','p511'],lines:'13637a66a0a1dc36f20cf7c55c1e42bc74e735e686cc975e4d72cd1ac8cf267a'},
 d69:{links:['p533','p556','p542','p559','p544','p553'],lines:'c315df2f7309be514e9e442f43f949facdb6a370f13b0dddf4a63051a150c74a'},
 d70:{links:['p605','p610','p528','p530'],lines:'2e5e8ed51722dd40a79411100f554d1d9ccb8dc518840150b2d3efc08e9b9c03'},
 d72:{links:['p591','p567','p568','p580','p572','p575'],lines:'a7477bc633dee4d2c8907b25d1b3a0b384c0eb1bdd0bcce6aa414910dfdf0be5'},
 d77:{links:['p538','p585','p594','p508','p615','p521'],lines:'346da34e3f187840a26f59689de2e10cc736a0c600be4fe4b40c7a6b9ef943e4'}
};
for(const [id,want] of Object.entries(expectedDialogues)){
 const dialogue=dialogues.find(item=>item.id===id);assert.ok(dialogue);
 assert.deepEqual(dialogue.phraseLinks,want.links,`${id} exact links`);
 assert.equal(hash(dialogue.lines),want.lines,`${id} English and Japanese unchanged`);
}
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue references');
console.log('S5 E09-E16 Final Package: 42 NEW, 1 UPDATE, 37 KEEP, 4 REMOVE; 80 sourceOrder entries PASS');
