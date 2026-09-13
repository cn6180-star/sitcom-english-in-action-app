"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,"data",`season${i+1}.json`),"utf8")));
const phrases=datasets.flatMap(d=>d.phrases),dialogues=datasets.flatMap(d=>d.dialogues);
const byId=new Map(phrases.map(p=>[p.id,p]));
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
assert.equal(phrases.length,2904);
assert.equal(byId.size,2904);
assert.equal(Math.max(...phrases.map(p=>Number(p.id.slice(1)))),2952);
const added=Array.from({length:302},(_,i)=>byId.get(`p${2534+i}`));
assert.ok(added.every(Boolean));
// Golden from the immutable curated drafts, with the prior-NEW update applied and IDs assigned.
const body=p=>Object.fromEntries(Object.entries(p).filter(([key])=>key!=="sourceOrder").sort(([a],[b])=>a.localeCompare(b)));
assert.equal(hash(added.map(body)),"7bb36b069c193af4a4a6a996a9dc95403f0e7029e866d53553e80d2c70374c7c");
const ordered=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(ordered.length,1262);
// Golden by ref from Astra_S1_E07-E15_Source_Order_Implementation_Package.json.
assert.equal(hash(ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"efa16f33c884d209117855f15ff0a6f91a5f9b9fc1f76a97c4dd51ad240dc0e4");
const counts=[140,90,81,62,60,54,83,53,60,74,73,54,94,59,56];
const deferred=["p1336","p1345","p1136","p1076","p1174","p49","p613","p265","p1216","p1224","p1225","p1227","p1228","p1229","p1231","p1232","p2069","p2194","p2201","p2205","p97","p2071","p1366"];
assert.equal(deferred.length,23);
for(const id of deferred){assert.ok(byId.has(id));assert.equal(byId.get(id).sourceOrder,undefined);}
assert.equal(phrases.filter(p=>/^S01E(0[1-9]|1[0-5])$/.test(p.episode)).length,1113);
for(const [id,episode,order] of [["p1226","S01E13",50],["p1230","S01E11",54],["p1233","S01E11",68],["p1160","S01E15",22]]){
 assert.equal(byId.get(id).episode,episode);assert.equal(byId.get(id).sourceOrder,order);
}
assert.equal(dialogues.length,167);
assert.equal(hash(dialogues),"fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90");
assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!byId.has(id))),[]);

// Exercise the actual list filter, sorter, and detail pager without browser layout dependencies.
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const context={PHRASES:phrases,seasonNum:s=>Number(s.match(/S(\d+)/)[1]),episodeNumber:s=>Number(s.match(/E(\d+)/)[1]),
 filters:{phrase:{season:"1",episode:"ALL",type:"all",frequency:"all",register:"all"}},
 phraseScopeFrom:()=>"all",bookmarked:(_,id)=>id===added[0].id,isWeak:()=>false,isLearned:()=>false,
 setContinue:()=>{},render:()=>{},route:{name:"phrases",params:{}},lastListContext:null};
context.navigate=(name,params)=>{context.route={name,params};};
vm.createContext(context);
for(const name of ["filteredPhrases","sortedPhrasesForDisplay","phraseNavigationIds","openPhrase","phraseMove"]){
 const fn=source.split(/\r?\n/).find(line=>line.startsWith(`function ${name}(`));assert.ok(fn,name);vm.runInContext(fn,context);
}
const plain=value=>JSON.parse(JSON.stringify(value));
for(let i=1;i<=15;i++){
 const episode=`S01E${String(i).padStart(2,"0")}`;
 context.filters.phrase.episode=String(i);
 const original=context.filteredPhrases(),displayed=context.sortedPhrasesForDisplay(original);
 assert.equal(displayed.length,original.length);
 assert.deepEqual(plain(displayed.slice(0,counts[i-1]).map(p=>p.sourceOrder)),Array.from({length:counts[i-1]},(_,j)=>j+1));
 assert.deepEqual(plain(displayed.slice(counts[i-1]).map(p=>p.id)),phrases.filter(p=>p.episode===episode&&p.sourceOrder===undefined).map(p=>p.id));
 context.route={name:"phrases",params:{}};context.lastListContext={ids:displayed.map(p=>p.id)};
 context.openPhrase(displayed[0].id);
 assert.deepEqual(plain(context.phraseNavigationIds()),displayed.map(p=>p.id));
 context.phraseMove(1);assert.equal(context.route.params.id,displayed[1].id);
 context.phraseMove(-1);assert.equal(context.route.params.id,displayed[0].id);
 assert.deepEqual(original.map(p=>p.id),phrases.filter(p=>p.episode===episode).map(p=>p.id));
}
for(const episode of ["S01E19","S02E01"]){const rows=phrases.filter(p=>p.episode===episode);assert.deepEqual(context.sortedPhrasesForDisplay(rows).map(p=>p.id),rows.map(p=>p.id));}
context.filters.phrase.episode="ALL";context.filters.phrase.season="ALL";
assert.equal(context.filteredPhrases().length,2904);
assert.deepEqual(plain(context.filteredPhrases(true).map(p=>p.id)),[added[0].id]);
for(const [key,value] of [["type","phrase"],["frequency","frequent"],["register","neutral"]]){
 context.filters.phrase[key]=value;const filtered=context.filteredPhrases();
 assert.ok(filtered.every(p=>p[key]===value));
 const displayed=context.sortedPhrasesForDisplay(filtered);
 assert.deepEqual(displayed.map(p=>p.id),context.sortedPhrasesForDisplay(phrases).filter(p=>p[key]===value).map(p=>p.id));
 context.filters.phrase[key]="all";
}
console.log("Season 1 E07-E15 curated records, source order, filters and detail navigation tests passed");
