'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues);
const byId=new Map(phrases.map(p=>[p.id,p]));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const newIds=Array.from({length:44},(_,i)=>`p${3606+i}`);
const existingIds=['p386','p389','p390','p393','p394','p396','p397','p398','p399','p400','p1095','p401','p1096','p402','p404','p403','p405','p407','p408','p409','p412','p413','p414','p415','p416','p417','p418','p419','p421','p423','p1097','p425','p426','p427','p429'];
const episodeCounts={S04E09:11,S04E10:13,S04E11:8,S04E12:17,S04E13:10,S04E14:4,S04E15:6,S04E16:10};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3707);
assert.equal(byId.size,3707,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),3781);
assert.equal(dialogues.length,326);
assert.ok(newIds.every(id=>seasons[3].phrases.some(p=>p.id===id)),'all 44 NEW records in Season 4');
for(const id of newIds){const p=byId.get(id);for(const key of required)assert.ok(Object.hasOwn(p,key),`${id}: ${key}`);assert.equal(p.source,'Friends');assert.equal(p.exampleTranslations.length,2);assert.equal(p.priorityText,'★'.repeat(p.priority)+'☆'.repeat(3-p.priority));}
const accepted=[...existingIds,...newIds].map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));assert.equal(accepted.length,79);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'6f710f3cf86d5faa6c565c14275f2ecfee3f07a94f2f90afa07f4a2fc114a33b','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} gapless sourceOrder`);
 ordered.push(...rows.map(p=>[p.id,p.episode,p.sourceOrder]));
}
assert.equal(ordered.length,79);
assert.equal(hash(ordered),'12a2ee3a6ff92e58f60b91594e02945cb0dba2cfad988258ce5a8a763069c9fa','Final Package episode/sourceOrder mapping');
for(const [id,sourceOrder] of [['p389',1],['p390',2]]){
 const p=byId.get(id);assert.equal(p.episode,'S04E10');assert.equal(p.sourceOrder,sourceOrder);
 assert.equal(phrases.filter(r=>r.id===id).length,1);assert.equal(phrases.filter(r=>r.episode==='S04E09'&&r.id===id).length,0);
}
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
console.log('S4 E09-E16 Final Package production integrity passed (44 NEW, 33 KEEP, 2 MOVE; 79 ordered).');
