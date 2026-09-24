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
const newIds=Array.from({length:40},(_,i)=>`p${3782+i}`);
const keepIds=['p622','p587','p578','p593','p602','p599','p566','p619','p611','p568','p617','p597','p565','p610','p581','p607','p567','p572','p573','p579','p569','p609','p571','p608','p577','p616','p580','p615','p589','p570','p600','p574','p604','p596','p595'];
const removedIds=['p620','p612','p598'];
const episodeCounts={S05E17:7,S05E18:9,S05E19:6,S05E20:13,S05E21:11,S05E22:13,S05E23:11,S05E24:5};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3866);
assert.equal(byId.size,3866,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(record=>+record.id.slice(1))),3988);
assert.equal(dialogues.length,326);
for(const id of removedIds)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){
 const record=byId.get(id);assert.ok(record,`${id} NEW`);
 for(const field of required)assert.ok(Object.hasOwn(record,field),`${id}.${field}`);
 assert.equal(record.source,'Friends');assert.equal(record.exampleTranslations.length,2);
}
const accepted=[...newIds,...keepIds].map(id=>byId.get(id));
assert.equal(accepted.length,75);assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'435c580230a596bd169de4365da471866103e51e94572e03aeb1b86c2b4e89a0','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(record=>record.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(record=>record.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} sourceOrder unique and gapless`);
 ordered.push(...rows.map(record=>[record.id,record.episode,record.sourceOrder]));
}
assert.equal(ordered.length,75);
assert.equal(hash(ordered),'b2e37c41cbf7918f5700e46da377041da2149aa57ec758eb3d635f0b862c9f83','Final Package sourceOrder');
const d79=dialogues.find(d=>d.id==='d79');assert.ok(d79);
assert.deepEqual(d79.phraseLinks,['p600','p609','p606','p610','p622']);
assert.equal(hash(d79.lines),'73d206e76d133440b79fe56e4536b64fd6a109062dbafce31cdbdd5cc88a6a1c','d79 English and Japanese unchanged');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue references');
console.log('S5 E17-E24 Final Package: 40 NEW, 35 KEEP, 3 REMOVE; 75 sourceOrder entries PASS');
