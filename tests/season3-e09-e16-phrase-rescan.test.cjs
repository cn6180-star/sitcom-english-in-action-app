'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,index)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${index+1}.json`),'utf8')));
const phrases=seasons.flatMap(season=>season.phrases);
const dialogues=seasons.flatMap(season=>season.dialogues);
const byId=new Map(phrases.map(record=>[record.id,record]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canonical=record=>Object.fromEntries(Object.keys(record).sort().map(key=>[key,record[key]]));
const expectedCounts={S03E09:20,S03E10:19,S03E11:20,S03E12:13,S03E13:15,S03E14:14,S03E15:16,S03E16:15};
const existingIds=['p289','p303','p290','p320','p305','p294','p295','p296','p298','p300','p301','p302','p345','p304','p321','p306','p308','p309'];
const newIds=Array.from({length:114},(_,index)=>`p${3301+index}`);
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3946);
assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>Number(record.id.slice(1)))),4116);
assert.equal(phrases.filter(record=>record.episode.startsWith('S03')).length,443);
assert.equal(dialogues.length,345);
assert.ok(newIds.every(id=>seasons[2].phrases.some(record=>record.id===id)),'all 114 NEW records belong to Season 3');
for(const id of ['p292','p307'])assert.ok(!byId.has(id),`${id} removed`);
for(const id of newIds){
  const record=byId.get(id);
  for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}: ${field}`);
  assert.equal(record.source,'Friends');
  assert.equal(record.exampleTranslations.length,2);
  assert.equal(record.priorityText,'★'.repeat(record.priority)+'☆'.repeat(3-record.priority));
}
const accepted=[...existingIds,...newIds].map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1))).map(canonical)),'5e8db2f5811e3a29bbdd458fc5ba23291e8cd74dbc8172196d196ec11dacdd66','132 completedRecords match the Final Package');
const sourceOrderEntries=[];
for(const [episode,count] of Object.entries(expectedCounts)){
  const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
  assert.equal(rows.length,count,`${episode} accepted count`);
  assert.deepEqual(rows.map(record=>record.sourceOrder),Array.from({length:count},(_,index)=>index+1),`${episode} sourceOrder is unique and gapless`);
  sourceOrderEntries.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(sourceOrderEntries.length,132);
assert.equal(hash(sourceOrderEntries),'9ba06a3b14ffd884e940fdb8be48320b84013cf13f54cae4592b55b8418a6227','Package sourceOrder map');
assert.ok(!seasons[2].dialogues.some(dialogue=>dialogue.id==='d33'),'old S3 Dialogue retired by Notion rebuild');
assert.ok(dialogues.every(d=>!d.phraseLinks.includes('p307')),'removed Phrase has no remaining reference');
assert.equal(hash(seasons[2].dialogues),'5bd7e0d24b570753f2fa3fb0d20f4cc80338149e257dc4e2ad6d6003b185cb17','S3 Dialogue body and references');
for(const dialogue of dialogues)for(const id of dialogue.phraseLinks)assert.ok(byId.has(id),`${dialogue.id}/${id} dangling link`);
for(const [season,want] of Object.entries({
  1:'174b7916490b746ac20fd3adc80127d1662a4adab92f0985d05982c44d57677d',
  2:'3e24c7d0b0f05189624a59b9055c7a56736271887f0d741d99ce9e3693a65530',
  4:'1244d13ba824bf70598771799ce971ddb720b454570a84a12c810c4317d93533',
  5:'c2ccce601e26840eee450c7ec945b6c1ff36c24e9ccf09676e3978eb7236f069',
  6:'54116541983468bc96a8b28fa1d5f53595b617fc0f6ff2f578afc4c28b5e9d6b',
  7:'6c6ee278b1b408a3d64166cb38431966705451276b354d141b1bc2d9fafc4f33',
  8:'dbf450b59e5d4425eefd16791ce9cc2e0767a8e4edceeab60efa1cfe1c286914',
  9:'93e26ecf81c33960b49ebdafa95f8135f5af519963d1b28fcdcd0f0a8ccc894d',
}))assert.equal(hash(seasons[Number(season)-1]),want,`Season ${season} frozen`);

console.log('S3 E09-E16 Final Package: 114 NEW / 2 UPDATE / 11 KEEP / 5 MOVE / 2 REMOVE, 132 sourceOrder entries, frozen seasons and links PASS');
