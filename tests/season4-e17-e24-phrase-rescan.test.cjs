'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(season=>season.phrases),dialogues=seasons.flatMap(season=>season.dialogues);
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canon=record=>Object.fromEntries(Object.keys(record).sort().map(key=>[key,record[key]]));
const newIds=Array.from({length:41},(_,i)=>`p${3650+i}`);
const keepIds=['p432','p435','p438','p439','p441','p442','p443','p444','p445','p447','p449','p453','p456','p461','p462','p464','p466','p467','p468','p469','p470','p471','p472'];
const removedIds=['p434','p440','p457','p458','p459','p460','p452','p454'];
const episodeCounts={S04E17:10,S04E18:9,S04E19:12,S04E20:6,S04E21:3,S04E22:5,S04E23:10,S04E24:9};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3744);
assert.equal(byId.size,3744,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),3821);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} removed`);
for(const id of newIds){
  const record=byId.get(id);assert.ok(record,`${id} NEW present`);
  for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
  assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds].map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));assert.equal(accepted.length,64);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'18dd6a327c71a2b14daad69f24333100204e9eb12f4c72c7cae462945beb12a6','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
  const rows=phrases.filter(phrase=>phrase.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
  assert.equal(rows.length,count,`${episode} count`);
  assert.deepEqual(rows.map(phrase=>phrase.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} unique, gapless sourceOrder`);
  ordered.push(...rows.map(phrase=>[phrase.id,phrase.episode,phrase.sourceOrder]));
}
assert.equal(ordered.length,64);
assert.equal(hash(ordered),'5410464947a5582357c2d50cfa0c0479f31b9983e18ecb52e7a713466eeed239','Final Package sourceOrder mapping');
const expectedDialogues={
  d46:{links:['p417','p364','p361','p416','p418'],lines:'ab4a72d04edd496e68d8b23c2612f9d81085036c28eceeed74c88fcd09f78c48'},
  d48:{links:['p436','p438','p439','p372','p441'],lines:'190378db9fb929fc896b3de27690555a1acb0798cfaacf8e7d57a281d17290c1'},
  d49:{links:['p403','p453','p379','p456'],lines:'111c1c5f13c483f82377579d06d5ef300aa3486ab10108523f9e61f970c25edc'}
};
for(const [id,want] of Object.entries(expectedDialogues)){
  const dialogue=dialogues.find(item=>item.id===id);assert.ok(dialogue);
  assert.deepEqual(dialogue.phraseLinks,want.links,`${id} only specified links removed`);
  assert.equal(hash(dialogue.lines),want.lines,`${id} English and Japanese unchanged`);
}
assert.deepEqual(dialogues.flatMap(dialogue=>dialogue.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
console.log('S4 E17-E24 Final Package production integrity passed (41 NEW, 23 KEEP, 8 REMOVE; 64 ordered).');
