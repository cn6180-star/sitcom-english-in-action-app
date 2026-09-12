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

assert.equal(phrases.length,2787);
assert.equal(phraseIds.size,2787);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),2835);

const newIds=Array.from({length:157},(_,index)=>`p${2184+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));
const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));

assert.deepEqual(counts(newPhrases,"episode"),{"S01E01":5,"S01E02":1,"S01E04":4,"S01E05":1,"S01E06":2,"S01E07":2,"S01E08":5,"S01E09":3,"S01E10":1,"S01E11":2,"S01E12":2,"S01E13":3,"S01E14":1,"S01E15":1,"S01E18":1,"S01E22":1,"S01E24":2,"S02E01":1,"S02E02":1,"S02E05":1,"S02E06":1,"S02E07":1,"S02E14":1,"S02E15":1,"S02E16":1,"S02E20":1,"S02E22":28,"S02E23":41,"S02E24":42});
assert.deepEqual(counts(newPhrases,"type"),{"grammar":5,"idiom":18,"pattern":26,"phrasal verb":21,"phrase":82,"word":5});
assert.deepEqual(counts(newPhrases,"frequency"),{"frequent":79,"general":72,"limited":6});
assert.deepEqual(counts(newPhrases,"register"),{"casual":44,"formal":1,"neutral":107,"polite":4,"slang":1});
assert.deepEqual(counts(newPhrases,"priority"),{"1":4,"2":65,"3":88});

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
for(let id=2184;id<=2214;id++)assert.ok(season1Ids.has(`p${id}`),`p${id} must be in season1 data`);
for(let id=2215;id<=2340;id++)assert.ok(season2Ids.has(`p${id}`),`p${id} must be in season2 data`);

for(const [id,episode] of Object.entries({
  p584:"S02E03",p1619:"S01E03",p368:"S02E23",p830:"S02E23",
  p1026:"S02E23",p465:"S02E24"
}))assert.equal(byId.get(id)?.episode,episode,`${id} Episode mismatch`);

assert.equal(byId.get("p584").phrase,"It’s time (that) + clause");
assert.match(byId.get("p584").note,/that.*過去形/);
assert.equal(byId.get("p1619").phrase,"care about ~");
assert.equal(byId.get("p1619").example2,"He cares deeply about his work.");
assert.equal(byId.get("p489").phrase,"for all I/we/you know");
assert.match(byId.get("p489").note,/`I`.*`we`.*`you`/);
assert.equal(byId.get("p465").register,"neutral");

for(let episode=1;episode<=24;episode++){
  const key=`S02E${String(episode).padStart(2,"0")}`;
  assert.ok(phrases.some(phrase=>phrase.episode===key),`${key} has no production Phrases`);
}

assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 2 Batch 8 Phrase expansion tests passed");
