'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {context:c,phrases,dialogues,rows}=require('../tools/audit-dialogue-highlight.cjs');
const baseline=require('./fixtures/friends-s2-dialogue-production-baseline.json');
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const byId=new Map(dialogues.map(d=>[d.id,d])),phraseById=new Map(phrases.map(p=>[p.id,p]));

assert.equal(phrases.length,4062);assert.equal(phraseById.size,4062);
assert.equal(dialogues.length,334);assert.equal(byId.size,334);assert.equal(Math.max(...dialogues.filter(d=>/^d\d+$/.test(d.id)).map(d=>+d.id.slice(1))),214);
assert.equal(dialogues.filter(d=>d.season==='Season 2').length,81);assert.equal(dialogues.filter(d=>d.season==='Season 1').length,108);
for(const [file,want] of Object.entries(baseline.phraseHashes))assert.equal(hash(JSON.parse(fs.readFileSync(file,'utf8')).phrases),want,'all Phrase fields and physical order unchanged');
for(const id of ['d12','d13','d16','d20','d23','d24','d209','d213'])assert.ok(!byId.has(id),'retired Dialogue remains absent '+id);
for(const id of ['d205','d206','d207','d208','d210','d211','d212','d214'])assert.equal(byId.get(id)?.season,'Season 2','curated S2 survivor remains '+id);

const exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));assert.equal(Object.keys(exclusions).length,0);
let fullAuto=0,fullExplicit=0,excluded=0;
for(const dialogue of dialogues){
  assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'broken link'));
}
for(const row of rows){
  if(exclusions[row.dialogueId+'|'+row.phraseId]){assert.equal(row.ranges.length,0);excluded++;}
  else{assert.ok(row.ranges.length,'unexplained miss '+row.dialogueId+'/'+row.phraseId);if(row.ranges[0].source==='matcher')fullAuto++;else fullExplicit++;}
}
assert.equal(rows.length,2652);assert.deepEqual({fullAuto,fullExplicit,excluded},{fullAuto:2430,fullExplicit:222,excluded:0});
Object.keys(exclusions).forEach(key=>assert.ok(rows.some(row=>row.dialogueId+'|'+row.phraseId===key),'no stale exclusion'));
const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c));assert.ok(!Object.keys(hints).some(key=>key.startsWith('S2-SEED-')));
assert.deepEqual(hints['d208|p2229'],{dialogueId:'d208',phraseId:'p2229',candidateLineIndex:9,highlightRanges:[{matchText:'pass along your message'}],overrideMatcher:true});

const app=fs.readFileSync('js/app.js','utf8'),progress={DIALOGUES:dialogues,learnedDialogueIds:()=>['d12','d13','d16','d20','d23','d24','d209','d213','d205'],getCompletionPercent:(n,t)=>Math.round(n/t*100)};
vm.createContext(progress);vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith('function dialogueProgressFor(')),progress);
assert.deepEqual(plain(progress.dialogueProgressFor()),{learned:1,total:334,remaining:333,percent:0});

console.log('Dialogue production continuity: 334 total / S1 108 / S2 81; existing S2 survivors retained; 2,376 links covered, 3 approved exclusions; Phrase snapshots PASS');
