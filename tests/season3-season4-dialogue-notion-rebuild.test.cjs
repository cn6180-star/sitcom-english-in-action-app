'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const fixture=require('./fixtures/friends-s3-s4-notion-rebuild.json');
const {context:c,rows,dialogues,phrases}=require('../tools/audit-dialogue-highlight.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const baseline=[{"season":1,"phrases":"7eff031659754f402c37703f20e68053014afc8f5a60539ba9148e5ce40ff77d","dialogues":"f5ef402dd30423b7c806d1f91b01c01b1227b5572f1883b69b153321e883cd7b"},{"season":2,"phrases":"b2d36c023588c0515844dc417706677f665595f250fb335e428b1c1976924b6d","dialogues":"cf2c9ae655aebd00b439dd726cdc43350b5904c58eb4d263259a32950a26ee47"},{"season":3,"phrases":"05da74e36b2ca45ee9623e1da443adf2f7c37aa165bab353bebf4d4dd7ba1e83","dialogues":"5bd7e0d24b570753f2fa3fb0d20f4cc80338149e257dc4e2ad6d6003b185cb17"},{"season":4,"phrases":"6feb9abf4c54b25fc340c2338a8d7eb4d14d0135a0fd828c56af32fa93491c9c","dialogues":"b774b056b753228abc954dba030b5408183a80a76d6ad46457853bdad61e9c74"},{"season":5,"phrases":"886f5b39a6ab8ca655a231f7785757360afbe8ffe2ff7d32f250a25eea992f0b","dialogues":"86b847ce9ee7bedd8ef8e7a5c63042beae49a134cd3f77d1eaa8cc618c9d37c3"},{"season":6,"phrases":"c06cc1e1b3a3df415846da90ccba2120be7874deac04daa7a26ad2e3efba31dd","dialogues":"5197c77be5ee211d7d65f818f65bdfeb5bed8fd84a989a2937ef2953313a2852"},{"season":7,"phrases":"04d30f365eb365fe0224753a852f99c352946d7067fd1511fe144e269563bb5a","dialogues":"4d8327c9452133b7be72832a6e1bd8c6df02e2dbd2b0a790b23b93693595f21f"},{"season":8,"phrases":"c0ecae77079cd044e78b0a8e893bc563ea37b42c186b220be269d3a105c6d962","dialogues":"67e42953d54ef3c6dc95a8b324b5a95165258ca4567fd51c5cd6ca9faac5f476"},{"season":9,"phrases":"5027027e6322218bd26362a722d1a7533930a5acf9f6d439e4f6b567068e4bc5","dialogues":"79df01d926e7a518142bd3b36740720f5333af8a03e6d24a5263631a086fab13"},{"season":10,"phrases":"80e2e5b31630a26bb4cc18b14467f4e90698fe0f8d5fdb1feddea441b625a36b","dialogues":"277b3437df40cc36af7f9c802d2cc48ddd67504330ef8e1f243d014d0e728f29"}];
const retired=["d25","d26","d27","d28","d29","d30","d31","d32","d33","d34","d35","d36","d37","d38","d59","d39","d40","d41","d42","d43","d44","d45","d46","d47","d48","d49","d50","d51","d52","d60","d61","d62","d63"];
const phase=process.argv.includes('--s3')?[3]:[3,4];
const hints=vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c);
const allSets=baseline.map(b=>JSON.parse(fs.readFileSync('data/season'+b.season+'.json','utf8')));
const phraseIds=new Set(allSets.flatMap(s=>s.phrases.map(p=>p.id)));
for(const b of baseline){
 const s=allSets[b.season-1];assert.equal(hash(s.phrases),b.phrases,'Phrase data frozen Season '+b.season);
 if(![3,4].includes(b.season))assert.equal(hash(s.dialogues),b.dialogues,'unrelated Dialogue data frozen Season '+b.season);
}
assert.equal(allSets.flatMap(s=>s.phrases).length,4062);
assert.equal(new Set(dialogues.map(d=>d.id)).size,dialogues.length);
for(const season of phase){
 const expected=fixture.seasons[season-3],actual=allSets[season-1].dialogues;
 assert.deepEqual(actual,expected.map(({sourceRelations,...d})=>d),'exact Notion title/category/EN/JP/relations Season '+season);
 assert.equal(actual.length,season===3?30:22);
 assert.equal(actual.reduce((n,d)=>n+d.phraseLinks.length,0),season===3?238:173);
 const distribution={};actual.forEach(d=>distribution[d.phraseLinks.length]=(distribution[d.phraseLinks.length]||0)+1);
 assert.deepEqual(distribution,season===3?{7:3,8:26,9:1}:{6:1,7:1,8:20});
 assert.deepEqual(actual.map(d=>d.id),Array.from({length:actual.length},(_,i)=>'S'+season+'-NEW-'+String(i+1).padStart(2,'0')));
 for(const d of actual){
  assert.ok(d.title&&d.category&&d.lines.length);assert.equal(d.season,'Season '+season);
  assert.equal(new Set(d.phraseLinks).size,d.phraseLinks.length);
  d.lines.forEach(l=>{assert.equal(l.length,3);assert.ok(['A','B'].includes(l[0]));assert.ok(l[1].trim()&&l[2].trim())});
  d.phraseLinks.forEach(id=>{assert.ok(phraseIds.has(id),'no orphan '+d.id+'/'+id);const r=rows.find(r=>r.dialogueId===d.id&&r.phraseId===id);assert.ok(r.ranges.length,'highlight '+d.id+'/'+id);r.ranges.forEach(m=>{const text=d.lines[m.lineIndex][1];assert.equal(text.slice(m.start,m.end),m.text);assert.ok(!/[A-Za-z]/.test(text[m.start-1]||'')&&!/[A-Za-z]/.test(text[m.end]||''),'full-token '+d.id+'/'+id+'/'+m.text)})});
  const matches=c.dialoguePhraseMatchResults(d,d.phraseLinks.map(id=>phrases.find(p=>p.id===id)));
  d.lines.forEach((l,i)=>{const selected=c.selectedDialogueMatches(matches.filter(m=>m.lineIndex===i));let pos=0,restored='',blank='';selected.forEach(m=>{assert.ok(m.start>=pos,'non-overlap');restored+=l[1].slice(pos,m.start)+m.text;blank+=l[1].slice(pos,m.start)+'_____';pos=m.end});restored+=l[1].slice(pos);blank+=l[1].slice(pos);assert.equal(restored,l[1]);if(selected.length)assert.notEqual(blank,l[1]);});
 }
}
if(phase.length===2){assert.equal(dialogues.length,334);retired.forEach(id=>{assert.ok(!dialogues.some(d=>d.id===id),'retired '+id);assert.ok(!Object.keys(hints).some(k=>k.startsWith(id+'|')),'stale hint '+id)})}
console.log('Notion S3/S4 rebuild: exact source fidelity, counts, relations, A/B, Highlight/Blank and frozen data PASS ('+phase.join(',')+')');
