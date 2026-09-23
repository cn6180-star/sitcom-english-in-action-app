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

assert.equal(phrases.length,3669);
assert.equal(byId.size,3669,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>Number(record.id.slice(1)))),3739);
assert.equal(phrases.filter(record=>record.episode.startsWith('S03')).length,443);
assert.equal(dialogues.length,326);
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
assert.equal(seasons[2].dialogues.find(dialogue=>dialogue.id==='d33').phraseLinks.includes('p307'),false);
assert.equal(hash(seasons[2].dialogues),'4015f87c59e3920f01b9700ed7ee55616762a7d5ec3d029a6c08815a6561ab4d','S3 Dialogue body and references');
for(const dialogue of dialogues)for(const id of dialogue.phraseLinks)assert.ok(byId.has(id),`${dialogue.id}/${id} dangling link`);
for(const [season,want] of Object.entries({
  1:'174b7916490b746ac20fd3adc80127d1662a4adab92f0985d05982c44d57677d',
  2:'70d958eaf81e468592ee7dba639f61d5d87c85bf287f54414df1f7c6cb09a16d',
  4:'2ff6ce2e8e485a432e01649af383414d1423c8b3a0256df3f647688de0934dc0',
  5:'950cf4ab2f1d102981e997870c0ab920ee7597a74a796dab1202c331ff658cf9',
  6:'68f1c1c80a608be7642644cdf29775c00cdec646f90fcb03774586a296e1c4f1',
  7:'5a083e07e26c1f97cf45013b7584050f3cab29ae7034ca3d613d1a9fe519979c',
  8:'ac577a6a11624be4222898547bad61522cea3c2b99e4075357d7bb6069a78128',
  9:'9a83a0c2e15e5d5dd3ef20061284920e0334d4c602e5e8868d4823f8b9e03406',
}))assert.equal(hash(seasons[Number(season)-1]),want,`Season ${season} frozen`);

console.log('S3 E09-E16 Final Package: 114 NEW / 2 UPDATE / 11 KEEP / 5 MOVE / 2 REMOVE, 132 sourceOrder entries, frozen seasons and links PASS');
