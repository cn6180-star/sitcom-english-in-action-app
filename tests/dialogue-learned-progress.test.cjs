"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/dialogueLearned:"sitcomEnglish_learnedDialogues"/);
assert.match(source,/BACKUP_KEYS=.*STORE\.learned,STORE\.dialogueLearned,STORE\.sound/);
assert.match(source,/BACKUP_JSON_KEYS=.*STORE\.learned,STORE\.dialogueLearned/);
assert.match(source,/key!==STORE\.dialogueLearned&&!Object\.prototype\.hasOwnProperty\.call\(value\.data,key\)/);
assert.match(source,/key===STORE\.dialogueLearned\)data\[key\]=validateLearned\(item,dialogueIds,warnings\)/);
assert.match(source,/Phrase \/ Dialogue Learned/);
assert.equal((source.match(/backupSchemaVersion:BACKUP_SCHEMA_VERSION/g)||[]).length,1);
assert.match(source,/const APP_VERSION="5\.3",BACKUP_SCHEMA_VERSION=1/);

assert.match(source,/\["all","全て"\],\["unlearned","未習得"\],\["learned","習得済み"\].*\["saved","保存"\]/);
assert.match(source,/scope!=="unlearned"\|\|!isDialogueLearned\(d\.id\)/);
assert.match(source,/scope!=="learned"\|\|isDialogueLearned\(d\.id\)/);
assert.match(source,/scope==="saved"\)\|\|bookmarked\("dialogue",d\.id\)/);
assert.match(source,/dialogueLearnedButton\(dialogue\.id\)/);
assert.match(source,/listPageHeader\("Progress"/);
assert.match(source,/>Phrases<\/button>.*>Dialogues<\/button>/);
assert.match(source,/<div class="eyebrow">Overall Progress<\/div><h2>Friends<\/h2>/);
assert.match(styles,/\.progress-mode-tabs/);
assert.match(styles,/\.dialogue-main-card \.detail-page-header\{padding-right:0/);

const learnedStart=source.indexOf("function dialogueLearnedState");
const learnedEnd=source.indexOf("function getWeakStats");
assert.ok(learnedStart>=0&&learnedEnd>learnedStart);
let dialogueRaw={friends:[]},phraseRaw={friends:["p1"]};
const learnedContext={
  Set,Math,
  STORE:{dialogueLearned:"dialogue",learned:"phrase"},
  DIALOGUES:[{id:"d1"},{id:"d2"},{id:"d3"}],
  readJSON:key=>key==="dialogue"?dialogueRaw:phraseRaw,
  writeJSON:(key,value)=>{if(key==="dialogue")dialogueRaw=JSON.parse(JSON.stringify(value));else phraseRaw=JSON.parse(JSON.stringify(value))},
  getCompletionPercent:(learned,total)=>total?Math.round(learned/total*1000)/10:0,
  lineIcon:()=>"",
  updateLearnedButton:()=>{}
};
vm.runInNewContext(`${source.slice(learnedStart,learnedEnd)};globalThis.api={toggleDialogueLearned,isDialogueLearned,dialogueProgressFor}`,learnedContext);
learnedContext.api.toggleDialogueLearned("d1");
assert.equal(learnedContext.api.isDialogueLearned("d1"),true);
assert.deepEqual(phraseRaw,{friends:["p1"]});
assert.deepEqual(JSON.parse(JSON.stringify(learnedContext.api.dialogueProgressFor())),{learned:1,total:3,remaining:2,percent:33.3});
learnedContext.api.toggleDialogueLearned("d1");
assert.equal(learnedContext.api.isDialogueLearned("d1"),false);
assert.deepEqual(phraseRaw,{friends:["p1"]});

const scopeMatch=source.match(/function dialogueScopeFrom[\s\S]*?(?=function setDialogueFilter)/);
const filteredMatch=source.match(/function filteredDialogues[\s\S]*?(?=function dialogueCard)/);
assert.ok(scopeMatch&&filteredMatch);
const dialogues=[
  {id:"d1",season:"Season 1",episode:1,category:"Work"},
  {id:"d2",season:"Season 1",episode:2,category:"Work"},
  {id:"d3",season:"Season 2",episode:5,category:"Life"}
];
const filterContext={
  filters:{dialogue:{season:"ALL",episode:"ALL",category:"all",scope:"all",bookmarked:false}},
  DIALOGUES:dialogues,
  bookmarked:(_type,id)=>id==="d3",
  isDialogueLearned:id=>id==="d2"||id==="d3",
  seasonNum:value=>Number(String(value).match(/\d+/)?.[0]),
  dialogueEpisodes:d=>[`S${Number(String(d.season).match(/\d+/)?.[0])}E${String(d.episode).padStart(2,"0")}`],
  episodeNumber:value=>Number(String(value).match(/E(\d+)/)?.[1]),
  dialogueCategory:d=>d.category
};
vm.runInNewContext(`${scopeMatch[0]}${filteredMatch[0]};globalThis.api={filteredDialogues}`,filterContext);
const ids=()=>filterContext.api.filteredDialogues().map(item=>item.id);
assert.deepEqual(Array.from(ids()),["d1","d2","d3"]);
filterContext.filters.dialogue.scope="unlearned";
assert.deepEqual(Array.from(ids()),["d1"]);
filterContext.filters.dialogue.scope="learned";
assert.deepEqual(Array.from(ids()),["d2","d3"]);
filterContext.filters.dialogue.scope="saved";
assert.deepEqual(Array.from(ids()),["d3"]);
filterContext.filters.dialogue={season:"2",episode:"5",category:"Life",scope:"learned",bookmarked:false};
assert.deepEqual(Array.from(ids()),["d3"]);

const homeStart=source.indexOf("function renderHome");
const homeEnd=source.indexOf("function renderSeriesHome");
assert.ok(homeStart>=0&&homeEnd>homeStart);
assert.match(source.slice(homeStart,homeEnd),/progressFor\(\)/);
assert.doesNotMatch(source.slice(homeStart,homeEnd),/dialogueProgressFor|learnedDialogueIds|STORE\.dialogueLearned/);

const backupStart=source.indexOf("const backupPhraseIds");
const backupEnd=source.indexOf("function openBackup");
assert.ok(backupStart>=0&&backupEnd>backupStart);
const STORE={state:"state",continue:"continue",activity:"activity",history:"history",dailyTarget:"target",learned:"learned",dialogueLearned:"dialogueLearned",sound:"sound"};
const LEGACY={phraseBookmarks:"phraseBookmarks",dialogueBookmarks:"dialogueBookmarks",weak:"weak"};
const BACKUP_KEYS=[LEGACY.phraseBookmarks,LEGACY.dialogueBookmarks,LEGACY.weak,STORE.state,STORE.continue,STORE.activity,STORE.history,STORE.dailyTarget,STORE.learned,STORE.dialogueLearned,STORE.sound];
const backupContext={
  Set,Object,Array,Number,String,Date,JSON,Map,
  PHRASES:[{id:"p1",type:"word",usage:"daily"}],DIALOGUES:[{id:"d1",title:"Work①"}],SEASONS:[1],
  STORE,LEGACY,BACKUP_KEYS,BACKUP_JSON_KEYS:new Set([LEGACY.phraseBookmarks,LEGACY.dialogueBookmarks,LEGACY.weak,STORE.state,STORE.continue,STORE.activity,STORE.history,STORE.learned,STORE.dialogueLearned]),
  BACKUP_APP:"Sitcom English in Action",BACKUP_SCHEMA_VERSION:1,APP_VERSION:"5.3",
  isPlainObject:value=>Boolean(value&&typeof value==="object"&&!Array.isArray(value)),
  validIsoDate:value=>typeof value==="string"&&!Number.isNaN(Date.parse(value)),
  validStoredDate:value=>/^\d{4}-\d{2}-\d{2}$/.test(value),
  dialogueCategory:()=>"Work",
  localStorage:{getItem:()=>null},
  URL:{createObjectURL:()=>"",revokeObjectURL(){}},Blob:function(){},document:{createElement:()=>({style:{},click(){},remove(){}}),body:{appendChild(){}}},setTimeout(){}
};
vm.runInNewContext(`${source.slice(backupStart,backupEnd)};globalThis.api={validateBackupDocument}`,backupContext);
const backupData={phraseBookmarks:[],dialogueBookmarks:[],weak:{},state:null,continue:null,activity:null,history:[],target:10,learned:{friends:[]},dialogueLearned:{friends:["d1"]},sound:true};
const backup={backupSchemaVersion:1,app:"Sitcom English in Action",appVersion:"5.3",backupType:"manual",createdAt:"2026-08-25T00:00:00.000Z",data:backupData};
const restored=backupContext.api.validateBackupDocument(backup);
assert.deepEqual(JSON.parse(JSON.stringify(restored.data.dialogueLearned)),{friends:["d1"]});
const legacyBackup=JSON.parse(JSON.stringify(backup));
delete legacyBackup.data.dialogueLearned;
const legacyRestored=backupContext.api.validateBackupDocument(legacyBackup);
assert.equal(legacyRestored.data.dialogueLearned,null);

console.log("dialogue learned and progress tests passed");
