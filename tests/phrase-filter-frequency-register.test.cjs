"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","js","app.js"),"utf8");
const pick=pattern=>source.match(pattern)?.[0];
const labels=[pick(/const FREQUENCY_LABELS=\{[^;]+\};/),pick(/const REGISTER_LABELS=\{[^;]+\};/)].join("");
const helpers=[pick(/function phraseFrequencyLabel\(frequency\)\{[^}]+\}/),pick(/function phraseRegisterLabel\(register\)\{[^}]+\}/)].join("");
const sanitizer=pick(/function sanitizeSavedPhraseFilters\(value=\{\}\)\{[^\n]+\}/);
const filtered=pick(/function filteredPhrases\(bookmarkedOnly=false\)\{[^\n]+\}/);
const backupState=pick(/function safeBackupState\(value,warnings\)\{[^\n]+\}/);

assert.ok(labels&&helpers&&sanitizer&&filtered&&backupState);

const context={
  filters:{phrase:{season:"ALL",episode:"ALL",scope:"all",priority:"all",type:"all",frequency:"all",register:"all",bookmarked:false,weak:false}},
  PHRASES:[],DIALOGUES:[],SEASONS:[1,2],PHRASE_SCOPES:new Set(["all","important","weak","unlearned","learned","saved"]),
  phraseScopeFrom:value=>value.scope||"all",seasonNum:value=>Number(String(value).match(/\d+/)?.[0]),episodeNumber:value=>Number(String(value).match(/E(\d+)/)?.[1]),
  bookmarked:()=>false,isWeak:()=>false,isLearned:()=>false,dialogueCategory:()=>"日常",isPlainObject:value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value)
};
vm.createContext(context);
vm.runInContext(`${labels}${helpers}${sanitizer}${filtered}${backupState};this.api={phraseFrequencyLabel,phraseRegisterLabel,sanitizeSavedPhraseFilters,filteredPhrases,safeBackupState};`,context);

for(const [value,label] of Object.entries({frequent:"頻繁",general:"時々",limited:"まれ"}))assert.equal(context.api.phraseFrequencyLabel(value),label);
for(const [value,label] of Object.entries({casual:"砕けた",neutral:"普通",polite:"丁寧",formal:"硬め",slang:"俗語"}))assert.equal(context.api.phraseRegisterLabel(value),label);
assert.equal(context.api.phraseFrequencyLabel("unknown"),"unknown");
assert.equal(context.api.phraseRegisterLabel("unknown"),"unknown");

const oldValues=["日常的","知っておきたい","やや古め"];
for(const usage of oldValues){
  const migrated=context.api.sanitizeSavedPhraseFilters({season:"2",type:"word",usage});
  assert.equal(migrated.frequency,"all");
  assert.equal(migrated.register,"all");
  assert.equal(migrated.season,"2");
  assert.equal(migrated.type,"word");
  assert.equal(Object.prototype.hasOwnProperty.call(migrated,"usage"),false);
}
const current=context.api.sanitizeSavedPhraseFilters({frequency:"frequent",register:"casual"});
assert.equal(current.frequency,"frequent");
assert.equal(current.register,"casual");

context.PHRASES=[
  {id:"p1",episode:"S01E01",priority:3,type:"word",frequency:"frequent",register:"casual"},
  {id:"p2",episode:"S01E01",priority:3,type:"idiom",frequency:"frequent",register:"neutral"},
  {id:"p3",episode:"S02E01",priority:2,type:"word",frequency:"general",register:"casual"}
];
const ids=()=>context.api.filteredPhrases().map(item=>item.id);
context.filters.phrase={...context.filters.phrase,frequency:"frequent"};
assert.deepEqual(ids(),["p1","p2"]);
context.filters.phrase={...context.filters.phrase,frequency:"all",register:"casual"};
assert.deepEqual(ids(),["p1","p3"]);
context.filters.phrase={...context.filters.phrase,frequency:"frequent",register:"casual"};
assert.deepEqual(ids(),["p1"]);
context.filters.phrase={...context.filters.phrase,type:"word",season:"1"};
assert.deepEqual(ids(),["p1"]);

const oldBackup={version:2,currentSeries:"friends",filters:{bookmarksTab:"phrase",phrase:{season:"2",type:"word",usage:"日常的"}}};
const restoredOld=context.api.safeBackupState(oldBackup,[]);
assert.equal(restoredOld.filters.phrase.frequency,"all");
assert.equal(restoredOld.filters.phrase.register,"all");
assert.equal(restoredOld.filters.phrase.season,"2");
assert.equal(restoredOld.filters.phrase.type,"word");
assert.equal(Object.prototype.hasOwnProperty.call(restoredOld.filters.phrase,"usage"),false);
const newBackup={version:2,currentSeries:"friends",filters:{phrase:{frequency:"limited",register:"formal"}}};
const restoredNew=context.api.safeBackupState(newBackup,[]);
assert.equal(restoredNew.filters.phrase.frequency,"limited");
assert.equal(restoredNew.filters.phrase.register,"formal");

assert.match(source,/for="frequencyFilter">頻度/);
assert.match(source,/for="registerFilter">口調/);
assert.match(source,/const TYPE_FILTER_ORDER=\["phrase","idiom","word","phrasal verb","pattern","grammar"\]/);
assert.match(source,/const FREQUENCY_FILTER_ORDER=\["frequent","general","limited"\]/);
assert.match(source,/const REGISTER_FILTER_ORDER=\["neutral","casual","slang","formal","polite"\]/);
assert.match(source,/\['important','★★★'\]/);
assert.doesNotMatch(source,/\['important','重要'\]/);
assert.doesNotMatch(source,/頻度：\$\{esc\(phraseFrequencyLabel\(p\.frequency\)\)\}/);
assert.doesNotMatch(source,/口調：\$\{esc\(phraseRegisterLabel\(p\.register\)\)\}/);
assert.doesNotMatch(source,/for="usageFilter">使用感/);
assert.doesNotMatch(source,/esc\(p\.usage\)/);

console.log("phrase frequency/register UI and filter tests passed");
