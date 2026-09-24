'use strict';
// Core schema and identity checks; the final 43 records are frozen exactly in
// season1-dialogue-full-density.test.cjs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const dialogues=sets.flatMap(set=>set.dialogues),phrases=sets.flatMap(set=>set.phrases),phraseIds=new Set(phrases.map(phrase=>phrase.id));
assert.equal(dialogues.length,326);assert.equal(sets[0].dialogues.length,108);
assert.equal(new Set(dialogues.map(dialogue=>dialogue.id)).size,326);assert.equal(phraseIds.size,3924);
for(const dialogue of dialogues){
  for(const key of ['id','season','title','category','lines','phraseLinks'])assert.ok(Object.prototype.hasOwnProperty.call(dialogue,key));
  assert.ok(Object.keys(dialogue).every(key=>['id','season','title','category','lines','phraseLinks','series'].includes(key)));
  assert.ok(dialogue.id&&dialogue.season&&dialogue.title&&dialogue.category);
  assert.equal(new Set(dialogue.phraseLinks).size,dialogue.phraseLinks.length);
  dialogue.phraseLinks.forEach(id=>assert.ok(phraseIds.has(id),'broken Phrase link '+dialogue.id+'/'+id));
  dialogue.lines.forEach(line=>{assert.equal(line.length,3);assert.ok(line[0]&&line[1].trim()&&line[2].trim());});
  assert.equal(dialogues.filter(item=>item.season===dialogue.season&&JSON.stringify(item.lines.map(line=>line[1]))===JSON.stringify(dialogue.lines.map(line=>line[1]))).length,1,'duplicate Dialogue body');
}
console.log('curated Dialogue schema, identity, links and duplicates passed');
