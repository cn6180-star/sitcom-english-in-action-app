'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const fixture=require('./fixtures/friends-s1-dialogue-density-final.json');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`,'utf8')));
const s1=sets[0].dialogues,s2=sets[1].dialogues,byId=new Map(dialogues.map(d=>[d.id,d]));
const phraseById=new Map(phrases.map(p=>[p.id,p])),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value)),exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));

assert.equal(phrases.length,3924);assert.equal(phraseById.size,3924);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S01')).length,1623);
assert.equal(dialogues.length,326);assert.equal(new Set(dialogues.map(d=>d.id)).size,326);
assert.equal(s1.length,108);assert.equal(s2.length,81);
const expectedIds=[...fixture.expected.map(item=>item.id),...Array.from({length:65},(_,i)=>`S1-NEW-${String(i+1).padStart(2,'0')}`)].sort();
assert.deepEqual(s1.map(d=>d.id).sort(),expectedIds,'Notion S1 IDs and prior survivors');
fixture.donors.forEach(id=>assert.ok(!byId.has(id),'merged donor remains retired '+id));
assert.equal(hash(s1),'f5ef402dd30423b7c806d1f91b01c01b1227b5572f1883b69b153321e883cd7b','Notion S1 production snapshot');

for(const dialogue of s1){
  assert.equal(dialogue.season,'Season 1');assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'target Phrase exists '+dialogue.id+'/'+id));
  dialogue.lines.forEach(line=>{assert.equal(line.length,3);assert.ok(['A','B'].includes(line[0]));assert.ok(line[1].trim());assert.ok(line[2].trim());});
}
assert.equal(s1.reduce((sum,d)=>sum+d.phraseLinks.length,0),877);
assert.ok(!byId.get('S1-NEW-59').phraseLinks.includes('p2904'));
assert.ok(!byId.get('S1-NEW-61').phraseLinks.includes('p2775'));
assert.equal(byId.get('S1-NEW-59').phraseLinks.length,7);
assert.equal(byId.get('S1-NEW-61').phraseLinks.length,7);

let auto=0,explicit=0,partial=0;
for(const dialogue of s1){
  const results=plain(c.dialoguePhraseMatchResults(dialogue,dialogue.phraseLinks.map(id=>phraseById.get(id))));
  for(const id of dialogue.phraseLinks){
    const ranges=results.filter(range=>range.phraseId===id),key=dialogue.id+'|'+id;
    if(exclusions[key]){assert.equal(ranges.length,0);continue;}
    assert.ok(ranges.length,'unresolved S1 highlight '+key);
    if(ranges[0].source==='matcher')auto++;else explicit++;
    for(const range of ranges){
      const text=dialogue.lines[range.lineIndex][1];assert.equal(text.slice(range.start,range.end),range.text);
      const phrase=phraseById.get(id),intentionalAffix=/^-/.test(phrase.phrase);
      if(!intentionalAffix&&(/[A-Za-z]/.test(text[range.start-1]||'')||/[A-Za-z]/.test(text[range.end]||'')))partial++;
    }
  }
}
assert.deepEqual({auto,explicit,partial},{auto:817,explicit:60,partial:0});
const sourceOrder=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(hash(sourceOrder.map(p=>[p.id,p.episode,p.sourceOrder])),fixture.hashes.sourceOrder,'Phrase sourceOrder unchanged');

console.log('S1 Notion Dialogue sync: 108 records / 877 links, exact snapshot, A/B-only, Highlight + Blank ranges PASS');
