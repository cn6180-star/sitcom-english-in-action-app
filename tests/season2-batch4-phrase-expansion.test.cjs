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

const newIds=Array.from({length:83},(_,index)=>`p${1686+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));
const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));

assert.deepEqual(counts(newPhrases,"episode"),{"S01E01":5,"S01E02":4,"S01E03":1,"S01E05":1,"S01E07":1,"S01E08":1,"S01E10":1,"S01E14":1,"S01E15":1,"S02E02":1,"S02E04":1,"S02E05":2,"S02E07":1,"S02E08":1,"S02E10":20,"S02E11":21,"S02E12":20});
assert.equal(newPhrases.filter(phrase=>phrase.episode==="S02E06").length,0);
assert.equal(newPhrases.filter(phrase=>phrase.episode==="S02E09").length,0);
assert.deepEqual(counts(newPhrases,"type"),{"grammar":3,"idiom":9,"pattern":18,"phrasal verb":7,"phrase":43,"word":3});
assert.deepEqual(counts(newPhrases,"frequency"),{"frequent":32,"general":47,"limited":4});
assert.deepEqual(counts(newPhrases,"register"),{"casual":18,"neutral":63,"slang":2});
assert.deepEqual(counts(newPhrases,"priority"),{"1":3,"2":24,"3":56});
assert.equal(newPhrases.filter(phrase=>Object.prototype.hasOwnProperty.call(phrase,"note")).length,16);

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
}

for(const [id,episode] of Object.entries({
  p552:"S02E10",p715:"S02E10",p642:"S02E11",p288:"S02E11",
  p317:"S02E11",p550:"S02E11",p281:"S01E01"
}))assert.equal(byId.get(id)?.episode,episode,`${id} Episode move mismatch`);

assert.equal(byId.get("p94").phrase,"you might wanna ~");
assert.equal(byId.get("p94").note,"`might want to consider ~ing`は、「～することを検討したほうがいいかも」と、より控えめに提案するときに使える。");
assert.deepEqual(
  {phrase:byId.get("p1767").phrase,episode:byId.get("p1767").episode,type:byId.get("p1767").type,frequency:byId.get("p1767").frequency,register:byId.get("p1767").register,priority:byId.get("p1767").priority},
  {phrase:"it turns out (that) ~",episode:"S01E01",type:"pattern",frequency:"frequent",register:"neutral",priority:3}
);
assert.deepEqual(
  {phrase:byId.get("p1768").phrase,episode:byId.get("p1768").episode,type:byId.get("p1768").type,frequency:byId.get("p1768").frequency,register:byId.get("p1768").register,priority:byId.get("p1768").priority},
  {phrase:"none of someone’s business",episode:"S02E10",type:"phrase",frequency:"frequent",register:"casual",priority:3}
);
assert.equal(byId.get("p1205").phrase,"turn out to be ~");
assert.equal(byId.get("p96").phrase,"Not that it’s any of your business");
assert.equal(phrases.some(phrase=>phrase.phrase==="be drawn to someone"),false);
assert.equal(byId.get("p1441").phrase,"be attracted to someone");

const friendsNames=/レイチェル|モニカ|フィービー|ロス|チャンドラー|ジョーイ|キャロル|スーザン|バリー|ミンディ|ジュリー|リチャード|ガンター|ジャニス|マルセル|フランク|エステル|ジャック|ジュディ|Friends|フレンズ/;
const episodeSpecificScene=/S\d{2}E\d{2}|エピソード|作中/;
assert.equal(newPhrases.filter(phrase=>phrase.scene.trim()).length,83);
assert.equal(newPhrases.filter(phrase=>friendsNames.test(phrase.scene)).length,0);
assert.equal(newPhrases.filter(phrase=>episodeSpecificScene.test(phrase.scene)).length,0);

const exactDuplicates=Object.fromEntries([...new Set(phrases.map(phrase=>phrase.phrase.toLowerCase()))]
  .map(headline=>[headline,phrases.filter(phrase=>phrase.phrase.toLowerCase()===headline).map(phrase=>phrase.id).sort()])
  .filter(([,ids])=>ids.length>1));
assert.deepEqual(exactDuplicates,{
  "at the end of the day":["p110","p2811"],
  "back up":["p1787","p2735"],
  "burn out":["p1196","p2571"],
  "come by":["p1596","p2607"],
  "get out!":["p2528","p2612"],
  "huge":["p125","p2827"],
  "leave someone alone":["p1114","p2718"],
  "be all over someone":["p1721","p2428"],
  "be with someone":["p1234","p1500"],
  "catch on":["p1106","p364"],
  "clean up":["p2109","p2394"],
  "come through":["p1368","p1645"],
  "come up":["p1633","p2423"],
  "go through ~":["p1099","p1546","p1708","p2429"],
  "go with ~":["p1212","p1776"],
  "make it":["p1502","p1557","p514"],
  "open up":["p1385","p2040"],
  "out there":["p1487","p608"],
  "pick someone up":["p1325","p1551"],
  "that’s it.":["p1152","p2445"],
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

console.log("Season 2 Batch 4 Phrase expansion tests passed");
