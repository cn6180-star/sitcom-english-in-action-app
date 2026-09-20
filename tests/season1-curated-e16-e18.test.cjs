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

assert.equal(phrases.length,3248);
assert.equal(byId.size,3248);
assert.equal(Math.max(...phrases.map(p=>Number(p.id.slice(1)))),3300);
assert.equal(phrases.filter(p=>p.episode.startsWith("S01")).length,1623);
const added=Array.from({length:117},(_,i)=>byId.get(`p${2836+i}`));
assert.ok(added.every(Boolean));
assert.equal(hash(added.map(canonical)),"2fd8b6464db63ebcfd20918642f32f8a772378451cfb5d60a7b2002119ec5b79");

const updateIds=["p1682","p491","p1572","p2281","p558","p1946","p642","p775","p513","p1601","p888","p1657","p1535","p1528","p1928","p2036","p2044","p1580","p1586","p1600","p1804","p1947","p2195","p1347","p1352","p112"];
assert.equal(updateIds.length,26);
assert.equal(hash(updateIds.map(id=>canonical(byId.get(id)))),"4d0feab43a80cbc5cf3c3b09db3e14b25735d5174a1f72756cfb57e273ca834f");

const ordered=phrases.filter(p=>p.sourceOrder!==undefined).sort((a,b)=>a.episode.localeCompare(b.episode)||a.sourceOrder-b.sourceOrder);
assert.equal(ordered.length,2531);
assert.equal(hash(ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"b95d604ff525c5922fbb7f27b87ece907b512683f49e06b0b7df1be885980046");
// Preserve the original S1-only golden in addition to the expanded global sourceOrder scope.
const s1Ordered=ordered.filter(p=>/^S01E/.test(p.episode));
assert.equal(s1Ordered.length,1599);
assert.equal(hash(s1Ordered.map(p=>[p.id,p.episode,p.sourceOrder])),"00882e8fb00fd4db24dcd75f0fdbd8633150e33a62de0849ab71fa7d5d708ce2");

const deferred=["p1336","p1345","p1076","p1174","p49","p265","p1216","p1224","p1225","p1227","p1228","p1229","p1231","p1232","p2069","p2194","p2201","p2205","p97","p1366","p1426","p1427","p1428","p1429"];
assert.equal(deferred.length,24);
for(const id of deferred){assert.ok(byId.has(id));assert.equal(byId.get(id).sourceOrder,undefined,`${id} must remain deferred`);}
for(const [episode,target,count] of [["S01E16",57,57],["S01E17",48,46],["S01E18",69,69]]){
 const rows=phrases.filter(p=>p.episode===episode),withOrder=rows.filter(p=>p.sourceOrder!==undefined);
 assert.equal(rows.length,target);assert.deepEqual(withOrder.map(p=>p.sourceOrder).sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));
}
assert.deepEqual([byId.get("p2870").phrase,byId.get("p2870").episode,byId.get("p2870").sourceOrder],["sleep together","S01E16",56]);
assert.deepEqual([byId.get("p2916").phrase,byId.get("p2916").episode,byId.get("p2916").sourceOrder],["get one's ya-yas","S01E18",24]);
assert.equal(dialogues.length,326);
assert.equal(hash(dialogues.filter(d=>Number(d.id.slice(1))<=167)),"74124dd44ce691184e75d04368785186e04891080f76867bef1775ee4f3a7457");
assert.deepEqual(dialogues.flatMap(d=>(d.phraseLinks||[]).filter(id=>!byId.has(id))),[]);

const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const context={PHRASES:phrases,seasonNum:s=>Number(s.match(/S(\d+)/)[1]),episodeNumber:s=>Number(s.match(/E(\d+)/)[1]),filters:{phrase:{season:"1",episode:"16",type:"all",frequency:"all",register:"all"}},phraseScopeFrom:()=>"all",bookmarked:()=>false,isWeak:()=>false,isLearned:()=>false,setContinue:()=>{},render:()=>{},route:{name:"phrases",params:{}},lastListContext:null};
context.navigate=(name,params)=>{context.route={name,params};};vm.createContext(context);
for(const name of ["filteredPhrases","sortedPhrasesForDisplay","phraseNavigationIds","openPhrase","phraseMove"]){const fn=source.split(/\r?\n/).find(line=>line.startsWith(`function ${name}(`));assert.ok(fn,name);vm.runInContext(fn,context);}
const plain=value=>JSON.parse(JSON.stringify(value));
for(const [episode,orderedCount] of [[16,57],[17,46],[18,69]]){
 context.filters.phrase.episode=String(episode);const original=context.filteredPhrases(),displayed=context.sortedPhrasesForDisplay(original);
 assert.deepEqual(plain(displayed.slice(0,orderedCount).map(p=>p.sourceOrder)),Array.from({length:orderedCount},(_,i)=>i+1));
 assert.deepEqual(plain(displayed.slice(orderedCount).map(p=>p.id)),original.filter(p=>p.sourceOrder===undefined).map(p=>p.id));
 context.route={name:"phrases",params:{}};context.lastListContext={ids:displayed.map(p=>p.id)};context.openPhrase(displayed[0].id);
 assert.deepEqual(plain(context.phraseNavigationIds()),displayed.map(p=>p.id));context.phraseMove(1);assert.equal(context.route.params.id,displayed[1].id);
}
context.filters.phrase.episode="ALL";
for(const [key,value] of [["type","phrase"],["frequency","frequent"],["register","neutral"]]){context.filters.phrase[key]=value;const filtered=context.filteredPhrases();assert.ok(filtered.every(p=>p[key]===value));assert.deepEqual(context.sortedPhrasesForDisplay(filtered).map(p=>p.id),context.sortedPhrasesForDisplay(phrases.filter(p=>p.episode.startsWith("S01")&&p[key]===value)).map(p=>p.id));context.filters.phrase[key]="all";}
const legacy=phrases.filter(p=>p.episode==="S02E01");assert.deepEqual(context.sortedPhrasesForDisplay(legacy).map(p=>p.id),legacy.map(p=>p.id));
console.log("Season 1 E16-E18 curated records, source order, filters and detail navigation tests passed");

// Full production snapshot; the existing-only snapshot above is supplementary.
assert.equal(dialogues.length,326);
assert.equal(hash(dialogues),"2513b2e0b0d33fc394708478309410fa41944cf2654b3b85dfdd5fc21fbed33e");
