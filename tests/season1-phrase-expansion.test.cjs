"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,index)=>
  JSON.parse(fs.readFileSync(path.join(root,"data",`season${index+1}.json`),"utf8"))
);
const phrases=datasets.flatMap(dataset=>dataset.phrases||[]);
const dialogues=datasets.flatMap(dataset=>dataset.dialogues||[]);
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const dialogueById=new Map(dialogues.map(dialogue=>[dialogue.id,dialogue]));

assert.equal(phrases.length,1511);
assert.equal(new Set(phrases.map(phrase=>phrase.id)).size,1511);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),1559);
assert.equal(byId.has("p297"),false);
assert.equal(byId.has("p69"),true);

const newIds=Array.from({length:343},(_,index)=>`p${1099+index}`);
assert.deepEqual(newIds.filter(id=>byId.has(id)),newIds);

const expectedNewCounts={
  S01E01:19,S01E02:18,S01E03:18,S01E04:12,S01E05:12,S01E06:13,
  S01E07:17,S01E08:16,S01E09:12,S01E10:22,S01E11:21,S01E12:12,
  S01E13:23,S01E14:13,S01E15:19,S01E16:12,S01E17:15,S01E18:13,
  S01E19:8,S01E20:8,S01E21:12,S01E22:9,S01E23:8,S01E24:11
};
const newPhrases=newIds.map(id=>byId.get(id));
for(const [episode,count] of Object.entries(expectedNewCounts)){
  assert.equal(newPhrases.filter(phrase=>phrase.episode===episode).length,count,`${episode} new Phrase count mismatch`);
}

for(const [id,episode] of Object.entries({
  p69:"S01E01",p590:"S01E01",p846:"S01E01",p953:"S01E11",p792:"S01E13"
}))assert.equal(byId.get(id)?.episode,episode,`${id} Episode mismatch`);

const headings={
  p385:"for the best",p69:"hit on someone",p489:"for all we know",
  p376:"Don’t take this wrong",p262:"Way to go!",p81:"bail",
  p242:"occur to someone",p463:"be hard on someone",p119:"cook something up"
};
for(const [id,phrase] of Object.entries(headings))assert.equal(byId.get(id)?.phrase,phrase,`${id} heading mismatch`);

const required=["id","phrase","meaning","scene","example1","example2","exampleTranslations","type","priorityText","priority","source","episode","frequency","register"];
const types=new Set(["phrase","idiom","word","phrasal verb","pattern","grammar"]);
const frequencies=new Set(["frequent","general","limited"]);
const registers=new Set(["casual","neutral","polite","formal","slang"]);
const priorityText={1:"★☆☆",2:"★★☆",3:"★★★"};
for(const phrase of phrases){
  for(const field of required)assert.notEqual(phrase[field],undefined,`${phrase.id} is missing ${field}`);
  assert.ok(types.has(phrase.type),`${phrase.id} has invalid type`);
  assert.ok(frequencies.has(phrase.frequency),`${phrase.id} has invalid frequency`);
  assert.ok(registers.has(phrase.register),`${phrase.id} has invalid register`);
  assert.equal(phrase.priorityText,priorityText[phrase.priority],`${phrase.id} priority mismatch`);
  assert.equal(phrase.source,"Friends",`${phrase.id} source mismatch`);
  assert.equal(Object.prototype.hasOwnProperty.call(phrase,"usage"),false,`${phrase.id} still has legacy usage`);
}

assert.equal(dialogues.length,167);
assert.equal(Math.max(...dialogues.map(dialogue=>Number(dialogue.id.slice(1)))),167);
assert.equal(dialogueById.get("d37").phraseLinks.includes("p297"),false);
assert.equal(dialogueById.get("d37").phraseLinks.includes("p69"),true);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 1 Phrase expansion tests passed");
