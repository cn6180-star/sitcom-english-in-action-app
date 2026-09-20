"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),"utf8"));
const seasons=Array.from({length:9},(_,index)=>readJson(`data/season${index+1}.json`));
const fixture=readJson("tests/fixtures/friends-s3-e01-e08-phrase-rescan-final.json");
const phrases=seasons.flatMap(season=>season.phrases||[]);
const dialogues=seasons.flatMap(season=>season.dialogues||[]);
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const dialogueById=new Map(dialogues.map(dialogue=>[dialogue.id,dialogue]));
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

assert.equal(phrases.length,fixture.counts.phraseTotal);
assert.equal(byId.size,fixture.counts.phraseTotal);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),Number(fixture.counts.maxPhraseId.slice(1)));
assert.equal(phrases.filter(phrase=>phrase.episode.startsWith("S03")).length,fixture.counts.s3PhraseTotal);
assert.equal(dialogues.length,fixture.counts.dialogueTotal);

for(const expected of fixture.newRecords){
  assert.deepEqual(byId.get(expected.id),expected,`${expected.id} must match the Final Package completedRecord`);
}
for(const expected of fixture.existingRecords){
  assert.deepEqual(byId.get(expected.id),expected,`${expected.id} existing update mismatch`);
}
for(const id of fixture.removedPhraseIds)assert.ok(!byId.has(id),`${id} must be removed`);
assert.equal(byId.get("p282").episode,"S03E04");
assert.equal(byId.get("p282").sourceOrder,19);
assert.equal(byId.get("p282").register,"slang");
assert.equal(byId.get("p2440").phrase,"get screwed");

for(const expected of fixture.cleanedDialogues){
  assert.deepEqual(dialogueById.get(expected.id),expected,`${expected.id} cleanup mismatch`);
}
for(const expected of fixture.preservedDialogueLines){
  assert.deepEqual(dialogueById.get(expected.id).lines,expected.lines,`${expected.id} text/Japanese must remain unchanged`);
}
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!byId.has(id)).map(id=>`${dialogue.id}/${id}`)),[]);

for(const [episode,expected] of Object.entries(fixture.sourceOrderByEpisode)){
  const actual=phrases.filter(phrase=>phrase.episode===episode&&Number.isInteger(phrase.sourceOrder))
    .sort((a,b)=>a.sourceOrder-b.sourceOrder).map(phrase=>({id:phrase.id,sourceOrder:phrase.sourceOrder}));
  assert.deepEqual(actual,expected,`${episode} sourceOrder package mismatch`);
  assert.deepEqual(actual.map(item=>item.sourceOrder),Array.from({length:actual.length},(_,index)=>index+1),`${episode} sourceOrder gaps`);
}
assert.equal(Object.values(fixture.sourceOrderByEpisode).flat().length,fixture.counts.s3E01E08);

for(const [season,expectedHash] of Object.entries(fixture.frozenSemanticHashes)){
  assert.equal(hash(seasons[Number(season.slice(6))-1]),expectedHash,`${season} frozen data changed`);
}
assert.equal(hash(seasons[2].phrases),fixture.season3PhrasesSemanticHash);
assert.equal(hash(seasons[2].dialogues),fixture.season3DialoguesSemanticHash);

const hintSource=fs.readFileSync(path.join(root,"js","dialogue-match-hints.js"),"utf8");
const context={};vm.createContext(context);vm.runInContext(hintSource,context);
const hints=JSON.parse(JSON.stringify(vm.runInContext("DIALOGUE_EXPLICIT_MATCH_HINTS",context)));
for(const key of ["d27|p271","d28|p274"])assert.ok(!hints[key],`${key} stale hint must be removed`);

console.log("Friends S3 E01-E08 Final Package production integrity passed (146 NEW, 4 UPDATE, 4 REMOVE, 10 KEEP, 1 MOVE; 161 sourceOrder entries)");
