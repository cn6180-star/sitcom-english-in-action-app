"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const datasets=Array.from({length:9},(_,i)=>({file:`data/season${i+1}.json`,data:JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8'))}));
const phrases=datasets.flatMap(x=>x.data.phrases),dialogues=datasets.flatMap(x=>x.data.dialogues);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canonical=p=>Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
const expected={"S02E01": ["p1442", "p1566", "p1443", "p1444", "p1445", "p1769", "p1447", "p131", "p665", "p1448", "p132", "p1907", "p1450", "p1773", "p198", "p1452", "p134", "p1453", "p1454", "p1455", "p135", "p136", "p1456", "p1457", "p2215"], "S02E02": ["p1458", "p1459", "p1460", "p1462", "p2216", "p1463", "p1464", "p1688", "p1465", "p1468", "p382", "p759", "p215", "p831", "p1568", "p137"], "S02E03": ["p1474", "p839", "p1476", "p237", "p436", "p1478", "p1479", "p1774", "p225", "p584", "p1482", "p1483", "p138", "p1911", "p1913", "p1485", "p431", "p1486", "p1487", "p1488", "p141", "p240", "p1093"], "S02E04": ["p1489", "p1492", "p1575", "p1494", "p1495", "p1496", "p1499", "p142", "p1501", "p1502", "p1503", "p143", "p1505", "p1506", "p1507", "p395", "p1778", "p145", "p1508", "p1916", "p146", "p1691", "p1510", "p1511", "p147"], "S02E05": ["p1512", "p148", "p1693", "p1513", "p149", "p1514", "p150", "p1515", "p1516", "p420", "p151", "p1518", "p1519", "p1520", "p1522", "p1523", "p1524", "p1525", "p224", "p1527", "p1922", "p1781", "p1530", "p2217", "p1532", "p1533", "p1534"], "S02E06": ["p1782", "p1536", "p1537", "p1538", "p344", "p1539", "p153", "p1540", "p1541", "p154", "p1542", "p1543", "p1544", "p1545", "p1546", "p1547", "p1548", "p1551", "p1552", "p1553", "p169", "p1554", "p1555", "p155", "p1556", "p1557", "p2218", "p1558", "p1559"], "S02E07": ["p800", "p1583", "p1584", "p1585", "p156", "p157", "p1587", "p1588", "p1589", "p1591", "p1592", "p1593", "p1594", "p1596", "p2219", "p158", "p1597", "p1598", "p159", "p1599", "p1602", "p1612", "p160", "p1604", "p1605", "p1606", "p233", "p1607", "p161", "p1608", "p1609", "p1610", "p1611"], "S02E08": ["p1613", "p1614", "p1616", "p563", "p1617", "p1621", "p1622", "p1623", "p1624", "p1625", "p377", "p866", "p1627", "p1628", "p813", "p1629", "p1630", "p1632", "p163", "p1633", "p165", "p1634", "p1637", "p1638", "p1639", "p1640", "p1644", "p370", "p1645", "p601", "p1642", "p1646", "p1643"]};
const verified=new Set(Object.values(expected).flat());
const reviews=[{"id": "p164", "file": "data/season2.json", "arrayIndex": 29}, {"id": "p166", "file": "data/season2.json", "arrayIndex": 31}, {"id": "p1698", "file": "data/season2.json", "arrayIndex": 384}];
assert.equal(phrases.length,3106);assert.equal(new Set(phrases.map(p=>p.id)).size,3106);
assert.equal(Math.max(...phrases.map(p=>Number(p.id.slice(1)))),3154);
const scope=phrases.filter(p=>/^S02E0[1-8]$/.test(p.episode));assert.equal(scope.length,214);
assert.equal(verified.size,211);assert.equal(reviews.length,3);
const restored=phrases.map(p=>{const q={...p};if(verified.has(q.id))delete q.sourceOrder;return q;}).sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1))).map(canonical);
// All 3,106 complete Phrase records are covered; only the 211 expressly authorized sourceOrder additions are removed for comparison.
assert.equal(hash(restored),'86b907eca8e474f9db83a31729b48203255440dd7150a87426bf28e690111f5f');
const membership=datasets.flatMap(x=>x.data.phrases.map(p=>[p.id,x.file]));
// Physical file membership is invariant independently of permitted order changes.
assert.equal(hash([...membership].sort((a,b)=>Number(a[0].slice(1))-Number(b[0].slice(1)))),'cbbbbe2f41e0d3fdb066e7ce8325af242720762b967333e8553f1d5d7afdc4b8');
const layout=datasets.flatMap(x=>x.data.phrases.map((p,i)=>[x.file,i,verified.has(p.id)?'TARGET:'+p.episode:p.id]));
assert.equal(hash(layout),'2007e857769229fbd6556c45b959809622dd5864a76771d2a1629c937ab05df5');
for(const r of reviews){const p=datasets.find(x=>x.file===r.file).data.phrases[r.arrayIndex];assert.equal(p.id,r.id);assert.equal(Object.hasOwn(p,'sourceOrder'),false);}
for(const [episode,ids] of Object.entries(expected)){
 const rows=scope.filter(p=>p.episode===episode&&verified.has(p.id)).sort((a,b)=>a.sourceOrder-b.sourceOrder);
 assert.deepEqual(rows.map(p=>p.id),ids,`${episode}: approved source order mapping`);
 assert.deepEqual(rows.map(p=>p.sourceOrder),ids.map((_,i)=>i+1),`${episode}: contiguous verified-only ranks`);
 for(const x of datasets){const actual=x.data.phrases.filter(p=>p.episode===episode&&verified.has(p.id)).map(p=>p.sourceOrder);assert.deepEqual(actual,[...actual].sort((a,b)=>a-b),`${episode}: physical array verified slots`);}
}
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'data/season1.json'))).digest('hex'),'c413b38b7fa31fb916d66d449eb18431fdb283eccee77c1466725adcbcc8a734');
assert.equal(dialogues.length,204);
assert.equal(hash(dialogues),'8e74658e50349dd6e3ed37dd4d05148b71d529c3cd692231d375c7ac14ab3989');
assert.equal(hash(dialogues.filter(d=>Number(d.id.slice(1))<=167)),'fc1087f5d916efabb5c1a93591f629102283d89663afe71e3da88397df99eb90');
const ids=new Set(phrases.map(p=>p.id));assert.deepEqual(dialogues.flatMap(d=>d.phraseLinks.filter(id=>!ids.has(id))),[]);
console.log('Friends S2 E01-E08 sourceOrder integrity passed (211 verified; 3 explicitly deferred, not complete-coverage approval).');

// Run the production sorter against merged data, filtered inputs and legacy S1 output.
const vm=require('node:vm'),cp=require('node:child_process');
const extract=s=>s.split(/\r?\n/).find(l=>l.startsWith('function sortedPhrasesForDisplay('));
const ctx={seasonNum:s=>Number(s.match(/S(\d+)/)[1]),episodeNumber:s=>Number(s.match(/E(\d+)/)[1])};vm.createContext(ctx);
vm.runInContext(extract(cp.execFileSync('git',['show','HEAD:js/app.js'],{cwd:root,encoding:'utf8'})).replace('function sortedPhrasesForDisplay(','function legacySort('),ctx);
vm.runInContext(extract(fs.readFileSync(path.join(root,'js/app.js'),'utf8')),ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
for(const input of [phrases,phrases.filter(p=>p.priority===3),phrases.filter(p=>p.frequency==='frequent'),[...phrases].reverse()]){
 const s1=input.filter(p=>/^S01E/.test(p.episode));assert.deepEqual(plain(ctx.sortedPhrasesForDisplay(s1).map(p=>p.id)),plain(ctx.legacySort(s1).map(p=>p.id)),'S1 display unchanged including unresolved fallback');
 for(const [episode,expectedIds] of Object.entries(expected)){
  const original=input.filter(p=>p.episode===episode),result=plain(ctx.sortedPhrasesForDisplay(original));
  const wanted=expectedIds.filter(id=>original.some(p=>p.id===id));
  assert.deepEqual(result.filter(p=>verified.has(p.id)).map(p=>p.id),wanted,`${episode} merged display`);
  for(let i=0;i<original.length;i++)if(!verified.has(original[i].id))assert.equal(result[i].id,original[i].id,`${episode} unresolved original display slot`);
 }
}
const sample=[{id:'a',episode:'S03E01',sourceOrder:2},{id:'u',episode:'S03E01'},{id:'b',episode:'S03E01',sourceOrder:1},{id:'null',episode:'S03E01',sourceOrder:null},{id:'zero',episode:'S03E01',sourceOrder:0},{id:'str',episode:'S03E01',sourceOrder:'1'},{id:'fraction',episode:'S03E01',sourceOrder:1.5}];
assert.deepEqual(plain(ctx.sortedPhrasesForDisplay(sample).map(p=>p.id)),['b','u','a','null','zero','str','fraction']);
assert.deepEqual(sample.map(p=>p.id),['a','u','b','null','zero','str','fraction'],'input not mutated');
const mixed=[{id:'later',episode:'S03E02',sourceOrder:1},{id:'first',episode:'S02E01',sourceOrder:9},{id:'middle',episode:'S03E01',sourceOrder:2}];
assert.deepEqual(plain(ctx.sortedPhrasesForDisplay(mixed).map(p=>p.id)),['first','middle','later'],'no cross-episode rank comparison');
console.log('Merged S2 display, unresolved slots, filtered inputs, other seasons and S1 legacy comparison passed.');
