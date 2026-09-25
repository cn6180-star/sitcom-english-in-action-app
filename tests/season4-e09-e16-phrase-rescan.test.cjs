'use strict';
const cleanupDeleted=new Set(["p423","p470","p502","p536","p557","p488","p542","p500","p570","p604","p637","p672","p679","p683","p696","p753","p3920","p3923","p3933","p841","p858","p887","p921","p957","p970","p1064","p1074","p4221","p4185","p4237","p503","p4022","p4029","p483","p4229","p4166","p4169"]);
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
const newIds=Array.from({length:44},(_,i)=>`p${3606+i}`).filter(id=>!cleanupDeleted.has(id));
const existingIds=['p386','p389','p390','p393','p394','p396','p397','p398','p399','p400','p1095','p401','p1096','p402','p404','p403','p405','p407','p408','p409','p412','p413','p414','p415','p416','p417','p418','p419','p421','p423','p1097','p425','p426','p427','p429'].filter(id=>!cleanupDeleted.has(id));
const episodeCounts={S04E09:11,S04E10:13,S04E11:8,S04E12:17,S04E13:10,S04E14:4,S04E15:6,S04E16:9};
const expectedSourceRanks={"S04E09":[1,2,3,4,5,6,7,8,9,10,11],"S04E10":[1,2,3,4,5,6,7,8,9,10,11,12,13],"S04E11":[1,2,3,4,5,6,7,8],"S04E12":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"S04E13":[1,2,3,4,5,6,7,8,9,10],"S04E14":[1,2,3,4],"S04E15":[1,2,3,4,5,6],"S04E16":[2,3,4,5,6,7,8,9,10]};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3946);
assert.equal(byId.size,3946,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4116);
assert.equal(dialogues.length,326);
assert.ok(newIds.every(id=>seasons[3].phrases.some(p=>p.id===id)),'all 44 NEW records in Season 4');
for(const id of newIds){const p=byId.get(id);for(const key of required)assert.ok(Object.hasOwn(p,key),`${id}: ${key}`);assert.equal(p.source,'Friends');assert.equal(p.exampleTranslations.length,2);assert.equal(p.priorityText,'★'.repeat(p.priority)+'☆'.repeat(3-p.priority));}
const accepted=[...existingIds,...newIds].filter(id=>!cleanupDeleted.has(id)).map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));assert.equal(accepted.length,78);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'4a6ed95aa9a9b94925029e61f53ddcceb93c53eb0f53e04a07c436da0f12e0e0','Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(episodeCounts)){
 const rows=phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),expectedSourceRanks[episode],`${episode} gapless sourceOrder`);
 ordered.push(...rows.map(p=>[p.id,p.episode,p.sourceOrder]));
}
assert.equal(ordered.length,78);
assert.equal(hash(ordered),'d94650a4b0779f1cd5617539d4d8ec478ab49c4fdab3fd2b2746183e60cb9f46','Final Package episode/sourceOrder mapping');
for(const [id,sourceOrder] of [['p389',1],['p390',2]]){
 const p=byId.get(id);assert.equal(p.episode,'S04E10');assert.equal(p.sourceOrder,sourceOrder);
 assert.equal(phrases.filter(r=>r.id===id).length,1);assert.equal(phrases.filter(r=>r.episode==='S04E09'&&r.id===id).length,0);
}
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
console.log('S4 E09-E16 Final Package production integrity passed (44 NEW, 33 KEEP, 2 MOVE; 79 ordered).');
