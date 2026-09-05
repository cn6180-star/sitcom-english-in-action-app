"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","js","app.js"),"utf8");
const labels=source.match(/const TYPE_LABELS=\{[^;]+\};/)?.[0];
const helper=source.match(/function phraseTypeLabel\(type\)\{[^}]+\}/)?.[0];

assert.ok(labels,"TYPE_LABELS mapping is missing");
assert.ok(helper,"phraseTypeLabel helper is missing");

const context={};
vm.createContext(context);
vm.runInContext(`${labels}${helper};this.phraseTypeLabel=phraseTypeLabel;`,context);

for(const [type,label] of Object.entries({
  word:"単語",
  phrase:"フレーズ",
  idiom:"イディオム",
  "phrasal verb":"句動詞",
  pattern:"型",
  grammar:"文法"
}))assert.equal(context.phraseTypeLabel(type),label);

assert.equal(context.phraseTypeLabel("future type"),"future type");
assert.match(source,/value="\$\{esc\(x\)\}"[^>]*>\$\{esc\(phraseTypeLabel\(x\)\)\}/);
assert.match(source,/esc\(phraseTypeLabel\(p\.type\)\)/);

console.log("phrase type label tests passed");
