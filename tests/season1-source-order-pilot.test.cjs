"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,index)=>
  JSON.parse(fs.readFileSync(path.join(root,"data",`season${index+1}.json`),"utf8"))
);
const phrases=datasets.flatMap(dataset=>dataset.phrases||[]);
const dialogues=datasets.flatMap(dataset=>dataset.dialogues||[]);
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const phraseIds=new Set(byId.keys());

assert.equal(phrases.length,2485);
assert.equal(phraseIds.size,2485);
assert.equal(dialogues.length,167);
assert.deepEqual(dialogues.flatMap(dialogue=>(dialogue.phraseLinks||[])
  .filter(id=>!phraseIds.has(id)).map(id=>`${dialogue.id}:${id}`)),[]);

const ordered=phrases.filter(phrase=>Object.prototype.hasOwnProperty.call(phrase,"sourceOrder"));
assert.equal(ordered.length,458);
assert.equal(ordered.filter(phrase=>!/^S01E0[1-6]$/.test(phrase.episode)).length,0);
const expectedCounts={S01E01:124,S01E02:86,S01E03:77,S01E04:60,S01E05:59,S01E06:52};
for(const [episode,count] of Object.entries(expectedCounts)){
  const episodePhrases=ordered.filter(phrase=>phrase.episode===episode);
  assert.equal(episodePhrases.length,count,`${episode} ordered count mismatch`);
  assert.deepEqual(episodePhrases.map(phrase=>phrase.sourceOrder).sort((a,b)=>a-b),
    Array.from({length:count},(_,index)=>index+1),`${episode} sourceOrder sequence mismatch`);
}

const mapping=ordered.sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder)
  .map(phrase=>[phrase.id,phrase.episode,phrase.sourceOrder]);
assert.equal(
  crypto.createHash("sha256").update(JSON.stringify(mapping)).digest("hex"),
  "edfc62b95252d2d436ebaa854ff8fd677e4dfcd864dc943d1df07637fad9d42c"
);

for(const id of["p1136","p1160","p1076","p1174","p1336","p1345"]){
  assert.equal(Object.prototype.hasOwnProperty.call(byId.get(id),"sourceOrder"),false,`${id} must remain deferred`);
}

const appSource=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const sortedSource=appSource.match(/function sortedPhrasesForDisplay\(items\)\{[^\n]+\}/)?.[0];
assert.ok(sortedSource);
const context={
  seasonNum:value=>Number(String(value).match(/S(\d+)/)?.[1]),
  episodeNumber:value=>Number(String(value).match(/E(\d+)/)?.[1])
};
vm.createContext(context);
vm.runInContext(`${sortedSource};this.sortedPhrasesForDisplay=sortedPhrasesForDisplay;`,context);
const sort=items=>context.sortedPhrasesForDisplay(items);

const e01=phrases.filter(phrase=>phrase.episode==="S01E01");
const sortedE01=sort(e01);
assert.equal(sortedE01.length,124);
assert.deepEqual(sortedE01.slice(0,4).map(phrase=>phrase.phrase),[
  "There’s nothing to tell.","come on","go out with someone","There’s gotta be something wrong with ~."
]);
assert.deepEqual(sortedE01.map(phrase=>phrase.sourceOrder),Array.from({length:124},(_,index)=>index+1));

for(const [episode,deferredIds] of Object.entries({
  S01E03:["p1136"],S01E04:["p1160"],S01E05:["p1076","p1174"]
})){
  const original=phrases.filter(phrase=>phrase.episode===episode);
  const displayed=sort(original);
  const orderedCount=expectedCounts[episode];
  assert.deepEqual(displayed.slice(0,orderedCount).map(phrase=>phrase.sourceOrder),
    Array.from({length:orderedCount},(_,index)=>index+1));
  assert.deepEqual(displayed.slice(orderedCount).map(phrase=>phrase.id),
    original.filter(phrase=>deferredIds.includes(phrase.id)).map(phrase=>phrase.id));
}

const outsidePilot=phrases.filter(phrase=>phrase.episode==="S01E07");
assert.deepEqual(sort(outsidePilot).map(phrase=>phrase.id),outsidePilot.map(phrase=>phrase.id));
const fixture=[
  {id:"later",episode:"S01E01",sourceOrder:2},
  {id:"deferred-a",episode:"S01E01"},
  {id:"first",episode:"S01E01",sourceOrder:1},
  {id:"outside-b",episode:"S01E07",sourceOrder:1},
  {id:"outside-a",episode:"S01E07",sourceOrder:2},
  {id:"deferred-b",episode:"S01E01"}
];
assert.deepEqual(sort(fixture).map(item=>item.id),[
  "first","later","deferred-a","deferred-b","outside-b","outside-a"
]);
assert.deepEqual(fixture.map(item=>item.id),[
  "later","deferred-a","first","outside-b","outside-a","deferred-b"
]);

assert.match(appSource,/const list=sortedPhrasesForDisplay\(filteredPhrases\(bookmarkedOnly\)\)/);
assert.match(appSource,/lastListContext=\{type:bookmarkedOnly\?"bookmarks":"phrases",ids:list\.map\(x=>x\.id\)\}/);
assert.match(appSource,/fromPhraseList&&lastListContext\?\.ids\?\.includes\(id\)\?\[\.\.\.lastListContext\.ids\]/);
assert.match(appSource,/const ids=phraseNavigationIds\(p\.id\),pos=ids\.indexOf\(p\.id\)/);

console.log("Season 1 E01-E06 source order pilot tests passed");
