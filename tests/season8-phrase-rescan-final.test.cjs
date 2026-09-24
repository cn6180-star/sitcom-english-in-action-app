'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const seasons=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const phrases=seasons.flatMap(s=>s.phrases),dialogues=seasons.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const s8=seasons[7],hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canon=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const counts={S08E01:7,S08E02:2,S08E03:8,S08E04:7,S08E05:10,S08E06:5,S08E07:8,S08E08:5,S08E09:10,S08E10:4,S08E11:7,S08E12:5,S08E13:9,S08E14:8,S08E15:10,S08E16:5,S08E17:9,S08E18:7,S08E19:5,S08E20:7,S08E21:5,S08E22:9,S08E23:9,S08E24:4};
const removed=['p873','p893','p907','p943','p962'];
const newIds=Array.from({length:63},(_,i)=>`p${3989+i}`);
const required=['id','phrase','meaning','scene','example1','example2','exampleTranslations','type','priorityText','priority','source','episode','frequency','register','sourceOrder'];
assert.equal(phrases.length,3924);assert.equal(byId.size,3924,'duplicate Phrase ID');
assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),4051);assert.equal(dialogues.length,326);
for(const id of removed)assert.ok(!byId.has(id),`${id} REMOVE`);
for(const id of newIds){const p=byId.get(id);assert.ok(p,`${id} NEW`);for(const field of required)assert.ok(Object.hasOwn(p,field),`${id}.${field}`);assert.equal(p.exampleTranslations.length,2);}
const accepted=s8.phrases.filter(p=>Object.hasOwn(counts,p.episode)&&Number.isInteger(p.sourceOrder));
assert.equal(accepted.length,165);assert.equal(s8.phrases.length,171);
assert.equal(hash([...accepted].sort((a,b)=>+a.id.slice(1)- +b.id.slice(1)).map(canon)),'de2ce818b614b575bf4a5091c959bfacbe643b0fa6fdbd9ccf1124b84e38450f','three Final Packages completedRecords');
for(const [episode,count] of Object.entries(counts)){
 const rows=accepted.filter(p=>p.episode===episode).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.equal(rows.length,count,`${episode} count`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),Array.from({length:count},(_,i)=>i+1),`${episode} sourceOrder unique and gapless`);
}
assert.equal(accepted.filter(p=>p.episode==='S08E23').length,9);assert.equal(accepted.filter(p=>p.episode==='S08E24').length,4);
assert.equal(hash(s8.dialogues),'267797477b360dfc0166011d61167509de2931ef4e978cabe667bacee85afdfb','exact S8 Dialogue links and bodies');
for(const [d,id] of [['d143','p873'],['d132','p893'],['d146','p907'],['d141','p943'],['d144','p962']])assert.ok(!dialogues.find(x=>x.id===d).phraseLinks.includes(id),`${d}/${id} stale link`);
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[],'no dangling Dialogue links');
const hints=fs.readFileSync(path.join(root,'js/dialogue-match-hints.js'),'utf8');
for(const id of removed)assert.ok(!new RegExp(`\\b${id}\\b`).test(hints),`${id} stale hint`);
console.log('S8 three Final Packages: 63 NEW, 0 UPDATE, 5 REMOVE, 102 KEEP, 0 MOVE; 165 sourceOrder entries PASS');
