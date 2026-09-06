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
  {removed:"p243",retained:"p12",dialogueId:"d16"},
  {removed:"p248",retained:"p38",dialogueId:"d14"},
  {removed:"p314",retained:"p194",dialogueId:"d25"}
]){
  assert.equal(phraseIds.has(removed),false,`${removed} duplicate still exists`);
  assert.equal(phraseIds.has(retained),true,`${retained} canonical Phrase is missing`);
  assert.equal(dialogueById.get(dialogueId).phraseLinks.includes(removed),false,`${dialogueId} still links ${removed}`);
  assert.equal(dialogueById.get(dialogueId).phraseLinks.includes(retained),true,`${dialogueId} does not link ${retained}`);
}

const brokenLinks=dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id))
  .map(id=>`${dialogue.id}:${id}`)
).sort();
assert.deepEqual(brokenLinks,[
  "d102:p625","d103:p755","d124:p766","d125:p757","d39:p369",
  "d44:p428","d47:p369","d82:p540","d94:p648"
]);

console.log("duplicate Phrase cleanup tests passed");
