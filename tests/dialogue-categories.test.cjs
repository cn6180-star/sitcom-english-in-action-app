const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const datasets=Array.from({length:9},(_,index)=>JSON.parse(fs.readFileSync(path.join(root,"data",`season${index+1}.json`),"utf8")));
const dialogues=datasets.flatMap(dataset=>dataset.dialogues||[]);
const phrases=datasets.flatMap(dataset=>dataset.phrases||[]);
const allowed=["日常","仕事","相談","人間関係","恋愛","トラブル","メンタル","雑談","友人","買い物","挑戦","家族","健康","旅行"];
const category=dialogue=>typeof dialogue.category==="string"&&dialogue.category.trim()?dialogue.category.trim():(String(dialogue.title||"").match(/^([^①②③④⑤⑥⑦⑧⑨⑩（(]+)/)?.[1]?.trim()||"");
const seasonNumber=value=>Number(String(value||"").match(/\d+/)?.[0])||0;
const episodeNumber=value=>Number(String(value||"").match(/E(\d+)/i)?.[1])||0;
const phraseById=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const dialogueEpisodes=dialogue=>[...new Set((dialogue.phraseLinks||[]).map(id=>phraseById.get(id)?.episode).filter(Boolean))];

assert.equal(dialogues.length,322);
assert.equal(new Set(dialogues.map(dialogue=>dialogue.id)).size,322);
assert.equal(dialogues.filter(dialogue=>!Object.prototype.hasOwnProperty.call(dialogue,"category")).length,0);
assert.equal(dialogues.filter(dialogue=>typeof dialogue.category!=="string"||!dialogue.category.trim()).length,0);
assert.equal(dialogues.filter(dialogue=>!category(dialogue)).length,0);
assert.deepEqual([...new Set(dialogues.map(category))].sort((a,b)=>a.localeCompare(b,"ja")),[...allowed].sort((a,b)=>a.localeCompare(b,"ja")));
assert.equal(dialogues.filter(dialogue=>category(dialogue)==="ケンカ").length,0);
assert.equal(dialogues.filter(dialogue=>!dialogue.title.trim()).length,0);
assert.equal(dialogues.filter(dialogue=>/^(日常|仕事|相談|人間関係|恋愛|トラブル|メンタル|雑談|ケンカ)[①②③④⑤⑥⑦⑧⑨⑩]（.+）$/.test(dialogue.title)).length,0);

const counts=new Map(allowed.map(name=>[name,dialogues.filter(dialogue=>category(dialogue)===name).length]));
assert.deepEqual(Object.fromEntries(counts),{"日常":68,"仕事":91,"相談":25,"人間関係":5,"恋愛":40,"トラブル":2,"メンタル":5,"雑談":8,"友人":64,"買い物":2,"挑戦":4,"家族":3,"健康":1,"旅行":4});
assert.equal([...counts.values()].filter(count=>count===1).length,1);

for(const expected of require('./fixtures/friends-s5-s10-notion-rebuild.json').seasons[4])assert.equal(category(dialogues.find(dialogue=>dialogue.id===expected.id)),expected.category,expected.id);
assert.equal(category(dialogues.find(dialogue=>dialogue.id==="d7")),"人間関係");
assert.equal(dialogues.find(dialogue=>dialogue.id==="d7").title,"感情的になったとき");

const duplicateTitles=[...new Set(dialogues.map(dialogue=>dialogue.title))].filter(title=>dialogues.filter(dialogue=>dialogue.title===title).length>1).sort((a,b)=>a.localeCompare(b,"ja"));
assert.deepEqual(duplicateTitles,["ホームパーティーの準備をする"].sort((a,b)=>a.localeCompare(b,"ja")));

const season9Work=dialogues.filter(dialogue=>seasonNumber(dialogue.season)===9&&category(dialogue)==="仕事");
assert.equal(season9Work.length,6);
const episode=episodeNumber(dialogueEpisodes(season9Work[0])[0]);
assert.ok(episode>0);
assert.ok(dialogues.filter(dialogue=>seasonNumber(dialogue.season)===9&&category(dialogue)==="仕事"&&dialogueEpisodes(dialogue).some(value=>episodeNumber(value)===episode)).length>0);

const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
assert.match(source,/typeof d\.category==="string"&&d\.category\.trim\(\)/);
assert.match(source,/categoryCounts\.get\(b\)-categoryCounts\.get\(a\)/);
assert.match(source,/function sanitizeSavedDialogueFilters\(value=\{\}\).*categories=new Set\(DIALOGUES\.map\(dialogueCategory\)\).*category=saved\.category==="all"\|\|categories\.has\(saved\.category\)\?saved\.category:"all"/);
assert.match(source,/f\.season==="ALL"\|\|seasonNum\(d\.season\)===Number\(f\.season\).*f\.episode==="ALL".*f\.category==="all"\|\|dialogueCategory\(d\)===f\.category/);
assert.match(source,/scope==="saved"\)\|\|bookmarked\("dialogue",d\.id\)/);

console.log("dialogue category tests passed");
