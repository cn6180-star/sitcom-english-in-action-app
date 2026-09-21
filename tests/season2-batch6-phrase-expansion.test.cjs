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

assert.equal(phrases.length,3360);
assert.equal(phraseIds.size,3360);
assert.equal(Math.max(...phrases.map(phrase=>Number(phrase.id.slice(1)))),3414);

const newIds=Array.from({length:141},(_,index)=>`p${1904+index}`);
assert.deepEqual(newIds.filter(id=>phraseIds.has(id)),newIds);
const newPhrases=newIds.map(id=>byId.get(id));
const counts=(items,key)=>Object.fromEntries([...new Set(items.map(item=>item[key]))]
  .sort().map(value=>[value,items.filter(item=>item[key]===value).length]));

assert.deepEqual(counts(newPhrases,"episode"),{"S01E01":8,"S01E02":6,"S01E03":5,"S01E04":3,"S01E05":2,"S01E06":1,"S01E09":3,"S01E10":3,"S01E12":2,"S01E13":1,"S01E15":1,"S01E16":2,"S01E17":2,"S01E18":1,"S01E19":1,"S01E20":4,"S01E21":1,"S01E23":2,"S01E24":2,"S02E01":1,"S02E03":2,"S02E04":1,"S02E05":1,"S02E09":1,"S02E10":1,"S02E14":1,"S02E16":29,"S02E17":24,"S02E18":30});
assert.deepEqual(counts(newPhrases,"type"),{"grammar":5,"idiom":9,"pattern":28,"phrasal verb":9,"phrase":86,"word":4});
assert.deepEqual(counts(newPhrases,"frequency"),{"frequent":65,"general":67,"limited":9});
assert.deepEqual(counts(newPhrases,"register"),{"casual":38,"formal":1,"neutral":99,"polite":3});
assert.deepEqual(counts(newPhrases,"priority"),{"2":58,"3":83});

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

assert.equal(byId.get("p2043").phrase,"Hang on.");
assert.equal(byId.get("p2043").episode,"S01E19");
assert.equal(byId.get("p2044").phrase,"freak out");
assert.equal(byId.get("p2044").episode,"S01E17");
assert.equal(byId.get("p1149").phrase,"hold on");
assert.equal(byId.get("p810").phrase,"freaked out");

assert.equal(byId.get("p335").phrase,"be cool with ~");
assert.equal(byId.get("p335").episode,"S02E16");
assert.match(byId.get("p335").note,/not be cool with/);
assert.equal(byId.get("p216").phrase,"on so many levels");
assert.equal(byId.get("p216").episode,"S02E17");
assert.equal(byId.get("p1393").phrase,"name A after B");
assert.match(byId.get("p1393").note,/be named after/);
assert.equal(byId.get("p209").phrase,"Tell me about it");
assert.equal(byId.get("p209").episode,"S02E18");

const legacyPhrases=phrases.filter(phrase=>Number(phrase.id.slice(1))<=3300);
const exactDuplicates=Object.fromEntries([...new Set(legacyPhrases.map(phrase=>phrase.phrase.toLowerCase()))]
  .map(headline=>[headline,legacyPhrases.filter(phrase=>phrase.phrase.toLowerCase()===headline).map(phrase=>phrase.id).sort()])
  .filter(([,ids])=>ids.length>1));
assert.deepEqual(exactDuplicates,{
  "you got me.":["p1371","p2942"],
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
  "get into ~":["p3050","p576"],
  "go away":["p1636","p3004"],
  "go through ~":["p1099","p1546","p1708","p2429"],
  "go with ~":["p1212","p1776"],
  "gotcha.":["p2848","p2985"],
  "hold someone up":["p1194","p3087"],
  "lie around":["p1585","p3038"],
  "make it":["p1502","p1557","p514"],
  "on the side":["p2668","p2965","p3020"],
  "open up":["p1385","p2040"],
  "out there":["p1487","p608"],
  "pick someone up":["p1325","p1551"],
  "that’s it.":["p1152","p2445"],
  "have something worked out":["p3195","p604"],
  "damage control":["p3228","p637"],
  "throw someone off":["p3233","p502"],
  "hit it off":["p3261","p488"],
  "the third degree":["p3268","p470"],
  "watch ~":["p3016","p647"],
  "work out":["p1128","p1584"]
});
for(const ids of Object.values(exactDuplicates)){
  assert.equal(new Set(ids.map(id=>byId.get(id).meaning)).size,ids.length,`${ids.join(",")} must remain distinct senses`);
}

assert.equal(dialogues.length,326);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(dialogues.filter(d=>Number(d.id.slice(1))<=167))).digest("hex"),
  "bf247740e1e24622c9bee23004df5e881210ce42f57a69dc3f95694855acbe41"
);

console.log("Season 2 Batch 6 Phrase expansion tests passed");

// Full production snapshot; the existing-only snapshot above is supplementary.
assert.equal(dialogues.length,326);
assert.equal(crypto.createHash("sha256").update(JSON.stringify(dialogues)).digest("hex"),"19eadd7722fc37b54fd9d409f53f0a5ddefd56b3a928efc785941b0c374050cb");
