"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const datasets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,"data",`season${i+1}.json`),"utf8")));
const phrases=datasets.flatMap(d=>d.phrases),dialogues=datasets.flatMap(d=>d.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"),canonical=p=>Object.fromEntries(Object.entries(p).sort(([a],[b])=>a.localeCompare(b)));
assert.equal(phrases.length,3248);assert.equal(byId.size,3248);assert.equal(Math.max(...phrases.map(p=>+p.id.slice(1))),3300);assert.equal(phrases.filter(p=>p.episode.startsWith("S01")).length,1623);
const aNew=Array.from({length:110},(_,i)=>byId.get(`p${2953+i}`)),bNew=Array.from({length:92},(_,i)=>byId.get(`p${3063+i}`));assert.ok([...aNew,...bNew].every(Boolean));
assert.equal(hash(aNew.map(canonical)),"f3de712c45ac957371631e016deae50d6ba83dd89d6132a41acf3b40a0c63baa");
assert.equal(hash(bNew.map(canonical)),"56a1440ad6651e72ebc03412b45ca0d617f5c86df88165e5b02f7f38cb940723");
const aUpdates=["p1696","p1500","p1776","p1756","p1652","p2078","p1964","p437","p1987","p1923","p392","p2014","p1497","p2105","p430","p446","p2801","p874","p181","p1786","p1818","p1983","p2013","p2043","p1052","p111","p586","p1399"];
const bUpdates=["p1796","p2832","p2071","p1978","p613","p1854","p1618","p592","p1466","p2292","p738","p1914","p1590","p1136","p1626","p2319","p383","p293","p129","p576","p1449","p1694","p1723","p1919","p1926","p1932","p2240","p125","p1422","p1753"];
assert.equal(aUpdates.length,28);assert.equal(bUpdates.length,30);
assert.equal(hash(aUpdates.map(id=>canonical(byId.get(id)))),"94341a4f9de1286849be681ab247554b14120b53d3017110dbce31eff4252138");
assert.equal(hash(bUpdates.map(id=>canonical(byId.get(id)))),"254e96d4ff84ceef9249a8e2a4133c75452ffb34ba7f646f17ae41789152541a");
const ordered=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(ordered.length,2531);assert.equal(hash(ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"b95d604ff525c5922fbb7f27b87ece907b512683f49e06b0b7df1be885980046");
// Preserve the original S1-only golden in addition to the expanded global sourceOrder scope.
const s1Ordered=ordered.filter(p=>/^S01E/.test(p.episode));
assert.equal(s1Ordered.length,1599);
assert.equal(hash(s1Ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"00882e8fb00fd4db24dcd75f0fdbd8633150e33a62de0849ab71fa7d5d708ce2");

const deferred=["p1336","p1345","p1076","p1174","p49","p265","p1216","p1224","p1225","p1227","p1228","p1229","p1231","p1232","p2069","p2194","p2201","p2205","p97","p1366","p1426","p1427","p1428","p1429"];
assert.equal(deferred.length,24);for(const id of deferred){assert.ok(byId.has(id));assert.equal(byId.get(id).sourceOrder,undefined,`${id} must remain deferred`);}
for(const [episode,target,orderedCount] of [["S01E19",51,51],["S01E20",57,57],["S01E21",51,51],["S01E22",48,48],["S01E23",48,44],["S01E24",53,53]]){const rows=phrases.filter(p=>p.episode===episode),orders=rows.filter(p=>p.sourceOrder!==undefined).map(p=>p.sourceOrder).sort((a,b)=>a-b);assert.equal(rows.length,target);assert.deepEqual(orders,Array.from({length:orderedCount},(_,i)=>i+1));}
assert.deepEqual([byId.get("p2071").phrase,byId.get("p2071").episode,byId.get("p2071").sourceOrder],["Things happen.","S01E22",16]);
assert.deepEqual([byId.get("p3143").phrase,byId.get("p3143").episode,byId.get("p3143").sourceOrder,byId.get("p3143").frequency,byId.get("p3143").register],["give someone the deep freeze","S01E24",28,"limited","casual"]);
assert.equal(phrases.some(p=>p.phrase==="frame of graft"),false);
assert.equal(dialogues.length,198);assert.equal(hash(dialogues.filter(d=>Number(d.id.slice(1))<=167)),"74124dd44ce691184e75d04368785186e04891080f76867bef1775ee4f3a7457");assert.deepEqual(dialogues.flatMap(d=>(d.phraseLinks||[]).filter(id=>!byId.has(id))),[]);

const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");const context={PHRASES:phrases,seasonNum:s=>Number(s.match(/S(\d+)/)[1]),episodeNumber:s=>Number(s.match(/E(\d+)/)[1]),filters:{phrase:{season:"1",episode:"19",type:"all",frequency:"all",register:"all"}},phraseScopeFrom:()=>"all",bookmarked:()=>false,isWeak:()=>false,isLearned:()=>false,setContinue:()=>{},render:()=>{},route:{name:"phrases",params:{}},lastListContext:null};context.navigate=(name,params)=>{context.route={name,params};};vm.createContext(context);
for(const name of ["filteredPhrases","sortedPhrasesForDisplay","phraseNavigationIds","openPhrase","phraseMove"]){const fn=source.split(/\r?\n/).find(line=>line.startsWith(`function ${name}(`));assert.ok(fn,name);vm.runInContext(fn,context);}const plain=value=>JSON.parse(JSON.stringify(value));
for(const [episode,count] of [[19,51],[20,57],[21,51],[22,48],[23,44],[24,53]]){context.filters.phrase.episode=String(episode);const original=context.filteredPhrases(),displayed=context.sortedPhrasesForDisplay(original);assert.deepEqual(plain(displayed.slice(0,count).map(p=>p.sourceOrder)),Array.from({length:count},(_,i)=>i+1));assert.deepEqual(plain(displayed.slice(count).map(p=>p.id)),original.filter(p=>p.sourceOrder===undefined).map(p=>p.id));context.route={name:"phrases",params:{}};context.lastListContext={ids:displayed.map(p=>p.id)};context.openPhrase(displayed[0].id);assert.deepEqual(plain(context.phraseNavigationIds()),displayed.map(p=>p.id));context.phraseMove(1);assert.equal(context.route.params.id,displayed[1].id);}
context.filters.phrase.episode="ALL";for(const [key,value] of [["type","phrase"],["frequency","frequent"],["register","neutral"]]){context.filters.phrase[key]=value;const filtered=context.filteredPhrases();assert.ok(filtered.every(p=>p[key]===value));assert.deepEqual(context.sortedPhrasesForDisplay(filtered).map(p=>p.id),context.sortedPhrasesForDisplay(phrases.filter(p=>p.episode.startsWith("S01")&&p[key]===value)).map(p=>p.id));context.filters.phrase[key]="all";}
const s2=phrases.filter(p=>p.episode==="S02E01");assert.deepEqual(context.sortedPhrasesForDisplay(s2).map(p=>p.id),s2.map(p=>p.id));
console.log("Season 1 E19-E24 final curated records, source order, filters and detail navigation tests passed");

// Full production snapshot; the existing-only snapshot above is supplementary.
assert.equal(dialogues.length,198);
assert.equal(hash(dialogues),"b1753aede256a939809c5f94e0f41c84942cde09ab912e48564772b3e814d0b5");
