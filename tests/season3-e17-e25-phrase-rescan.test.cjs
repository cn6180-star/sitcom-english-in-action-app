'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues);
const byId=new Map(phrases.map(p=>[p.id,p]));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const newIds=Array.from({length:125},(_,i)=>`p${3415+i}`);
const existingIds=['p310','p311','p313','p318','p315','p316','p333','p323','p319','p322','p324','p325','p326','p327','p329','p330','p331','p332','p336','p338','p339','p340','p341','p343','p346'];
const expectedCounts={S03E17:24,S03E18:17,S03E19:15,S03E20:15,S03E21:7,S03E22:22,S03E23:15,S03E24:18,S03E25:17};
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];

assert.equal(phrases.length,3707);
assert.equal(byId.size,3707,'duplicate Phrase IDs');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),3781);
assert.equal(phrases.filter(p=>p.episode.startsWith('S03')).length,443);
assert.equal(dialogues.length,326);
assert.ok(newIds.every(id=>seasons[2].phrases.some(p=>p.id===id)),'125 NEW records in Season 3');
for(const id of newIds){
 const p=byId.get(id);
 for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}: ${field}`);
 assert.equal(p.source,'Friends');
 assert.equal(p.exampleTranslations.length,2);
 assert.equal(p.priorityText,'★'.repeat(p.priority)+'☆'.repeat(3-p.priority));
}
const accepted=[...existingIds,...newIds].map(id=>byId.get(id));
assert.ok(accepted.every(Boolean));
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'6e256542cad7406df78ef0ccccb06d5d2525be060c2328cc5dbc68c92c8470ae','150 Final Package completedRecords');
const ordered=[];
for(const [episode,count] of Object.entries(expectedCounts)){
 const rows=phrases.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,episode);
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:count},(_,i)=>i+1),episode+' gapless sourceOrder');
 ordered.push(...rows.map(p=>[p.id,p.episode,p.sourceOrder]));
}
assert.equal(ordered.length,150);
assert.equal(hash(ordered),'eb98301339e3d1dfb2b4fc352b9922833a178e923cb6d58a1df8649bf74d4bdc','Final Package sourceOrder mapping');
assert.equal(byId.get('p333').episode,'S03E18');
assert.equal(byId.get('p333').sourceOrder,11);
assert.ok(!byId.has('p342'));
const d32=dialogues.find(d=>d.id==='d32');
assert.deepEqual(d32.phraseLinks,['p308','p333','p290','p306','p310']);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue link');
console.log('S3 E17-E25 Final Package production integrity passed (125 NEW, 4 UPDATE, 20 KEEP, 1 MOVE, 1 REMOVE; 150 ordered).');
