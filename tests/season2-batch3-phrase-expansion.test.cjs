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
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const phraseIds=new Set(byId.keys());

assert.equal(phrases.length,2787);
assert.equal(phraseIds.size,2787);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),2835);

const newIds=Array.from({length:126},(_,index)=>`p${1560+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));

const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));
assert.deepEqual(counts(newPhrases,"episode"),{"S01E01":13,"S01E02":1,"S01E03":3,"S01E04":3,"S01E05":2,"S01E06":2,"S01E07":5,"S01E08":1,"S01E09":1,"S01E10":1,"S01E11":1,"S01E12":2,"S01E13":1,"S01E14":1,"S01E15":1,"S02E01":1,"S02E02":1,"S02E03":1,"S02E04":1,"S02E05":1,"S02E07":28,"S02E08":27,"S02E09":28});
assert.deepEqual(counts(newPhrases,"type"),{"grammar":4,"idiom":13,"pattern":17,"phrasal verb":15,"phrase":76,"word":1});
assert.deepEqual(counts(newPhrases,"frequency"),{"frequent":56,"general":59,"limited":11});
assert.deepEqual(counts(newPhrases,"register"),{"casual":41,"neutral":78,"polite":5,"slang":2});
assert.deepEqual(counts(newPhrases,"priority"),{"1":7,"2":47,"3":72});

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
  p800:"S02E07",p233:"S02E07",p563:"S02E08",p377:"S02E08",p866:"S02E08",p813:"S02E08",
  p392:"S02E08",p370:"S02E08",p601:"S02E08",p1003:"S02E09",p1052:"S02E09"
}))assert.equal(byId.get(id).episode,episode,`${id} Episode move mismatch`);

assert.equal(byId.get("p1183").phrase,"the way I see it / the way I look at it");
assert.equal(byId.get("p1183").episode,"S01E06");
assert.equal(byId.get("p657").phrase,"work something out");
assert.equal(byId.get("p657").episode,"S06E03");
assert.equal(byId.get("p1128").phrase,"work out");
assert.equal(byId.get("p1128").episode,"S01E02");
assert.equal(byId.get("p1128").example2,"I am sure things will work out somehow.");
assert.equal(byId.get("p1128").exampleTranslations[1],"きっと何とかうまくいくよ。");
assert.equal(byId.get("p601").phrase,"go through the trouble of ~ing");
assert.equal(byId.get("p601").episode,"S02E08");

for(const id of["p121","p167","p243","p248","p314"])assert.equal(phraseIds.has(id),false,`${id} was restored`);
for(const id of["p1183","p657","p1233","p1605","p254","p327"])assert.equal(phraseIds.has(id),true,`${id} is missing`);

const findNew=(headline,episode)=>newPhrases.find(phrase=>phrase.phrase===headline&&phrase.episode===episode);
assert.match(findNew("I got it.","S02E03").meaning,/私がやる|任せて/);
assert.match(findNew("Got it.","S01E03").meaning,/分かった|了解/);
assert.ok(findNew("if you know what I mean","S02E07"));
assert.ok(findNew("Do you mind if ~?","S02E07"));
assert.ok(findNew("Do you think it’d be all right if ~?","S02E09"));

const friendsNames=/レイチェル|モニカ|フィービー|ロス|チャンドラー|ジョーイ|キャロル|スーザン|バリー|ミンディ|ジュリー|リチャード|ガンター|ジャニス|マルセル|フランク|エステル|ジャック|ジュディ|Friends|フレンズ/;
const episodeSpecificScene=/S\d{2}E\d{2}|エピソード|作中/;
assert.equal(newPhrases.filter(phrase=>phrase.scene.trim()).length,126);
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
const normalizeHeadline=headline=>headline.toLowerCase().replaceAll("’","'").trim()
  .replace(/[?!.]+$/,"")
  .replace(/\b(someone|somebody|anyone|anybody)\b/g,"someone")
  .replace(/\b(something|anything)\b/g,"~")
  .replace(/\b(my|your|his|her|our|their|one's)\b/g,"one's")
  .replace(/\s+/g," ");
const normalizedDuplicates=Object.fromEntries([...new Set(phrases.map(phrase=>normalizeHeadline(phrase.phrase)))]
  .map(headline=>[headline,phrases.filter(phrase=>normalizeHeadline(phrase.phrase)===headline).map(phrase=>phrase.id).sort()])
  .filter(([,ids])=>ids.length>1));
assert.deepEqual(normalizedDuplicates,{
  "at the end of the day":["p110","p2811"],
  "back up":["p1787","p2735"],
  "burn out":["p1196","p2571"],
  "come by":["p1596","p2607"],
  "get out":["p2528","p2612"],
  "huge":["p125","p2827"],
  "in the middle of ~":["p2546","p730"],
  "leave someone alone":["p1114","p2718"],
  "pick ~ up":["p2479","p2790"],
  "score":["p1018","p2706"],
  "be all over someone":["p1721","p2428"],
  "be with someone":["p1234","p1500"],
  "catch on":["p1106","p364"],
  "clean up":["p2109","p2394"],
  "come through":["p1368","p1645"],
  "come up":["p1633","p2423"],
  "get out of here":["p1553","p1773"],
  "go for ~":["p1374","p2055"],
  "go through ~":["p1099","p1546","p1708","p2429"],
  "go with ~":["p1212","p1776"],
  "make it":["p1502","p1557","p514"],
  "open up":["p1385","p2040"],
  "out there":["p1487","p608"],
  "pick someone up":["p1325","p1551"],
  "that's it":["p1152","p2038","p2445"],
  "work out":["p1128","p1584"]
});

assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);

console.log("Season 2 Batch 3 Phrase expansion tests passed");
