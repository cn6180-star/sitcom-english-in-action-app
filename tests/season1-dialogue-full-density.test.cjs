'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const fixture=require('./fixtures/friends-s1-dialogue-density-final.json');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`,'utf8')));
const s1=sets[0].dialogues,s2=sets[1].dialogues,byId=new Map(dialogues.map(d=>[d.id,d]));
const phraseById=new Map(phrases.map(p=>[p.id,p])),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));

assert.equal(phrases.length,3248);assert.equal(phraseById.size,3248);
assert.equal(phrases.filter(p=>p.episode?.startsWith('S01')).length,1623);
assert.equal(dialogues.length,198);assert.equal(new Set(dialogues.map(d=>d.id)).size,198);
assert.equal(s1.length,43);assert.equal(s2.length,18);
assert.deepEqual(s1.map(d=>d.id).sort(),fixture.expected.map(item=>item.id).sort(),'final survivor IDs');
assert.deepEqual(fixture.donors,['d188','d170','d172','d193','d174','d178','d189','d183']);
fixture.donors.forEach(id=>assert.ok(!byId.has(id),'merged donor removed '+id));

for(const expected of fixture.expected){
  const dialogue=byId.get(expected.id);assert.ok(dialogue,'survivor exists '+expected.id);
  assert.equal(dialogue.season,'Season 1');
  assert.equal(hash({title:dialogue.title,lines:dialogue.lines,phraseLinks:dialogue.phraseLinks}),expected.hash,'exact Package record '+expected.id);
  assert.equal(dialogue.phraseLinks.length,expected.phraseCount);
  assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.lines.forEach(line=>{assert.equal(line.length,3);assert.ok(line[1].trim());assert.ok(line[2].trim());});
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseById.has(id),'target Phrase exists '+expected.id+'/'+id));
}
for(const [dialogueId,ids] of Object.entries(fixture.retiredLinks)){
  ids.forEach(id=>assert.ok(!byId.get(dialogueId).phraseLinks.includes(id),'retired link '+dialogueId+'/'+id));
}
for(const merge of fixture.mergePlan){
  assert.deepEqual(byId.get(merge.survivorId).phraseLinks,merge.targetPhraseIds,'MERGE Phrase recovery '+merge.survivorId);
  merge.sourceIds.filter(id=>id!==merge.survivorId).forEach(id=>assert.ok(!byId.has(id)));
}

const counts=s1.map(d=>d.phraseLinks.length).sort((a,b)=>a-b),wordCounts=s1.map(d=>d.lines.reduce((sum,line)=>sum+(line[1].match(/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g)||[]).length,0)).sort((a,b)=>a-b);
const median=values=>values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2;
assert.equal(counts.reduce((a,b)=>a+b,0),331);assert.equal(median(counts),8);
assert.equal(counts.filter(n=>n<=4).length,0);assert.equal(counts.filter(n=>n>=5&&n<=6).length,0);
assert.equal(counts.filter(n=>n>=7&&n<=9).length,43);assert.equal(counts.filter(n=>n>=10).length,0);
assert.equal(wordCounts.reduce((a,b)=>a+b,0),3212);assert.equal(median(wordCounts),74);

const coreTypes=new Set(['phrase','pattern','phrasal verb','idiom','grammar']),coreRegisters=new Set(['neutral','casual','polite']);
const core=new Set(phrases.filter(p=>p.episode?.startsWith('S01')&&p.priority===3&&p.frequency==='frequent'&&coreTypes.has(p.type)&&coreRegisters.has(p.register)).map(p=>p.id));
const covered=new Set(s1.flatMap(d=>d.phraseLinks).filter(id=>core.has(id)));
assert.equal(core.size,884);assert.equal(fixture.density.coreBefore,143);assert.equal(covered.size,227);
assert.equal(covered.size-fixture.density.coreBefore,84);assert.deepEqual(fixture.density.coreLoss,[]);

let auto=0,explicit=0,partial=0;
for(const dialogue of s1){
  const results=plain(c.dialoguePhraseMatchResults(dialogue,dialogue.phraseLinks.map(id=>phraseById.get(id))));
  for(const id of dialogue.phraseLinks){
    const ranges=results.filter(range=>range.phraseId===id);assert.ok(ranges.length,'unresolved S1 highlight '+dialogue.id+'/'+id);
    if(ranges[0].source==='matcher')auto++;else explicit++;
    for(const range of ranges){
      const text=dialogue.lines[range.lineIndex][1];assert.equal(text.slice(range.start,range.end),range.text);
      if(/[A-Za-z]/.test(text[range.end-1]||'')&&/[A-Za-z]/.test(text[range.end]||''))partial++;
      if(/[A-Za-z]/.test(text[range.start]||'')&&/[A-Za-z]/.test(text[range.start-1]||''))partial++;
    }
  }
}
assert.equal(auto+explicit,331);assert.equal(partial,0);
for(const expected of fixture.technicalRanges){
  const dialogue=byId.get(expected.dialogueId),phrase=phraseById.get(expected.phraseId);
  const ranges=plain(c.dialoguePhraseMatchResults(dialogue,[phrase]));
  assert.deepEqual(ranges.map(range=>range.text),expected.texts,expected.dialogueId+'/'+expected.phraseId);
  assert.ok(ranges.every(range=>range.lineIndex===expected.lineIndex&&range.source===expected.source));
}

const sourceOrder=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(hash(sourceOrder.map(p=>[p.id,p.episode,p.sourceOrder])),fixture.hashes.sourceOrder,'Phrase sourceOrder unchanged');
assert.equal(hash(s2),fixture.hashes.s2Dialogues,'S2 Dialogue unchanged');

const app=fs.readFileSync('js/app.js','utf8'),progress={DIALOGUES:s1,learnedDialogueIds:()=>[...fixture.donors,'d168'],getCompletionPercent:(n,t)=>Math.round(n/t*1000)/10};
vm.createContext(progress);vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith('function dialogueProgressFor(')),progress);
assert.deepEqual(plain(progress.dialogueProgressFor()),{learned:1,total:43,remaining:42,percent:2.3},'stale donor progress never promotes survivor');
assert.match(app,/recordingOwnerMatchesRoute/);assert.match(app,/validateBackupDocument/);assert.match(app,/validIdArray\(item,dialogueIds/);

console.log(`S1 full density: 43 survivors, 8 donors removed, 331 links (${auto} auto / ${explicit} explicit), 227 Core, partial-token 0, exact Package + compatibility PASS`);
