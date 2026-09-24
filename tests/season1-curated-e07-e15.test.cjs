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
assert.equal(phrases.length,3924);
assert.equal(byId.size,3924);
assert.equal(Math.max(...phrases.map(p=>Number(p.id.slice(1)))),4051);
const added=Array.from({length:302},(_,i)=>byId.get(`p${2534+i}`));
assert.ok(added.every(Boolean));
// Golden from the immutable curated drafts, with the prior-NEW update applied and IDs assigned.
const body=p=>Object.fromEntries(Object.entries(p).filter(([key])=>key!=="sourceOrder").sort(([a],[b])=>a.localeCompare(b)));
assert.equal(hash(added.map(body)),"46f969223475399f1cc156bf0d444ac7fa45d16d2ddad8a1b29fcd50ec124ee2");
const ordered=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(ordered.length,3781);
// Golden by ref from Astra_S1_E07-E15_Source_Order_Implementation_Package.json.
assert.equal(hash(ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"36b6d5020278962ca397480a7fcddb35476170f2e6ed4e0a287ff9546c8b68da");
// Preserve the original S1-only golden in addition to the expanded global sourceOrder scope.
const s1Ordered=ordered.filter(p=>/^S01E/.test(p.episode));
assert.equal(s1Ordered.length,1599);
assert.equal(hash(s1Ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"00882e8fb00fd4db24dcd75f0fdbd8633150e33a62de0849ab71fa7d5d708ce2");

const counts=[144,92,85,64,63,56,84,54,61,77,76,55,96,60,56];
const deferred=["p1336","p1345","p1076","p1174","p49","p265","p1216","p1224","p1225","p1227","p1228","p1229","p1231","p1232","p2069","p2194","p2201","p2205","p97","p1366","p1426","p1427","p1428","p1429"];
assert.equal(deferred.length,24);
for(const id of deferred){assert.ok(byId.has(id));assert.equal(byId.get(id).sourceOrder,undefined);}
assert.equal(phrases.filter(p=>/^S01E(0[1-9]|1[0-5])$/.test(p.episode)).length,1141);
for(const [id,episode,order] of [["p1226","S01E13",51],["p1230","S01E11",56],["p1233","S01E11",71],["p1160","S01E15",22]]){
 assert.equal(byId.get(id).episode,episode);assert.equal(byId.get(id).sourceOrder,order);
}
assert.equal(dialogues.length,326);
assert.equal(hash(dialogues.filter(d=>Number(d.id.slice(1))<=167)),"8c3289733bdf9cef958b7af354fc74dfffb35629edc6e6d8272f992b8349c2d2");
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
for(const episode of ["S02E01"]){const rows=phrases.filter(p=>p.episode===episode);assert.deepEqual(context.sortedPhrasesForDisplay(rows).map(p=>p.id),rows.map(p=>p.id));}
context.filters.phrase.episode="ALL";context.filters.phrase.season="ALL";
assert.equal(context.filteredPhrases().length,3924);
assert.deepEqual(plain(context.filteredPhrases(true).map(p=>p.id)),[added[0].id]);
for(const [key,value] of [["type","phrase"],["frequency","frequent"],["register","neutral"]]){
 context.filters.phrase[key]=value;const filtered=context.filteredPhrases();
 assert.ok(filtered.every(p=>p[key]===value));
 const displayed=context.sortedPhrasesForDisplay(filtered);
 // S2+ unresolved positions are relative to the filtered input, so sort/filter do not commute.
 // Build the complete expected ID list from full-list verified order and filtered unresolved slots.
 const fullOrder=context.sortedPhrasesForDisplay(phrases).filter(p=>p[key]===value);
 const expectedDisplay=[];
 for(const episode of [...new Set(fullOrder.map(p=>p.episode))]){
  const full=fullOrder.filter(p=>p.episode===episode);
  if(/^S01E/.test(episode)){expectedDisplay.push(...full);continue;}
  const original=filtered.filter(p=>p.episode===episode),valid=p=>Number.isInteger(p.sourceOrder)&&p.sourceOrder>0;
  const verifiedOrder=full.filter(valid);let cursor=0;
  expectedDisplay.push(...original.map(p=>valid(p)?verifiedOrder[cursor++]:p));
 }
 assert.deepEqual(displayed.map(p=>p.id),expectedDisplay.map(p=>p.id));
 context.filters.phrase[key]="all";
}
console.log("Season 1 E07-E15 curated records, source order, filters and detail navigation tests passed");

// Full production snapshot; the existing-only snapshot above is supplementary.
assert.equal(dialogues.length,326);
assert.equal(hash(dialogues),"1329bdf07f5b5364ee5d605ea3f49aea749c9ea43e3c1fe45dd577218d5da62b");
