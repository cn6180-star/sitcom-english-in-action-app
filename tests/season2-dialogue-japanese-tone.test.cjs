'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const expected=require('./fixtures/friends-s2-japanese-tone.json');
const season=JSON.parse(fs.readFileSync('data/season2.json','utf8'));
const ids=Object.keys(expected);
assert.equal(ids.length,18);
const normalized={...season,dialogues:season.dialogues.map(d=>ids.includes(d.id)?{...d,lines:d.lines.map(l=>l.slice(0,2))}:d)};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(hash(normalized),'9ecf6fe59c79ddbec7203109e3f4dd0abc92889dbfaf084ecafbf9e12d0fb71a','only Japanese in the specified 18 Dialogues may change; English, metadata, links, Phrase DB and other S2 Dialogues frozen');
for(const id of ids){const d=season.dialogues.find(d=>d.id===id);assert.ok(d,id);assert.equal(d.lines.length,expected[id].length);assert.deepEqual(d.lines.map(l=>l[2]),expected[id],id+' exact reviewed Japanese');}
for(const id of ['d18','d205','d206','d208'])assert.ok(expected[id].every(line=>!/[やへ]ん|やで|せえへん|よか$/.test(line)),id+' polite situation without forced dialect');
console.log('S2 Japanese tone: 18 Dialogues, exact JP, English/links/metadata/non-target/Phrase freeze PASS');

