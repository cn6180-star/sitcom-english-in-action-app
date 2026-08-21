"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/function dialogueTranslationMarkup\(text,extraClass=""\)/);
assert.match(source,/dialogueTranslationMarkup\(line\[2\]\)/);
assert.match(source,/translation-concealed/);
assert.match(source,/translation\.setAttribute\("aria-hidden","true"\)/);

assert.match(source,/highlight\.classList\.add\("dialogue-blank"\)/);
assert.match(source,/text\.textContent=highlight\.textContent/);
assert.match(source,/text\.setAttribute\("aria-hidden","true"\)/);
assert.match(source,/highlight\.setAttribute\("role","button"\)/);
assert.match(source,/event\.key==="Enter"\|\|event\.key===" "/);
assert.match(source,/target\.classList\.remove\("dialogue-blank"\)/);
assert.match(source,/target\.querySelector\("\.dialogue-blank-text"\)\?\.removeAttribute\("aria-hidden"\)/);
assert.doesNotMatch(source,/target\.outerHTML=`<span class="highlight-phrase blank-revealed"/);

assert.match(styles,/\.dialogue-blank\{[^}]*color:transparent/);
assert.match(styles,/box-decoration-break:clone/);
assert.match(styles,/-webkit-box-decoration-break:clone/);
assert.match(styles,/\.dialogue-blank\{[^}]*user-select:none/);
assert.doesNotMatch(styles,/\.dialogue-blank\{[^}]*display:inline-block/);
assert.doesNotMatch(styles,/\.dialogue-blank\{[^}]*min-width:3\.2em/);
assert.match(styles,/\.translation-concealed\{visibility:hidden;pointer-events:none;user-select:none/);

console.log("dialogue layout stability tests passed");
