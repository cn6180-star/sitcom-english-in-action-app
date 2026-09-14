"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,index)=>
  JSON.parse(fs.readFileSync(path.join(root,"data",`season${index+1}.json`),"utf8"))
);
const phrases=datasets.flatMap(dataset=>dataset.phrases||[]);
const dialogues=datasets.flatMap(dataset=>dataset.dialogues||[]);
const phraseIds=new Set(phrases.map(phrase=>phrase.id));
const dialogueById=new Map(dialogues.map(dialogue=>[dialogue.id,dialogue]));

for(const {removed,retained,dialogueId} of[
  {removed:"p121",retained:"p1148",dialogueId:"d1"},
  {removed:"p167",retained:"p7",dialogueId:"d5"},
  {removed:"p248",retained:"p38",dialogueId:"d14"},
  {removed:"p314",retained:"p194",dialogueId:"d25"}
]){
  assert.equal(phraseIds.has(removed),false,`${removed} duplicate still exists`);
  assert.equal(phraseIds.has(retained),true,`${retained} canonical Phrase is missing`);
  assert.equal(dialogueById.get(dialogueId).phraseLinks.includes(removed),false,`${dialogueId} still links ${removed}`);
  assert.equal(dialogueById.get(dialogueId).phraseLinks.includes(retained),true,`${dialogueId} does not link ${retained}`);
}

// S2 Final Triage drops Dialogue d16, not its canonical Phrase p12.
assert.equal(phraseIds.has("p243"),false);
assert.equal(phraseIds.has("p12"),true);
for(const id of ["d12","d13","d16","d20","d23","d24"])
  assert.equal(dialogueById.has(id),false,`${id} must remain dropped`);

const brokenLinks=dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id))
  .map(id=>`${dialogue.id}:${id}`)
).sort();
assert.deepEqual(brokenLinks,[]);

console.log("duplicate Phrase cleanup and Dialogue link tests passed");
