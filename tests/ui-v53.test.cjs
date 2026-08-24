"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/function renderQuizHome\(\)[\s\S]*?listPageHeader\("Quiz"\)/);
assert.doesNotMatch(source,/pageHeader\("Friends · Quiz","Daily Quiz"\)/);
assert.match(source,/class="filter-label">シーズン</);
assert.match(source,/class="filter-label" for="categoryFilter">カテゴリー</);
assert.match(source,/class="filter-label">エピソード</);

assert.match(source,/compact-card home-quiz-card/);
assert.match(styles,/@media \(max-width:759px\)/);
assert.match(styles,/\.home-view \.home-quiz-card\{min-height:0;padding:14px\}/);

for(const asset of["series-friends-v53.webp","series-tbbt-v53.png"]){
  const file=path.join(root,"assets",asset);
  assert.ok(fs.existsSync(file),`${asset} is missing`);
  assert.ok(fs.statSync(file).size>0,`${asset} is empty`);
}
assert.match(styles,/series-friends-v53\.webp/);
assert.match(styles,/series-tbbt-v53\.png/);
assert.match(source,/role:"For Everyday English"/);
assert.match(source,/role:"For Advanced English"/);
assert.match(source,/class="series-role"/);
assert.match(source,/pageHeader\("Series",series\.name,series\.role\)/);
assert.match(source,/Choose a Mode/);
assert.match(source,/Learn expressions in context\./);
const seriesHome=source.slice(source.indexOf("function renderSeriesHome"),source.indexOf("function progressBarMarkup"));
for(const removed of["Bookmarks","Progress","Browse by Season","How to use"]){
  assert.doesNotMatch(seriesHome,new RegExp(removed));
}

assert.equal((source.match(/episodeConcealed=f\.season==="ALL"/g)||[]).length,2);
assert.match(source,/function dialogueFilterPanel\(bookmarkedOnly=false\).*episode-filter-slot\$\{episodeConcealed/);

assert.match(source,/perfect=r\.score===r\.total/);
assert.match(source,/perfect\?' <span class="perfect-crown"/);
assert.match(source,/celebrate=perfect&&!celebratedQuizResults\.has\(resultKey\)/);
assert.match(source,/Array\.from\(\{length:16\}/);
assert.match(source,/--confetti-left:/);
assert.match(source,/--confetti-delay:/);
assert.match(source,/--confetti-drift:/);
assert.match(styles,/\.perfect-confetti\{[^}]*pointer-events:none/);
assert.match(styles,/perfect-confetti-fall 1\.65s/);
assert.doesNotMatch(styles,/var\(--piece\).*\*/);
assert.match(styles,/@media \(prefers-reduced-motion:reduce\)\{\.perfect-confetti\{display:none\}\}/);

console.log("v5.3 UI tests passed");
