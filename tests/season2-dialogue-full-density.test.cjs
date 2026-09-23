'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const fixture=require('./fixtures/friends-s2-dialogue-density-final.json');
const phraseBaseline=require('./fixtures/friends-s2-dialogue-production-baseline.json');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`,'utf8')));
const s1=sets[0].dialogues,s2=sets[1].dialogues,byId=new Map(dialogues.map(d=>[d.id,d]));
const phraseById=new Map(phrases.map(p=>[p.id,p])),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value)),exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));

assert.equal(phrases.length,3707);assert.equal(phraseById.size,3707);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S01')).length,1623);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S02')).length,791);
assert.equal(dialogues.length,326);assert.equal(new Set(dialogues.map(d=>d.id)).size,326);
assert.equal(s1.length,108);assert.equal(s2.length,81);
for(const [file,want] of Object.entries(phraseBaseline.phraseHashes))assert.equal(hash(JSON.parse(fs.readFileSync(file,'utf8')).phrases),want,'Phrase data unchanged '+file);
assert.equal(hash(s2),'beef02b0404a204f37897ad240840359bbd4215c82156adf02255e6fd72346fe','Notion S2 production snapshot');

const legacyIds=new Set(fixture.expected.map(item=>item.id)),legacy=s2.filter(d=>legacyIds.has(d.id));
assert.deepEqual(legacy.map(d=>d.id).sort(),fixture.expected.map(item=>item.id).sort(),'existing S2 18 retained');
for(const expected of fixture.expected){
  const dialogue=byId.get(expected.id);assert.equal(hash({title:dialogue.title,lines:dialogue.lines,phraseLinks:dialogue.phraseLinks}),expected.hash,'existing S2 unchanged '+expected.id);
}
fixture.donors.forEach(id=>assert.ok(!byId.has(id),'density donor remains retired '+id));
const newIds=Array.from({length:63},(_,i)=>`S2-NEW-${String(i+1).padStart(2,'0')}`);
assert.deepEqual(s2.filter(d=>d.id.startsWith('S2-NEW-')).map(d=>d.id),newIds);
assert.equal(byId.get('S2-NEW-61').phraseLinks.length,6);assert.equal(byId.get('S2-NEW-62').phraseLinks.length,7);assert.equal(byId.get('S2-NEW-63').phraseLinks.length,6);
assert.equal(byId.get('S2-NEW-12').lines[2][1],'Why not? I just want to get closure.');

for(const dialogue of s2){
  assert.equal(dialogue.season,'Season 2');assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'target Phrase exists '+dialogue.id+'/'+id));
  dialogue.lines.forEach(line=>{assert.equal(line.length,3);assert.ok(['A','B'].includes(line[0]));assert.ok(line[1].trim());assert.ok(line[2].trim());});
}
assert.equal(s2.reduce((sum,d)=>sum+d.phraseLinks.length,0),641);
let auto=0,explicit=0,partial=0;
for(const dialogue of s2){
  const results=plain(c.dialoguePhraseMatchResults(dialogue,dialogue.phraseLinks.map(id=>phraseById.get(id))));
  for(const id of dialogue.phraseLinks){
    const ranges=results.filter(range=>range.phraseId===id),key=dialogue.id+'|'+id;
    if(exclusions[key]){assert.equal(ranges.length,0);continue;}
    assert.ok(ranges.length,'unresolved S2 highlight '+key);
    if(ranges[0].source==='matcher')auto++;else explicit++;
    for(const range of ranges){const text=dialogue.lines[range.lineIndex][1],phrase=phraseById.get(id);assert.equal(text.slice(range.start,range.end),range.text);if(!/^-/.test(phrase.phrase)&&(/[A-Za-z]/.test(text[range.start-1]||'')||/[A-Za-z]/.test(text[range.end]||'')))partial++;}
  }
}
assert.deepEqual({auto,explicit,partial},{auto:590,explicit:51,partial:0});
const sourceOrder=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(hash(sourceOrder.map(p=>[p.id,p.episode,p.sourceOrder])),fixture.hashes.sourceOrder,'Phrase sourceOrder unchanged');

console.log('S2 Notion Dialogue sync: existing 18 retained + 63 added, 641 links, exact snapshot, A/B-only, Highlight + Blank ranges PASS');
