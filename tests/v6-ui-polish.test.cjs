'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8'),readme=fs.readFileSync('README.md','utf8');
const sets=Array.from({length:10},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`,'utf8')));
assert.equal(sets.flatMap(s=>s.phrases).length,4062);
assert.equal(sets.flatMap(s=>s.dialogues).length,334);
assert.match(source,/const APP_VERSION="6"/);
assert.match(source,/Version \$\{APP_VERSION\}/);
assert.equal((source.match(/S1–S10 available/g)||[]).length,2);
assert.doesNotMatch(source,/S1–S9 available|Season 10 Coming Soon/);
assert.match(source,/\$\{PHRASES.length\} phrases/);
assert.match(source,/\$\{DIALOGUES.length\} dialogues/);
assert.match(readme,/^# Sitcom English in Action v6/);
assert.match(readme,/4062 phrases/);assert.match(readme,/334 dialogues/);
assert.doesNotMatch(readme,/v5\.|Season 1–9|Season 10 Coming Soon/);

const functions=source.split(/\r?\n/).filter(l=>/^function (dialogueFilterScrollPosition|restoreDialogueFilterScrollPositions|dialogueFilterChips|setDialogueFilter|dialogueScopeFrom|dialogueFilterPanel)\(/.test(l)).join('\n');
const containers={season:{scrollLeft:120},episode:{scrollLeft:480}};
let saves=0,renders=0;
const context={
 document:{querySelector:selector=>containers[selector.includes('"season"')?'season':'episode']},
 window:{scrollY:160,scrollTo:({top,behavior})=>{assert.equal(behavior,'instant');context.window.scrollY=top}},
 route:{name:'dialogues'},filters:{dialogue:{season:'10',episode:'ALL',scope:'all',bookmarked:false}},
 saveAppState:()=>saves++,renderBookmarks:()=>{throw Error('wrong route')},
 renderDialogueList:()=>{renders++;containers.season.scrollLeft=0;containers.episode.scrollLeft=0;context.window.scrollY=0},
 navigate:()=>{throw Error('filter must not navigate')},
 DIALOGUES:[],SEASONS:[1,10],episodeValues:()=>[1,16,18],esc:s=>s,
 chips:()=>'<div class="chips"></div>'
};
vm.createContext(context);vm.runInContext(functions,context);
context.setDialogueFilter('episode','16');
assert.equal(context.filters.dialogue.episode,'16');
assert.equal(containers.season.scrollLeft,120);assert.equal(containers.episode.scrollLeft,480);
assert.equal(context.window.scrollY,160);assert.equal(saves,1);assert.equal(renders,1);
context.setDialogueFilter('episode','18');
assert.equal(containers.episode.scrollLeft,480);assert.equal(context.window.scrollY,160);
context.setDialogueFilter('season','8');
assert.equal(context.filters.dialogue.episode,'ALL');
assert.equal(containers.season.scrollLeft,120);assert.equal(containers.episode.scrollLeft,0);
assert.equal(context.window.scrollY,160);
context.filters.dialogue.bookmarked=true;context.setDialogueFilter('scope','all');
assert.equal(context.filters.dialogue.bookmarked,false);
assert.match(context.dialogueFilterPanel(),/data-dialogue-filter-scroll="season"/);
assert.match(context.dialogueFilterPanel(),/data-dialogue-filter-scroll="episode"/);
console.log('v6 text/counts and Dialogue filter scroll/state/no-navigation regression PASS');
