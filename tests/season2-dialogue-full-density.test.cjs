'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const fixture=require('./fixtures/friends-s2-dialogue-density-final.json');
const phraseBaseline=require('./fixtures/friends-s2-dialogue-production-baseline.json');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`,'utf8')));
const s1=sets[0].dialogues,s2=sets[1].dialogues,byId=new Map(dialogues.map(d=>[d.id,d]));
const phraseById=new Map(phrases.map(p=>[p.id,p])),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));

assert.equal(phrases.length,3106);assert.equal(phraseById.size,3106);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S01')).length,1623);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S02')).length,791);
assert.equal(dialogues.length,198);assert.equal(new Set(dialogues.map(d=>d.id)).size,198);
assert.equal(s1.length,43);assert.equal(s2.length,18);
for(const [file,want] of Object.entries(phraseBaseline.phraseHashes))assert.equal(hash(JSON.parse(fs.readFileSync(file,'utf8')).phrases),want,'Phrase data unchanged '+file);
assert.equal(hash(s1),fixture.hashes.s1Dialogues,'S1 Dialogue completely unchanged');
assert.deepEqual(s2.map(d=>d.id).sort(),fixture.expected.map(item=>item.id).sort(),'final S2 survivor IDs');
assert.deepEqual(fixture.donors,['d209','d213']);fixture.donors.forEach(id=>assert.ok(!byId.has(id),'merged donor removed '+id));

for(const expected of fixture.expected){
  const dialogue=byId.get(expected.id);assert.ok(dialogue,'survivor exists '+expected.id);assert.equal(dialogue.season,'Season 2');
  assert.equal(hash({title:dialogue.title,lines:dialogue.lines,phraseLinks:dialogue.phraseLinks}),expected.hash,'exact Package record '+expected.id);
  assert.equal(dialogue.phraseLinks.length,expected.phraseCount);assert.equal(dialogue.lines.length,11);
  assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.lines.forEach(line=>{assert.equal(line.length,3);assert.ok(line[1].trim());assert.ok(line[2].trim());});
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'target Phrase exists '+expected.id+'/'+id));
}
for(const merge of fixture.mergePlan){
  assert.deepEqual(byId.get(merge.survivorId).phraseLinks,merge.targetPhraseIds,'MERGE Phrase recovery '+merge.survivorId);
  merge.donorIds.forEach(id=>assert.ok(!byId.has(id)));
}

const counts=s2.map(d=>d.phraseLinks.length).sort((a,b)=>a-b),wordCounts=s2.map(d=>d.lines.reduce((sum,line)=>sum+(line[1].match(/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g)||[]).length,0)).sort((a,b)=>a-b);
const median=values=>values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2;
assert.equal(counts.reduce((a,b)=>a+b,0),142);assert.equal(new Set(s2.flatMap(d=>d.phraseLinks)).size,132);assert.equal(median(counts),8);
assert.equal(counts.filter(n=>n<=4).length,0);assert.equal(counts.filter(n=>n>=5&&n<=6).length,0);assert.equal(counts.filter(n=>n>=7&&n<=9).length,18);assert.equal(counts.filter(n=>n>=10).length,0);
assert.equal(wordCounts.reduce((a,b)=>a+b,0),1370);assert.equal(median(wordCounts),76);

const core=new Set(fixture.coreCoverage.poolIds),covered=new Set(s2.flatMap(d=>d.phraseLinks).filter(id=>core.has(id)));
assert.equal(core.size,395);assert.equal(fixture.coreCoverage.before,49);assert.equal(covered.size,121);assert.equal(covered.size-fixture.coreCoverage.before,72);assert.deepEqual(fixture.coreCoverage.lostCoreIds,[]);
assert.deepEqual([...covered].sort(),fixture.coreCoverage.coveredIds.slice().sort(),'exact final Core coverage');

let auto=0,explicit=0,partial=0;
for(const dialogue of s2){
  const results=plain(c.dialoguePhraseMatchResults(dialogue,dialogue.phraseLinks.map(id=>phraseById.get(id))));
  for(const id of dialogue.phraseLinks){
    const ranges=results.filter(range=>range.phraseId===id);assert.ok(ranges.length,'unresolved S2 highlight '+dialogue.id+'/'+id);
    if(ranges[0].source==='matcher')auto++;else explicit++;
    for(const range of ranges){const text=dialogue.lines[range.lineIndex][1];assert.equal(text.slice(range.start,range.end),range.text);if(/[A-Za-z]/.test(text[range.start-1]||'')||/[A-Za-z]/.test(text[range.end]||''))partial++;}
  }
}
assert.deepEqual({auto,explicit,partial},{auto:135,explicit:7,partial:0});
for(const expected of fixture.technicalRanges){
  const dialogue=byId.get(expected.dialogueId),phrase=phraseById.get(expected.phraseId),ranges=plain(c.dialoguePhraseMatchResults(dialogue,[phrase]));
  assert.deepEqual(ranges.map(range=>range.text),expected.texts,expected.dialogueId+'/'+expected.phraseId);
  assert.ok(ranges.every(range=>range.lineIndex===expected.lineIndex&&range.source===expected.source));
}
const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c));fixture.inactiveHints.forEach(key=>assert.ok(!hints[key],'obsolete hint removed '+key));
const retiredHintRanges={
  'd21|p174':{lineIndex:6,texts:['keep the cravings at bay']},
  'd14|p177':{lineIndex:6,texts:['worth a shot']},
  'd15|p192':{lineIndex:0,texts:['getting heat from']},
  'd17|p202':{lineIndex:2,texts:['self-conscious']},
  'd17|p250':{lineIndex:8,texts:['come off well']}
};
for(const [key,want] of Object.entries(retiredHintRanges)){
  const [dialogueId,phraseId]=key.split('|'),ranges=plain(c.dialoguePhraseMatchResults(byId.get(dialogueId),[phraseById.get(phraseId)]));
  assert.deepEqual(ranges.map(range=>range.text),want.texts,'retired hint keeps selected range '+key);
  assert.ok(ranges.every(range=>range.lineIndex===want.lineIndex&&range.source==='matcher'));
}

const sourceOrder=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(hash(sourceOrder.map(p=>[p.id,p.episode,p.sourceOrder])),fixture.hashes.sourceOrder,'Phrase sourceOrder unchanged');
const app=fs.readFileSync('js/app.js','utf8'),progress={DIALOGUES:s2,learnedDialogueIds:()=>['d209','d213','d18'],getCompletionPercent:(n,t)=>Math.round(n/t*1000)/10};
vm.createContext(progress);vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith('function dialogueProgressFor(')),progress);
assert.deepEqual(plain(progress.dialogueProgressFor()),{learned:1,total:18,remaining:17,percent:5.6},'stale donor progress never promotes survivor');
assert.match(app,/recordingOwnerMatchesRoute/);assert.match(app,/validateBackupDocument/);assert.match(app,/validIdArray\(item,dialogueIds/);

console.log(`S2 full density: 18 survivors, 2 donors removed, 142 links (${auto} auto / ${explicit} explicit), 121 Core, partial-token 0, exact Package + compatibility PASS`);
