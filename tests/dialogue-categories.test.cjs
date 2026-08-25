const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const datasets=Array.from({length:9},(_,index)=>JSON.parse(fs.readFileSync(path.join(root,"data",`season${index+1}.json`),"utf8")));
const dialogues=datasets.flatMap(dataset=>dataset.dialogues||[]);
const phrases=datasets.flatMap(dataset=>dataset.phrases||[]);
const allowed=["日常","仕事","相談","人間関係","恋愛","トラブル","メンタル","雑談"];
const category=dialogue=>typeof dialogue.category==="string"&&dialogue.category.trim()?dialogue.category.trim():(String(dialogue.title||"").match(/^([^①②③④⑤⑥⑦⑧⑨⑩（(]+)/)?.[1]?.trim()||"");
const seasonNumber=value=>Number(String(value||"").match(/\d+/)?.[0])||0;
const episodeNumber=value=>Number(String(value||"").match(/E(\d+)/i)?.[1])||0;
const phraseById=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const dialogueEpisodes=dialogue=>[...new Set((dialogue.phraseLinks||[]).map(id=>phraseById.get(id)?.episode).filter(Boolean))];

assert.equal(dialogues.length,167);
assert.equal(new Set(dialogues.map(dialogue=>dialogue.id)).size,167);
assert.equal(dialogues.filter(dialogue=>!Object.prototype.hasOwnProperty.call(dialogue,"category")).length,0);
assert.equal(dialogues.filter(dialogue=>typeof dialogue.category!=="string"||!dialogue.category.trim()).length,0);
assert.equal(dialogues.filter(dialogue=>!category(dialogue)).length,0);
assert.deepEqual([...new Set(dialogues.map(category))].sort((a,b)=>a.localeCompare(b,"ja")),[...allowed].sort((a,b)=>a.localeCompare(b,"ja")));
assert.equal(dialogues.filter(dialogue=>category(dialogue)==="ケンカ").length,0);
assert.equal(dialogues.filter(dialogue=>!dialogue.title.trim()).length,0);
assert.equal(dialogues.filter(dialogue=>/^(日常|仕事|相談|人間関係|恋愛|トラブル|メンタル|雑談|ケンカ)[①②③④⑤⑥⑦⑧⑨⑩]（.+）$/.test(dialogue.title)).length,0);

const counts=new Map(allowed.map(name=>[name,dialogues.filter(dialogue=>category(dialogue)===name).length]));
assert.deepEqual(Object.fromEntries(counts),{"日常":63,"仕事":56,"相談":15,"人間関係":18,"恋愛":8,"トラブル":3,"メンタル":2,"雑談":2});
assert.equal([...counts.values()].filter(count=>count===1).length,0);

const expectedS9={
  "予約の取れないレストラン":"日常","転職するか迷う":"相談","友達の恋愛相談":"相談","引っ越し先探し":"日常",
  "仕事を抱えすぎ":"仕事","新しいプロジェクト":"仕事","パーティーの翌朝":"日常","旅行の準備":"日常",
  "同僚との境界線":"人間関係","会社の建前":"仕事","友達に言いすぎた":"人間関係","チームの空気が悪い":"人間関係",
  "久しぶりに遊びに行く":"日常","副業を始める":"日常","みんなでプレゼント":"日常","詮索しすぎ":"人間関係",
  "面接前":"仕事","雑音の多い職場":"仕事"
};
for(const [title,expected] of Object.entries(expectedS9))assert.equal(category(dialogues.find(dialogue=>dialogue.title===title)),expected,title);
assert.equal(category(dialogues.find(dialogue=>dialogue.id==="d7")),"人間関係");
assert.equal(dialogues.find(dialogue=>dialogue.id==="d7").title,"感情的になったとき");

const duplicateTitles=[...new Set(dialogues.map(dialogue=>dialogue.title))].filter(title=>dialogues.filter(dialogue=>dialogue.title===title).length>1).sort((a,b)=>a.localeCompare(b,"ja"));
assert.deepEqual(duplicateTitles,["締切が重なる日","転職を迷う","評価面談","副業を始める"].sort((a,b)=>a.localeCompare(b,"ja")));

const season9Work=dialogues.filter(dialogue=>seasonNumber(dialogue.season)===9&&category(dialogue)==="仕事");
assert.equal(season9Work.length,5);
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
