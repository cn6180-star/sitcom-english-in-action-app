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
const phraseIds=new Set(byId.keys());

assert.equal(phrases.length,2904);
assert.equal(phraseIds.size,2904);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),2952);

const newIds=Array.from({length:139},(_,index)=>`p${2045+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));
const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));

assert.deepEqual(counts(newPhrases,"episode"),{"S01E01":4,"S01E02":2,"S01E03":5,"S01E04":2,"S01E05":1,"S01E06":1,"S01E08":2,"S01E09":2,"S01E11":4,"S01E12":1,"S01E13":2,"S01E14":1,"S01E15":3,"S01E16":1,"S01E18":2,"S01E19":1,"S01E23":1,"S02E11":1,"S02E16":1,"S02E17":1,"S02E19":32,"S02E20":36,"S02E21":33});
assert.deepEqual(counts(newPhrases,"type"),{"grammar":4,"idiom":23,"pattern":19,"phrasal verb":17,"phrase":73,"word":3});
assert.deepEqual(counts(newPhrases,"frequency"),{"frequent":52,"general":76,"limited":11});
assert.deepEqual(counts(newPhrases,"register"),{"casual":48,"formal":1,"neutral":83,"polite":2,"slang":5});
assert.deepEqual(counts(newPhrases,"priority"),{"1":6,"2":59,"3":74});

const required=["id","phrase","meaning","scene","example1","example2","exampleTranslations","type","priorityText","priority","source","episode","frequency","register"];
const allowedTypes=new Set(["word","phrase","idiom","phrasal verb","pattern","grammar"]);
const allowedFrequencies=new Set(["frequent","general","limited"]);
const allowedRegisters=new Set(["casual","neutral","polite","formal","slang"]);
const priorityText={1:"★☆☆",2:"★★☆",3:"★★★"};
for(const phrase of newPhrases){
  for(const field of required)assert.notEqual(phrase[field],undefined,`${phrase.id} missing ${field}`);
  assert.equal(phrase.exampleTranslations.length,2,`${phrase.id} translation count mismatch`);
  assert.ok(allowedTypes.has(phrase.type),`${phrase.id} invalid type`);
  assert.ok(allowedFrequencies.has(phrase.frequency),`${phrase.id} invalid frequency`);
  assert.ok(allowedRegisters.has(phrase.register),`${phrase.id} invalid register`);
  assert.equal(phrase.priorityText,priorityText[phrase.priority],`${phrase.id} priority mismatch`);
  assert.equal(phrase.source,"Friends",`${phrase.id} source mismatch`);
}

const season1Ids=new Set((datasets[0].phrases||[]).map(phrase=>phrase.id));
const season2Ids=new Set((datasets[1].phrases||[]).map(phrase=>phrase.id));
for(let id=2045;id<=2075;id++)assert.ok(season1Ids.has(`p${id}`),`p${id} must be in season1 data`);
for(let id=2076;id<=2183;id++)assert.ok(season2Ids.has(`p${id}`),`p${id} must be in season2 data`);

for(const [id,episode] of Object.entries({
  p575:"S02E19",p606:"S02E20",p555:"S02E20",p448:"S02E20",
  p802:"S02E21",p473:"S02E21",p591:"S02E21",p226:"S02E21"
}))assert.equal(byId.get(id)?.episode,episode,`${id} Episode mismatch`);

assert.equal(byId.get("p448").phrase,"handle ~");
assert.equal(byId.get("p448").meaning,"～に対処する／～をうまく扱う");
assert.match(byId.get("p448").note,/handle it well/);
assert.equal(byId.get("p473").phrase,"want a piece of this/me?");
assert.match(byId.get("p473").note,/this.*me/);
assert.equal(byId.get("p95").phrase,"flip for it");
assert.match(byId.get("p95").note,/flip someone for it/);
assert.equal(byId.get("p575").scene,"服装・役柄・難しいことなどをうまく成立させられるか話すとき");

assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 2 Batch 7 Phrase expansion tests passed");
