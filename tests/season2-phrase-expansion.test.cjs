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

const newIds=Array.from({length:118},(_,index)=>`p${1442+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));

function countsBy(field,values=[]){
  const counts=Object.fromEntries(values.map(value=>[value,0]));
  for(const phrase of newPhrases)counts[phrase[field]]=(counts[phrase[field]]||0)+1;
  return counts;
}

assert.deepEqual(countsBy("episode"),{"S01E01":2,"S01E02":2,"S01E03":3,"S01E04":4,"S01E05":1,"S01E06":1,"S01E07":4,"S01E09":3,"S01E10":1,"S01E12":1,"S01E13":3,"S01E14":1,"S01E15":1,"S01E16":1,"S01E18":1,"S02E01":14,"S02E02":9,"S02E03":10,"S02E04":17,"S02E05":17,"S02E06":22});
assert.deepEqual(countsBy("type"),{"grammar":7,"idiom":20,"pattern":12,"phrasal verb":16,"phrase":62,"word":1});
assert.deepEqual(countsBy("frequency"),{"frequent":47,"general":69,"limited":2});
assert.deepEqual(countsBy("register",["formal"]),{"casual":25,"formal":0,"neutral":90,"polite":2,"slang":1});
assert.deepEqual(countsBy("priority"),{"1":2,"2":43,"3":73});

const required=["id","phrase","meaning","scene","example1","example2","exampleTranslations","type","priorityText","priority","source","episode","frequency","register"];
const types=new Set(["word","phrase","idiom","phrasal verb","pattern","grammar"]);
const frequencies=new Set(["frequent","general","limited"]);
const registers=new Set(["casual","neutral","polite","formal","slang"]);
const priorityText={1:"★☆☆",2:"★★☆",3:"★★★"};
for(const phrase of newPhrases){
  for(const field of required)assert.notEqual(phrase[field],undefined,`${phrase.id} is missing ${field}`);
  assert.equal(phrase.exampleTranslations.length,2,`${phrase.id} translation count mismatch`);
  assert.ok(types.has(phrase.type),`${phrase.id} has invalid type`);
  assert.ok(frequencies.has(phrase.frequency),`${phrase.id} has invalid frequency`);
  assert.ok(registers.has(phrase.register),`${phrase.id} has invalid register`);
  assert.equal(phrase.priorityText,priorityText[phrase.priority],`${phrase.id} priority mismatch`);
  assert.equal(phrase.source,"Friends",`${phrase.id} source mismatch`);
  assert.equal(Object.prototype.hasOwnProperty.call(phrase,"usage"),false,`${phrase.id} has legacy usage`);
}

const episodeMoves={
  p198:"S02E01",p299:"S01E02",p665:"S02E01",
  p382:"S02E02",p215:"S02E02",p759:"S02E02",p810:"S01E01",p831:"S02E02",
  p225:"S02E03",p237:"S02E03",p240:"S02E03",p431:"S02E03",p436:"S02E03",p839:"S02E03",p918:"S01E11",p1093:"S02E03",
  p395:"S02E04",p420:"S02E05",p576:"S02E05",p224:"S02E05",p344:"S02E06",p169:"S02E06"
};
assert.equal(Object.keys(episodeMoves).length,22);
for(const [id,episode] of Object.entries(episodeMoves))assert.equal(byId.get(id)?.episode,episode,`${id} Episode mismatch`);

assert.equal(byId.get("p215").phrase,"hate someone’s guts");
assert.equal(byId.get("p1093").phrase,"be/get hung up on ~");
assert.equal(byId.get("p153").phrase,"be/go out the window");
assert.equal(byId.get("p1213").phrase,"wait a sec / wait a minute");
assert.equal(byId.get("p1457").phrase,"be back together");
assert.equal(byId.get("p1499").phrase,"put ~ behind you");
assert.equal(byId.get("p1544").phrase,"one’s heart skips a beat");
assert.match(byId.get("p1544").scene,/uterus/);
assert.match(byId.get("p1544").note,/通常は.*heart.*Friendsでは.*uterus/);
assert.equal(byId.get("p215").note,"非常に強い嫌悪を表す口語的なidiom。本人に直接言うと攻撃的。Friendsの実使用は `You really need to hate Julie’s guts.`。");
assert.equal(byId.get("p1093").note,"人に対する `be hung up on` は「未練がある」、物事に対する `be/get hung up on` は「こだわりすぎる／気にしすぎる」。Friendsの実使用は `Don’t get hung up on it.`。");
assert.equal(byId.get("p153").note,"`be out the window`は成立しなくなった状態、`go out the window`は成立しなくなる変化を表す。Friendsの実使用は `I guess that’s out the window.`。");
assert.equal(byId.get("p1213").note,"会話をいったん止める発話。secはsecondの略。文字どおり1秒・1分を指定するとは限らない。");

for(const id of["p121","p167","p243","p248","p314"])assert.equal(phraseIds.has(id),false,`${id} was restored`);
for(const id of["p12","p38","p194","p1106","p364"])assert.equal(phraseIds.has(id),true,`${id} is missing`);

const duplicateHeadlines=Object.fromEntries(
  Object.entries(Object.groupBy(phrases,phrase=>phrase.phrase))
    .filter(([,records])=>records.length>1)
    .map(([headline,records])=>[headline,records.map(record=>record.id).sort()])
);
assert.deepEqual(duplicateHeadlines,{
  "You got me.":["p1371","p2942"],
  "at the end of the day": [
    "p110",
    "p2811"
  ],
  "huge": [
    "p125",
    "p2827"
  ],
  "go through ~": [
    "p1099",
    "p1546",
    "p1708",
    "p2429"
  ],
  "catch on": [
    "p1106",
    "p364"
  ],
  "leave someone alone": [
    "p1114",
    "p2718"
  ],
  "work out": [
    "p1128",
    "p1584"
  ],
  "That’s it.": [
    "p1152",
    "p2445"
  ],
  "burn out": [
    "p1196",
    "p2571"
  ],
  "go with ~": [
    "p1212",
    "p1776"
  ],
  "be with someone": [
    "p1234",
    "p1500"
  ],
  "pick someone up": [
    "p1325",
    "p1551"
  ],
  "come through": [
    "p1368",
    "p1645"
  ],
  "open up": [
    "p1385",
    "p2040"
  ],
  "clean up": [
    "p2109",
    "p2394"
  ],
  "come up": [
    "p1633",
    "p2423"
  ],
  "be all over someone": [
    "p1721",
    "p2428"
  ],
  "Get out!": [
    "p2528",
    "p2612"
  ],
  "out there": [
    "p1487",
    "p608"
  ],
  "make it": [
    "p1502",
    "p1557",
    "p514"
  ],
  "come by": [
    "p1596",
    "p2607"
  ],
  "back up": [
    "p1787",
    "p2735"
  ]
});
for(const ids of Object.values(duplicateHeadlines)){
  assert.equal(new Set(ids.map(id=>byId.get(id).meaning)).size,ids.length,`${ids.join(",")} must remain distinct senses`);
}

assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),
  "fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90"
);

console.log("Season 2 E01-E06 Phrase expansion tests passed");
