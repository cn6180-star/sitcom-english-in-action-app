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

assert.equal(phrases.length,2135);
assert.equal(phraseIds.size,2135);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),2183);

const newIds=Array.from({length:135},(_,index)=>`p${1769+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));
const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));

assert.deepEqual(counts(newPhrases,"episode"),{
  S02E01:5,S02E03:3,S02E04:3,S02E05:2,S02E06:1,S02E07:1,
  S02E09:1,S02E10:1,S02E12:1,S02E13:39,S02E14:46,S02E15:32
});
assert.deepEqual(counts(newPhrases,"type"),{
  grammar:7,idiom:13,pattern:17,"phrasal verb":11,phrase:82,word:5
});
assert.deepEqual(counts(newPhrases,"frequency"),{frequent:57,general:70,limited:8});
assert.deepEqual(counts(newPhrases,"register"),{casual:48,neutral:83,polite:2,slang:2});
assert.deepEqual(counts(newPhrases,"priority"),{"1":8,"2":44,"3":83});
assert.equal(newPhrases.filter(phrase=>Object.prototype.hasOwnProperty.call(phrase,"note")).length,25);

const required=["id","phrase","meaning","scene","example1","example2","exampleTranslations","type","priorityText","priority","source","episode","frequency","register"];
const allowedTypes=new Set(["word","phrase","idiom","phrasal verb","pattern","grammar"]);
const allowedFrequencies=new Set(["frequent","general","limited"]);
const allowedRegisters=new Set(["casual","neutral","polite","formal","slang"]);
const priorityText={1:"★☆☆",2:"★★☆",3:"★★★"};
for(const phrase of newPhrases){
  for(const field of required){
    assert.ok(Object.prototype.hasOwnProperty.call(phrase,field),`${phrase.id} missing ${field}`);
    if(typeof phrase[field]==="string")assert.ok(phrase[field].trim(),`${phrase.id} empty ${field}`);
  }
  assert.equal(phrase.source,"Friends",`${phrase.id} source mismatch`);
  assert.equal(phrase.exampleTranslations.length,2,`${phrase.id} translation count mismatch`);
  assert.ok(allowedTypes.has(phrase.type),`${phrase.id} invalid type`);
  assert.ok(allowedFrequencies.has(phrase.frequency),`${phrase.id} invalid frequency`);
  assert.ok(allowedRegisters.has(phrase.register),`${phrase.id} invalid register`);
  assert.equal(phrase.priorityText,priorityText[phrase.priority],`${phrase.id} priority mismatch`);
  assert.equal(Object.prototype.hasOwnProperty.call(phrase,"usage"),false,`${phrase.id} has legacy usage`);
}

for(const [id,episode] of Object.entries({
  p985:"S02E13",p1023:"S02E14",p280:"S02E14",p1048:"S02E14",p666:"S02E15"
}))assert.equal(byId.get(id)?.episode,episode,`${id} Episode move mismatch`);

assert.equal(byId.get("p197").phrase,"God forbid ~");
assert.equal(byId.get("p197").note,"`Oh, God forbid.`のように単独で、皮肉を込めた反応として使うこともある。");
assert.equal(byId.get("p1452").phrase,"be on one’s way");
assert.equal(byId.get("p1452").note,"文脈により「向かっている途中」と「出発する・立ち去る」の両方で使う。p1147 `be on one’s way over`より広い基本形。人だけでなく、注文した物や配達などが向かっているときにも使える。");
assert.equal(byId.get("p1285").register,"slang");
assert.equal(byId.get("p1285").note,"くだけた強い表現。勝負で勝つ・厳しく鍛えるなどに使う。`kick someone’s ass`は「痛い目に遭わせる／ぶちのめす」という、かなり強く荒っぽい俗語のvariation。冗談めかして使うこともある。");

const findNew=headline=>newPhrases.find(phrase=>phrase.phrase===headline);
assert.notEqual(findNew("get out of here").meaning,byId.get("p1553").meaning);
assert.notEqual(findNew("go with ~").meaning,byId.get("p1212").meaning);
assert.ok(findNew("Nice meeting you."));
assert.ok(findNew("Nice to meet you."));

const friendsNames=/レイチェル|モニカ|フィービー|ロス|チャンドラー|ジョーイ|キャロル|スーザン|バリー|ミンディ|ジュリー|リチャード|ガンター|ジャニス|マルセル|フランク|エステル|ジャック|ジュディ|Friends|フレンズ/;
const episodeSpecificScene=/S\d{2}E\d{2}|エピソード|作中/;
assert.equal(newPhrases.filter(phrase=>phrase.scene.trim()).length,135);
assert.equal(newPhrases.filter(phrase=>friendsNames.test(phrase.scene)).length,0);
assert.equal(newPhrases.filter(phrase=>episodeSpecificScene.test(phrase.scene)).length,0);

const exactDuplicates=Object.fromEntries([...new Set(phrases.map(phrase=>phrase.phrase.toLowerCase()))]
  .map(headline=>[headline,phrases.filter(phrase=>phrase.phrase.toLowerCase()===headline).map(phrase=>phrase.id).sort()])
  .filter(([,ids])=>ids.length>1));
assert.deepEqual(exactDuplicates,{
  "be with someone":["p1234","p1500"],
  "catch on":["p1106","p364"],
  "come through":["p1368","p1645"],
  "go through ~":["p1099","p1546","p1708"],
  "go with ~":["p1212","p1776"],
  "make it":["p1502","p1557","p514"],
  "open up":["p1385","p2040"],
  "out there":["p1487","p608"],
  "pick someone up":["p1325","p1551"],
  "work out":["p1128","p1584"]
});
for(const ids of Object.values(exactDuplicates)){
  assert.equal(new Set(ids.map(id=>byId.get(id).meaning)).size,ids.length,`${ids.join(",")} must remain distinct senses`);
}

for(const id of["p121","p167","p243","p248","p314"]){
  assert.equal(phraseIds.has(id),false,`${id} was restored`);
}
assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 2 Batch 5 Phrase expansion tests passed");
