"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,"data",`season${i+1}.json`),"utf8")));
const phrases=datasets.flatMap(d=>d.phrases),dialogues=datasets.flatMap(d=>d.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const canonical=p=>Object.fromEntries(Object.entries(p).sort(([a],[b])=>a.localeCompare(b)));

assert.equal(phrases.length,2904);
assert.equal(byId.size,2904);
assert.equal(Math.max(...phrases.map(p=>Number(p.id.slice(1)))),2952);
assert.equal(phrases.filter(p=>p.episode.startsWith("S01")).length,1374);
const added=Array.from({length:117},(_,i)=>byId.get(`p${2836+i}`));
assert.ok(added.every(Boolean));
assert.equal(hash(added.map(canonical)),"abadb45eecc1eae30d2d21907fa5446179f31d7b57f9942f785ba56b85b6dc04");

const updateIds=["p1682","p491","p1572","p2281","p558","p1946","p642","p775","p513","p1601","p888","p1657","p1535","p1528","p1928","p2036","p2044","p1580","p1586","p1600","p1804","p1947","p2195","p1347","p1352","p112"];
assert.equal(updateIds.length,26);
assert.equal(hash(updateIds.map(id=>canonical(byId.get(id)))),"5742553590c98611a56c085ce8b876e67ae1ef239a798abe366a07838b4b8200");

const ordered=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(ordered.length,1262);
assert.equal(hash(ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"efa16f33c884d209117855f15ff0a6f91a5f9b9fc1f76a97c4dd51ad240dc0e4");
const deferred=["p1336","p1345","p1136","p1076","p1174","p49","p613","p265","p1216","p1224","p1225","p1227","p1228","p1229","p1231","p1232","p2069","p2194","p2201","p2205","p97","p2071","p1366"];
assert.equal(deferred.length,23);
for(const id of deferred){assert.ok(byId.has(id));assert.equal(byId.get(id).sourceOrder,undefined,`${id} must remain deferred`);}
for(const [episode,target,count] of [["S01E16",55,55],["S01E17",48,46],["S01E18",69,68]]){
 const rows=phrases.filter(p=>p.episode===episode),withOrder=rows.filter(p=>p.sourceOrder!==undefined);
 assert.equal(rows.length,target);assert.deepEqual(withOrder.map(p=>p.sourceOrder).sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));
}
assert.deepEqual([byId.get("p2870").phrase,byId.get("p2870").episode,byId.get("p2870").sourceOrder],["sleep together","S01E16",54]);
assert.deepEqual([byId.get("p2916").phrase,byId.get("p2916").episode,byId.get("p2916").sourceOrder],["get one's ya-yas","S01E18",24]);
assert.equal(dialogues.length,167);
assert.equal(hash(dialogues),"fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90");
assert.deepEqual(dialogues.flatMap(d=>(d.phraseLinks||[]).filter(id=>!byId.has(id))),[]);

const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const context={PHRASES:phrases,seasonNum:s=>Number(s.match(/S(\d+)/)[1]),episodeNumber:s=>Number(s.match(/E(\d+)/)[1]),filters:{phrase:{season:"1",episode:"16",type:"all",frequency:"all",register:"all"}},phraseScopeFrom:()=>"all",bookmarked:()=>false,isWeak:()=>false,isLearned:()=>false,setContinue:()=>{},render:()=>{},route:{name:"phrases",params:{}},lastListContext:null};
context.navigate=(name,params)=>{context.route={name,params};};vm.createContext(context);
for(const name of ["filteredPhrases","sortedPhrasesForDisplay","phraseNavigationIds","openPhrase","phraseMove"]){const fn=source.split(/\r?\n/).find(line=>line.startsWith(`function ${name}(`));assert.ok(fn,name);vm.runInContext(fn,context);}
const plain=value=>JSON.parse(JSON.stringify(value));
for(const [episode,orderedCount] of [[16,55],[17,46],[18,68]]){
 context.filters.phrase.episode=String(episode);const original=context.filteredPhrases(),displayed=context.sortedPhrasesForDisplay(original);
 assert.deepEqual(plain(displayed.slice(0,orderedCount).map(p=>p.sourceOrder)),Array.from({length:orderedCount},(_,i)=>i+1));
 assert.deepEqual(plain(displayed.slice(orderedCount).map(p=>p.id)),original.filter(p=>p.sourceOrder===undefined).map(p=>p.id));
 context.route={name:"phrases",params:{}};context.lastListContext={ids:displayed.map(p=>p.id)};context.openPhrase(displayed[0].id);
 assert.deepEqual(plain(context.phraseNavigationIds()),displayed.map(p=>p.id));context.phraseMove(1);assert.equal(context.route.params.id,displayed[1].id);
}
context.filters.phrase.episode="ALL";
for(const [key,value] of [["type","phrase"],["frequency","frequent"],["register","neutral"]]){context.filters.phrase[key]=value;const filtered=context.filteredPhrases();assert.ok(filtered.every(p=>p[key]===value));assert.deepEqual(context.sortedPhrasesForDisplay(filtered).map(p=>p.id),context.sortedPhrasesForDisplay(phrases.filter(p=>p.episode.startsWith("S01")&&p[key]===value)).map(p=>p.id));context.filters.phrase[key]="all";}
const e19=phrases.filter(p=>p.episode==="S01E19");assert.deepEqual(context.sortedPhrasesForDisplay(e19).map(p=>p.id),e19.map(p=>p.id));
console.log("Season 1 E16-E18 curated records, source order, filters and detail navigation tests passed");
