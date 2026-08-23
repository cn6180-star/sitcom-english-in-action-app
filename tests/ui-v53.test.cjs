"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/function renderQuizHome\(\).*listPageHeader\("Quiz"\)/);
assert.doesNotMatch(source,/pageHeader\("Friends · Quiz","Daily Quiz"\)/);
assert.match(source,/class="filter-label">シーズン</);
assert.match(source,/class="filter-label" for="categoryFilter">カテゴリー</);
assert.match(source,/class="filter-label">エピソード</);

assert.match(source,/compact-card home-quiz-card/);
assert.match(styles,/@media \(max-width:759px\)/);
assert.match(styles,/\.home-view \.home-quiz-card\{display:none\}/);

for(const asset of["series-friends-v53.webp","series-tbbt-v53.webp"]){
  const file=path.join(root,"assets",asset);
  assert.ok(fs.existsSync(file),`${asset} is missing`);
  assert.ok(fs.statSync(file).size>0,`${asset} is empty`);
}
assert.match(styles,/series-friends-v53\.webp/);
assert.match(styles,/series-tbbt-v53\.webp/);

console.log("v5.3 UI tests passed");
