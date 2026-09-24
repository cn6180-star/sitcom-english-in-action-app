'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const s7=seasons[6],hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const counts={S07E01:5,S07E02:4,S07E03:6,S07E04:3,S07E05:6,S07E06:6,S07E07:5,S07E08:4,S07E09:8,S07E10:6,S07E11:10,S07E12:4,S07E13:9,S07E14:4,S07E15:7,S07E16:9,S07E17:5,S07E18:5,S07E19:10,S07E20:5,S07E21:4,S07E22:6,S07E23:4,S07E24:6};
const removed=['p763','p762','p764','p768','p769','p771','p772','p773','p778','p767','p779','p795','p799','p814','p818','p819','p821','p822','p823','p825','p828','p833','p837','p838'];
const newIds=Array.from({length:80},(_,i)=>`p${3909+i}`);
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
assert.equal(phrases.length,3866);assert.equal(byId.size,3866,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),3988);assert.equal(dialogues.length,326);
for(const id of removed)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){const p=byId.get(id);assert.ok(p,`${id} NEW`);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}.${field}`);assert.equal(p.exampleTranslations.length,2);}
const accepted=s7.phrases.filter(p=>Object.hasOwn(counts,p.episode)&&Number.isInteger(p.sourceOrder));
assert.equal(accepted.length,141);assert.equal(s7.phrases.length,148);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'bd3c713cb458691e86f75116c3fd7416fcac99fbb7613b5818a959f4114d64c3','three Final Packages completedRecords');
for(const [episode,count] of Object.entries(counts)){
 const rows=accepted.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} sourceOrder unique and gapless`);
}
assert.equal(byId.get('p781').episode,'S07E07');assert.equal(byId.get('p781').sourceOrder,2);
assert.equal(byId.get('p858').episode,'S07E21');assert.equal(byId.get('p858').sourceOrder,3);
assert.equal(accepted.filter(p=>p.episode==='S07E23').length,4);assert.equal(accepted.filter(p=>p.episode==='S07E24').length,6);
assert.equal(hash(s7.dialogues),'5aa571032d2b7a9139722d2fdea78428c5e8d1e72a7e93f0d2fd8453321a05cb','exact S7 Dialogue links and bodies');
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
const hints=fs.readFileSync(path.join(root,'js/dialogue-match-hints.js'),'utf8');
for(const id of ['p767','p821','p823'])assert.ok(!new RegExp(`\\b${id}\\b`).test(hints),`${id} stale hint`);
console.log('S7 three Final Packages: 80 NEW, 0 UPDATE, 24 REMOVE, 59 KEEP, 2 MOVE; 141 sourceOrder entries PASS');
