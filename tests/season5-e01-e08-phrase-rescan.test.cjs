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
const newIds=Array.from({length:49},(_,i)=>`p${3691+i}`).filter(id=>!cleanupDeleted.has(id));
const keepIds=['p510','p486','p502','p495','p553','p535','p537','p519','p551','p480','p511','p493','p509','p523','p521','p546','p497','p530','p543','p508','p536','p507','p504','p484','p496','p526','p541','p557','p479','p533','p516','p528','p488','p483'].filter(id=>!cleanupDeleted.has(id));
const removedIds=['p490','p512','p499','p531'];
const episodeCounts={S05E01:10,S05E02:13,S05E03:7,S05E04:8,S05E05:11,S05E06:9,S05E07:17,S05E08:3};
const expectedSourceRanks={"S05E01":[1,2,3,4,5,6,7,9,10,11],"S05E02":[1,2,3,4,5,6,7,8,9,10,11,12,13],"S05E03":[1,2,4,5,6,7,8],"S05E04":[1,2,3,4,5,6,7,8],"S05E05":[1,2,3,4,5,6,7,9,10,11,12],"S05E06":[1,2,3,4,5,6,7,8,9],"S05E07":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,17,18],"S05E08":[2,3,4]};
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
const accepted=[...newIds,...keepIds,'p503'].filter(id=>!cleanupDeleted.has(id)).map(id=>byId.get(id));
assert.equal(accepted.length,78);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'9dfaa1492387abda249f4e3a272c78939453d03ee43fa5fd05d853db546ce414','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),expectedSourceRanks[episode],`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,78);
assert.equal(hash(ordered),'4996ef290fac169be73c52f9834e87b0b7b7a9599fd59b5ccd03a92adb89458f','Final Package sourceOrder');
assert.ok(!byId.has('p503'));assert.equal(byId.get('p3353').meaning,'ふざける');
const expectedDialogues={
 d68:{links:['p520','p502','p554','p505','p557'].filter(id=>!cleanupDeleted.has(id)),lines:'83a63e91f7826eeeaf1754a09a2d947a839bd37a25a340d2e2b3766bae6ce1bf'},
 d75:{links:['p513','p573','p474','p575','p576'].filter(id=>!cleanupDeleted.has(id)),lines:'fffef65c34bd86f50e650eac44ac37f427552254fa56b4f40a3e5254842dd235'},
 d83:{links:['p608','p595','p579','p588','p543','p578','p619'].filter(id=>!cleanupDeleted.has(id)),lines:'33403dbe91ae43c1725fef4e55310c49b4be4e4f6de74edde2a77c8ea27acee1'}
};
for(const [id,want] of Object.entries(expectedDialogues)){
 const dialogue=dialogues.find(item=>item.id===id);assert.ok(dialogue);
 assert.deepEqual(dialogue.phraseLinks,want.links,`${id} exact links`);
 assert.equal(hash(dialogue.lines),want.lines,`${id} English and Japanese unchanged`);
}
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue references');
console.log('S5 E01-E08 Final Package: 49 NEW, 1 UPDATE, 34 KEEP, 4 REMOVE; 84 sourceOrder entries PASS');
