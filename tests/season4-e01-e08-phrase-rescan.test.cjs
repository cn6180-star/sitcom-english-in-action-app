'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues);
const byId=new Map(phrases.map(p=>[p.id,p]));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const newIds=Array.from({length:66},(_,i)=>`p${3540+i}`);
const existingIds=['p347','p348','p349','p351','p352','p353','p354','p355','p357','p358','p360','p361','p362','p363','p364','p365','p366','p1094','p371','p372','p374','p375','p379','p380','p381','p384'];
const episodeCounts={S04E01:16,S04E02:9,S04E03:20,S04E04:10,S04E05:12,S04E06:7,S04E07:10,S04E08:8};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3810);
assert.equal(byId.size,3810,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),3908);
assert.equal(dialogues.length,326);
assert.ok(newIds.every(id=>seasons[3].phrases.some(p=>p.id===id)),'66 NEW IDs in Season 4');
for(const id of newIds){const p=byId.get(id);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}: ${field}`);assert.equal(p.source,'Friends');assert.equal(p.exampleTranslations.length,2);assert.equal(p.priorityText,'★'.repeat(p.priority)+'☆'.repeat(3-p.priority));}
const accepted=[...existingIds,...newIds].map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));
assert.equal(accepted.length,92);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'52d16222efeddd6465c94d1538a5954cf216af4ab0e71062b5c59b0b4d71c3c7','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,episode+' count');
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:count},(_,i)=>i+1),episode+' gapless unique sourceOrder');
 ordered.push(...rows.map(p=>[p.id,p.episode,p.sourceOrder]));
}
assert.equal(ordered.length,92);
assert.equal(hash(ordered),'78b5db3168f2cf77e1c8826e62b6beaf86d6886c69ae6152287a17975575af02','Final Package sourceOrder mapping');
for(const id of ['p381','p384']){assert.equal(byId.get(id).episode,'S04E07');assert.equal(seasons[3].phrases.filter(p=>p.id===id).length,1);}
for(const id of ['p350','p356','p359'])assert.ok(!byId.has(id),`${id} removed`);
const d60=dialogues.find(d=>d.id==='d60');
assert.deepEqual(d60.phraseLinks,['p423','p398','p381','p390','p355']);
assert.equal(hash(d60.lines),'7742e2ee734ae6ccbd3aaf3e365abbadb39fa2852926abc41e8cd0874d472177','d60 English/Japanese unchanged');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
console.log('S4 E01-E08 Final Package production integrity passed (66 NEW, 24 KEEP, 2 MOVE, 3 REMOVE; 92 ordered).');
