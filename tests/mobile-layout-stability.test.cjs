"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.equal((source.match(/class="filter-group episode-filter-slot"/g)||[]).length,2);
assert.doesNotMatch(source,/episodeConcealed/);
assert.match(source,/classList\.add\("bookmarks-filter-layout"\)/);
assert.match(styles,/\.bookmarks-filter-layout>\.filter-panel\{min-height:336px\}/);
assert.match(styles,/@media \(max-width:759px\)\{\.bookmarks-filter-layout>\.filter-panel\{min-height:296px\}\}/);

assert.match(source,/example-translation\$\{concealed\?' example-translation-concealed':''\}/);
assert.match(source,/concealed\?' aria-hidden="true"'/);
assert.match(styles,/\.example-translation-concealed\{visibility:hidden;pointer-events:none;user-select:none/);

assert.match(styles,/\.dialogue-line\{min-height:42px\}/);
assert.match(styles,/\.dialogue-side\{touch-action:pan-y\}/);
assert.match(styles,/\.dialogue-play-button\{[^}]*width:100%[^}]*height:46px/);
assert.match(source,/interactive\.classList\.contains\("learning-item"\)/);
assert.match(source,/absX>=DETAIL_SWIPE_MIN_X&&absX>=absY\*DETAIL_SWIPE_AXIS_RATIO/);
assert.match(source,/detailSwipeSuppressClickUntil=Date\.now\(\)\+600/);
assert.match(source,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
const translationToggle=source.slice(source.indexOf("function toggleDialogueTranslations"),source.indexOf("function dialogueTranslationMarkup"));
assert.doesNotMatch(translationToggle,/renderDialogueDetail\(\)/);
assert.match(translationToggle,/querySelectorAll\("\.translation"\)/);
assert.match(translationToggle,/classList\.toggle\("translation-concealed",!showDialogueTranslations\)/);
assert.match(translationToggle,/aria-pressed/);

assert.match(source,/const APP_VERSION="6"/);
assert.match(source,/Version \$\{APP_VERSION\}/);

const swipeContext={};require("node:vm").createContext(swipeContext);
require("node:vm").runInContext(source.split(/\r?\n/).find(line=>line.startsWith("function detailSwipeHintMarkup(")),swipeContext);
assert.match(swipeContext.detailSwipeHintMarkup(1,3),/← 左右スワイプで移動 →/);
assert.match(swipeContext.detailSwipeHintMarkup(0,3),/← スワイプで次へ/);
assert.doesNotMatch(swipeContext.detailSwipeHintMarkup(0,3),/→/);
assert.match(swipeContext.detailSwipeHintMarkup(2,3),/前へスワイプ →/);
assert.doesNotMatch(swipeContext.detailSwipeHintMarkup(2,3),/←/);
assert.equal(swipeContext.detailSwipeHintMarkup(0,1),"<span></span>");
assert.equal(swipeContext.detailSwipeHintMarkup(-1,3),"<span></span>");
assert.equal((source.match(/\$\{detailSwipeHintMarkup\(pos,ids.length\)\}/g)||[]).length,2);
assert.match(styles,/\.detail-swipe-hint\{display:none\}/);
assert.match(styles,/@media \(any-pointer:coarse\)\{\.detail-swipe-hint\{display:block;[^}]*pointer-events:none\}\}/);
// Gesture thresholds and navigation remain covered by their existing behavior; hint is display-only.
require("node:vm").runInContext(source.split(/\r?\n/).filter(line=>line.startsWith("const DETAIL_SWIPE_MIN_X=")||line.startsWith("function detailSwipeDirection(")).join("\n"),swipeContext);
assert.equal(swipeContext.detailSwipeDirection(-100,10),1);
assert.equal(swipeContext.detailSwipeDirection(100,10),-1);
assert.equal(swipeContext.detailSwipeDirection(20,100),0);
assert.equal(swipeContext.detailSwipeDirection(30,0),0);
console.log("mobile layout stability tests passed");
