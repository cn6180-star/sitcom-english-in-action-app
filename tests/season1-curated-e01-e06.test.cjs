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
assert.equal(phrases.filter(phrase=>phrase.episode.startsWith("S01E")).length,1235);

const e01e03Ids=Array.from({length:106},(_,index)=>`p${2341+index}`);
const e04e06Ids=Array.from({length:87},(_,index)=>`p${2447+index}`);
assert.deepEqual(e01e03Ids.filter(id=>phraseIds.has(id)),e01e03Ids);
assert.deepEqual(e04e06Ids.filter(id=>phraseIds.has(id)),e04e06Ids);

const countByEpisode=ids=>Object.fromEntries([...new Set(ids.map(id=>byId.get(id).episode))]
  .sort().map(episode=>[episode,ids.filter(id=>byId.get(id).episode===episode).length]));
assert.deepEqual(countByEpisode(e01e03Ids),{"S01E01":46,"S01E02":29,"S01E03":31});
assert.deepEqual(countByEpisode(e04e06Ids),{"S01E01":1,"S01E02":4,"S01E03":3,"S01E04":24,"S01E05":28,"S01E06":27});

const required=["id","phrase","meaning","scene","example1","example2","exampleTranslations","type","priorityText","priority","source","episode","frequency","register"];
const priorityText={1:"★☆☆",2:"★★☆",3:"★★★"};
for(const id of [...e01e03Ids,...e04e06Ids]){
  const phrase=byId.get(id);
  for(const field of required)assert.notEqual(phrase[field],undefined,`${id} missing ${field}`);
  assert.equal(phrase.exampleTranslations.length,2,`${id} translation count mismatch`);
  assert.equal(phrase.priorityText,priorityText[phrase.priority],`${id} priority mismatch`);
  assert.equal(phrase.source,"Friends",`${id} source mismatch`);
  assert.match(phrase.episode,/^S01E0[1-6]$/,`${id} Episode mismatch`);
}

const expectedUpdates={
  p20:["consummate (a relationship)","S01E04"],
  p752:["a whole nother + noun","S01E05"],
  p1183:["the way I see it / the way I look at it","S01E06"],
  p1925:["for a while / for a little while","S01E03"],
  p2055:["go for ~","S01E01"],
  p2303:["I need help. / I need your help.","S01E06"],
  p1461:["be fine with ~ / be okay with ~","S01E06"],
  p2199:["work on ~","S01E05"],
  p861:["pull off / rip off the Band-Aid","S01E05"]
};
for(const [id,[headline,episode]] of Object.entries(expectedUpdates)){
  assert.equal(byId.get(id)?.phrase,headline,`${id} headline mismatch`);
  assert.equal(byId.get(id)?.episode,episode,`${id} Episode mismatch`);
}

assert.equal(byId.get("p2445").phrase,"That’s it.");
assert.equal(byId.get("p2445").meaning,"そう、その調子。");
assert.equal(byId.get("p2446").phrase,"not so much");
assert.equal(byId.get("p2532").phrase,"on the way");
assert.equal(byId.get("p2533").phrase,"Easy!");
assert.deepEqual(phrases.filter(phrase=>phrase.phrase==="go for ~").map(phrase=>phrase.id),["p2055"]);

assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 1 E01-E06 curated Phrase tests passed");
