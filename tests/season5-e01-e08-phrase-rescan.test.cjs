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
const newIds=Array.from({length:49},(_,i)=>`p${3691+i}`);
const keepIds=['p510','p486','p502','p495','p553','p535','p537','p519','p551','p480','p511','p493','p509','p523','p521','p546','p497','p530','p543','p508','p536','p507','p504','p484','p496','p526','p541','p557','p479','p533','p516','p528','p488','p483'];
const removedIds=['p490','p512','p499','p531'];
const episodeCounts={S05E01:11,S05E02:13,S05E03:8,S05E04:8,S05E05:12,S05E06:10,S05E07:18,S05E08:4};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3669);
assert.equal(byId.size,3669,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>+record.id.slice(1))),3739);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){
 const record=byId.get(id);assert.ok(record,`${id} NEW`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
 assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds,'p503'].map(id=>byId.get(id));
assert.equal(accepted.length,84);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'f08dc04b011b3ad6fdf4deec6d92571311bf03f560374b5190e6020c61295d8a','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,84);
assert.equal(hash(ordered),'7bf2443842017e953ddf3214bab8eac5b72028db97bac44a0b963e3771b3e76d','Final Package sourceOrder');
assert.equal(byId.get('p503').episode,'S05E03');assert.equal(byId.get('p503').sourceOrder,3);
assert.equal(byId.get('p503').meaning,'本気の関係ではなく気軽に遊ぶ／付き合う');
assert.equal(byId.get('p3353').meaning,'ふざける');
const expectedDialogues={
 d68:{links:['p520','p502','p554','p505','p557'],lines:'83a63e91f7826eeeaf1754a09a2d947a839bd37a25a340d2e2b3766bae6ce1bf'},
 d75:{links:['p513','p573','p474','p575','p576'],lines:'fffef65c34bd86f50e650eac44ac37f427552254fa56b4f40a3e5254842dd235'},
 d83:{links:['p608','p595','p579','p588','p543','p578','p619'],lines:'33403dbe91ae43c1725fef4e55310c49b4be4e4f6de74edde2a77c8ea27acee1'}
};
for(const [id,want] of Object.entries(expectedDialogues)){
 const dialogue=dialogues.find(item=>item.id===id);assert.ok(dialogue);
 assert.deepEqual(dialogue.phraseLinks,want.links,`${id} exact links`);
 assert.equal(hash(dialogue.lines),want.lines,`${id} English and Japanese unchanged`);
}
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue references');
console.log('S5 E01-E08 Final Package: 49 NEW, 1 UPDATE, 34 KEEP, 4 REMOVE; 84 sourceOrder entries PASS');
