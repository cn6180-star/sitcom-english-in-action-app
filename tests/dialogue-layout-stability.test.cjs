"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/function dialogueTranslationMarkup\(text,extraClass=""\)/);
assert.match(source,/dialogueTranslationMarkup\(line\[2\]\)/);
assert.match(source,/translation-concealed/);
assert.match(source,/concealed\?' aria-hidden="true"'/);

assert.match(source,/highlight\.classList\.add\(isRevealed\?"blank-revealed":"dialogue-blank"\)/);
assert.match(source,/text\.textContent=highlight\.textContent/);
assert.match(source,/text\.setAttribute\("aria-hidden","true"\)/);
assert.match(source,/highlight\.setAttribute\("role","button"\)/);
assert.match(source,/event\.key==="Enter"\|\|event\.key===" "/);
assert.match(source,/route\.params\.blankRevealed=revealed\.includes\(key\)\?revealed\.filter\(item=>item!==key\):\[\.\.\.revealed,key\]/);
assert.match(source,/highlight\.setAttribute\("aria-label",isRevealed\?"Hide revealed phrase":"Reveal hidden phrase"\)/);
assert.doesNotMatch(source,/target\.outerHTML=`<span class="highlight-phrase blank-revealed"/);
assert.match(source,/hiddenLine\.innerHTML=dialogueLineMarkup\(line,lineIndex,matchResults\)/);
assert.match(source,/text\?\.classList\.add\("hidden-dialogue-text"\)/);
assert.match(source,/speaker\?\.classList\.add\("hidden-speaker-control"\)/);
assert.match(source,/target\.classList\.add\("line-revealed"\)/);
assert.match(source,/text\.classList\.remove\("hidden-dialogue-text"\)/);
assert.match(source,/speaker\.classList\.remove\("hidden-speaker-control"\)/);
assert.doesNotMatch(source,/target\.outerHTML=dialogueLineMarkup/);
assert.match(source,/hint\.textContent="Tap to reveal"/);
assert.match(source,/hint\.classList\.toggle\("reveal-hint-concealed",!showRevealHint\)/);
assert.match(source,/eyebrow\.textContent=dialogueDetailEyebrow\(dialogue\)/);
assert.match(source,/mainCard\.classList\.add\("card","dialogue-main-card"\)/);
assert.match(source,/mainCard\.prepend\(header\)/);
assert.match(source,/header\.insertAdjacentHTML\("afterbegin",`<div class="detail-actions dialogue-detail-actions">/);
assert.match(source,/header\.querySelector\("\.dialogue-detail-actions"\)\?\.append\(bookmark\)/);

assert.match(styles,/\.dialogue-blank\{[^}]*color:transparent/);
assert.match(styles,/box-decoration-break:clone/);
assert.match(styles,/-webkit-box-decoration-break:clone/);
assert.match(styles,/\.dialogue-blank\{[^}]*user-select:none/);
assert.doesNotMatch(styles,/\.dialogue-blank\{[^}]*display:inline-block/);
assert.doesNotMatch(styles,/\.dialogue-blank\{[^}]*min-width:3\.2em/);
assert.match(styles,/\.translation-concealed\{visibility:hidden;pointer-events:none;user-select:none/);
assert.match(styles,/\.hidden-dialogue-text\{[^}]*color:transparent/);
assert.match(styles,/\.hidden-dialogue-text\{[^}]*box-decoration-break:clone/);
assert.match(styles,/\.hidden-dialogue-text \.highlight-phrase\{color:transparent\}/);
assert.match(styles,/\.hidden-speaker-control\{visibility:hidden;pointer-events:none/);
assert.match(styles,/\.reveal-hint-concealed\{visibility:hidden;pointer-events:none;user-select:none/);
assert.match(styles,/\.dialogue-layout>\.dialogue-main-card\{min-width:0\}/);
assert.match(styles,/\.dialogue-main-card \.conversation\{margin-bottom:0\}/);
assert.match(styles,/@media \(min-width:760px\) and \(max-width:1000px\)\{\.dialogue-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
assert.doesNotMatch(styles,/\.eyebrow\{[^}]*white-space:nowrap/);

const categoryContext={};
vm.createContext(categoryContext);
const categoryHelpers=source.split(/\r?\n/).filter(line=>line.startsWith("const seasonNum=")||line.startsWith("const seasonCode=")||line.startsWith("function dialogueCategory(")||line.startsWith("function dialogueDetailEyebrow("));
vm.runInContext(`${categoryHelpers.join("\n")}\nthis.detailEyebrow=dialogueDetailEyebrow`,categoryContext);
const season1=JSON.parse(fs.readFileSync(path.join(root,"data","season1.json"),"utf8")).dialogues.find(dialogue=>dialogue.category);
const season2=JSON.parse(fs.readFileSync(path.join(root,"data","season2.json"),"utf8")).dialogues.find(dialogue=>dialogue.category);
assert.equal(categoryContext.detailEyebrow(season1),`S01 · ${season1.category}`);
assert.equal(categoryContext.detailEyebrow(season2),`S02 · ${season2.category}`);
assert.equal(categoryContext.detailEyebrow({season:"S03",title:""}),"S03");
assert.equal(categoryContext.detailEyebrow({season:"S02",category:"とても長いカテゴリー名でも折り返せる"}),"S02 · とても長いカテゴリー名でも折り返せる");

console.log("dialogue layout stability tests passed");
