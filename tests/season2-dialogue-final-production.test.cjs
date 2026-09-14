'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {context:c,phrases,dialogues,rows}=require('../tools/audit-dialogue-highlight.cjs');
const baseline=require('./fixtures/friends-s2-dialogue-production-baseline.json');
const draft=require('./fixtures/friends-s2-dialogue-draft-compatibility.json');
const translations=require('./fixtures/friends-s2-dialogue-jp.json');
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const byId=new Map(dialogues.map(d=>[d.id,d])),phraseById=new Map(phrases.map(p=>[p.id,p]));
assert.equal(phrases.length,3106);assert.equal(phraseById.size,3106);
assert.equal(dialogues.length,208);assert.equal(byId.size,208);assert.equal(Math.max(...dialogues.map(d=>+d.id.slice(1))),214);
assert.equal(dialogues.filter(d=>d.season==='Season 2').length,20);assert.equal(dialogues.filter(d=>d.season==='Season 1').length,51);
for(const [file,want] of Object.entries(baseline.phraseHashes))assert.equal(hash(JSON.parse(fs.readFileSync(file)).phrases),want,'all Phrase fields and physical order unchanged');
const original=new Map(baseline.originalS2.map(d=>[d.id,d]));
const counts={NEW:0,REWRITE:0,MINOR_EDIT:0,DROP:0,NONE:0};
for(const [id,action] of Object.entries(baseline.actions)){
 counts[action.action]++;
 if(action.action==='DROP'){assert.ok(!byId.has(id));continue;}
 assert.ok(byId.has(id));assert.deepEqual(byId.get(id).phraseLinks,action.links);
 if(action.action==='NONE')assert.deepEqual(byId.get(id),original.get(id),'KEEP complete record unchanged');
}
for(const [id,want] of Object.entries(baseline.dialogueHashes)){
 if(baseline.actions[id]&&baseline.actions[id].action!=='NONE')continue;
 assert.equal(hash(byId.get(id)),want,'unrelated Dialogue and KEEP unchanged '+id);
}
assert.deepEqual(Object.keys(baseline.mapping),draft.drafts.filter(d=>d.id.startsWith('S2-SEED-')).map(d=>d.id));
assert.deepEqual(Object.values(baseline.mapping),Array.from({length:10},(_,i)=>'d'+(205+i)));
let compatible=0,auto=0,existing=0,added=0;
for(const f of draft.drafts){
 const id=baseline.mapping[f.id]||f.id,d=byId.get(id),fresh=!!baseline.mapping[f.id],action=baseline.actions[id];
 if(fresh)counts.NEW++;
 assert.ok(d);assert.equal(d.season,'Season 2');
 assert.deepEqual(Object.keys(d).sort(),['id','season','title','category','lines','phraseLinks'].sort());
 assert.deepEqual(d.lines.map(l=>l.slice(0,2)),f.lines,'exact Draft English '+id);
 assert.deepEqual(d.phraseLinks,f.phraseLinks,'exact final links '+id);
 const prior=original.get(id);
 if(!fresh){assert.equal(d.title,prior.title);assert.equal(d.category,prior.category);}
 else{assert.equal(d.title,translations[f.id].title);assert.equal(d.category,translations[f.id].category);assert.equal(dialogues.filter(x=>x.title===d.title).length,1);}
 d.lines.forEach((line,i)=>{
  assert.equal(line.length,3);assert.ok(line[2].trim());
  if(action?.action==='MINOR_EDIT'&&!action.turns.includes(i+1))assert.deepEqual(line,prior.lines[i],'untouched English/JP '+id+'/'+(i+1));
  else assert.equal(line[2],action?.action==='MINOR_EDIT'?translations[f.id].jp[i+1]:translations[f.id].jp[i]);
 });
 assert.equal(dialogues.filter(x=>JSON.stringify(x.lines.map(l=>l[1]))===JSON.stringify(d.lines.map(l=>l[1]))).length,1,'no duplicate new/revised body');
 const matches=plain(c.dialoguePhraseMatchResults(d,d.phraseLinks.map(p=>phraseById.get(p))));
 const selected=d.lines.flatMap((_,i)=>plain(c.selectedDialogueMatches(matches.filter(m=>m.lineIndex===i))));
 for(const r of f.realizations){
  const ranges=selected.filter(m=>m.phraseId===r.phraseId&&m.lineIndex===r.turn-1);assert.ok(ranges.length,'required selected range '+id+'/'+r.phraseId);
  ranges.forEach(m=>{const text=d.lines[m.lineIndex][1];assert.equal(text.slice(m.start,m.end),m.text);assert.ok(!(/[A-Za-z]/.test(text[m.end-1]||'')&&/[A-Za-z]/.test(text[m.end]||'')),'no suffix outside blank');});
  compatible++;if(ranges[0].source==='matcher')auto++;else if(r.phraseId==='p2229')added++;else existing++;
  if(r.phraseId==='p199')assert.deepEqual(ranges.map(r=>r.text),['clobbered']);
  if(r.phraseId==='p2229')assert.deepEqual(ranges.map(r=>r.text),['pass along your message']);
 }
}
assert.deepEqual(counts,{NEW:10,REWRITE:3,MINOR_EDIT:4,DROP:6,NONE:3});
assert.deepEqual({compatible,auto,existing,added},{compatible:45,auto:42,existing:2,added:1});
const exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));
assert.equal(Object.keys(exclusions).length,7);
let fullAuto=0,fullExplicit=0,excluded=0;
for(const d of dialogues){
 assert.equal(new Set(d.phraseLinks).size,d.phraseLinks.length);
 d.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'broken link'));
 const results=plain(c.dialoguePhraseMatchResults(d,d.phraseLinks.map(id=>phraseById.get(id))));
 for(let i=0;i<d.lines.length;i++){
  const selected=plain(c.selectedDialogueMatches(results.filter(m=>m.lineIndex===i)));
  selected.forEach((m,n)=>{assert.equal(d.lines[i][1].slice(m.start,m.end),m.text);assert.ok(m.start>=0&&m.end>m.start&&m.end<=d.lines[i][1].length);if(n)assert.ok(selected[n-1].end<=m.start);});
 }
}
for(const r of rows){
 if(exclusions[r.dialogueId+'|'+r.phraseId]){assert.equal(r.ranges.length,0);excluded++;}
 else{assert.ok(r.ranges.length,'unexplained miss '+r.dialogueId+'/'+r.phraseId);if(r.ranges[0].source==='matcher')fullAuto++;else fullExplicit++;}
}
assert.equal(rows.length,1012);assert.deepEqual({fullAuto,fullExplicit,excluded},{fullAuto:850,fullExplicit:155,excluded:7});
Object.keys(exclusions).forEach(key=>assert.ok(rows.some(r=>r.dialogueId+'|'+r.phraseId===key),'no stale exclusion'));
const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c));assert.ok(!Object.keys(hints).some(k=>k.startsWith('S2-SEED-')));
assert.equal(hints['d208|p2229'].dialogueId,'d208');
// Saved learned IDs from deleted dialogues never inflate progress or crash lookup.
const app=fs.readFileSync('js/app.js','utf8'),progress={DIALOGUES:dialogues,learnedDialogueIds:()=>['d12','d13','d16','d20','d23','d24','d205'],getCompletionPercent:(n,t)=>Math.round(n/t*100)};
vm.createContext(progress);vm.runInContext(app.split(/\r?\n/).find(l=>l.startsWith('function dialogueProgressFor(')),progress);
assert.deepEqual(plain(progress.dialogueProgressFor()),{learned:1,total:208,remaining:207,percent:0});
console.log('S2 production: 208 / S2 20; 10 NEW, 3 REWRITE, 4 MINOR, 6 DROP, 3 KEEP; exact English/JP/links; 45/45; all 1012 links covered, 7 approved exclusions; Phrase/S1 unchanged PASS');
