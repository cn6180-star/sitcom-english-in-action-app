'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
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
const newIds=Array.from({length:41},(_,i)=>`p${3650+i}`).filter(id=>!cleanupDeleted.has(id));
const keepIds=['p432','p435','p438','p439','p441','p442','p443','p444','p445','p447','p449','p453','p456','p461','p462','p464','p466','p467','p468','p469','p470','p471','p472'].filter(id=>!cleanupDeleted.has(id));
const removedIds=['p434','p440','p457','p458','p459','p460','p452','p454'];
const episodeCounts={S04E17:10,S04E18:9,S04E19:12,S04E20:6,S04E21:3,S04E22:5,S04E23:10,S04E24:8};
const expectedSourceRanks={"S04E17":[1,2,3,4,5,6,7,8,9,10],"S04E18":[1,2,3,4,5,6,7,8,9],"S04E19":[1,2,3,4,5,6,7,8,9,10,11,12],"S04E20":[1,2,3,4,5,6],"S04E21":[1,2,3],"S04E22":[1,2,3,4,5],"S04E23":[1,2,3,4,5,6,7,8,9,10],"S04E24":[1,2,3,4,5,6,8,9]};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3946);
assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),4116);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} removed`);
for(const id of newIds){
  const record=byId.get(id);assert.ok(record,`${id} NEW present`);
  for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
  assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds].filter(id=>!cleanupDeleted.has(id)).map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));assert.equal(accepted.length,63);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'33e8a201f9e5f304d583d305aa7ec9ae24547dba52ca61528b32c1bb6b578083','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
  const rows=phrases.filter(phrase=>phrase.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
  assert.equal(rows.length,count,`${episode} count`);
  assert.deepEqual(rows.map(phrase=>phrase.sourceOrder),expectedSourceRanks[episode],`${episode} unique, gapless sourceOrder`);
  ordered.push(...rows.map(phrase=>[phrase.id,phrase.episode,phrase.sourceOrder]));
}
assert.equal(ordered.length,63);
assert.equal(hash(ordered),'c92fb359ac3d8690dd2f490b660cdc93593be3d0ad9a1b778faccf38a2636cd5','Final Package sourceOrder mapping');
const expectedDialogues={
  d46:{links:['p417','p364','p361','p416','p418'].filter(id=>!cleanupDeleted.has(id)),lines:'ab4a72d04edd496e68d8b23c2612f9d81085036c28eceeed74c88fcd09f78c48'},
  d48:{links:['p436','p438','p439','p372','p441'].filter(id=>!cleanupDeleted.has(id)),lines:'190378db9fb929fc896b3de27690555a1acb0798cfaacf8e7d57a281d17290c1'},
  d49:{links:['p403','p453','p379','p456'].filter(id=>!cleanupDeleted.has(id)),lines:'111c1c5f13c483f82377579d06d5ef300aa3486ab10108523f9e61f970c25edc'}
};
for(const [id,want] of Object.entries(expectedDialogues)){
  const dialogue=dialogues.find(item=>item.id===id);assert.ok(dialogue);
  assert.deepEqual(dialogue.phraseLinks,want.links,`${id} only specified links removed`);
  assert.equal(hash(dialogue.lines),want.lines,`${id} English and Japanese unchanged`);
}
assert.deepEqual(dialogues.flatMap(dialogue=>dialogue.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
console.log('S4 E17-E24 Final Package production integrity passed (41 NEW, 23 KEEP, 8 REMOVE; 64 ordered).');
