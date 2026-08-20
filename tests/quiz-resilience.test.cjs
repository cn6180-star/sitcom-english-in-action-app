"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const source=fs.readFileSync(require("node:path").join(__dirname,"..","js","app.js"),"utf8");
const storageStart=source.indexOf("function showStorageWarningOnce");
const storageEnd=source.indexOf("const seasonNum=");
const quizStart=source.indexOf("const QUIZ_SESSION_VERSIONS=");
const quizEnd=source.indexOf("function returnToQuizHome");
assert.ok(storageStart>=0&&storageEnd>storageStart&&quizStart>=0&&quizEnd>quizStart);

const storageContext={
  Map,
  String,
  JSON,
  setTimeout:fn=>fn(),
  document:{body:{appendChild(){}},createElement:()=>({setAttribute(){},remove(){}})},
  localStorage:{getItem(){throw new DOMException("blocked","SecurityError")},setItem(){throw new DOMException("blocked","SecurityError")},removeItem(){throw new DOMException("blocked","SecurityError")}},
  DOMException
};
vm.runInNewContext(`let storageWarningShown=false;const volatileStorage=new Map();${source.slice(storageStart,storageEnd)};globalThis.api={safeGetItem,safeSetItem,safeRemoveItem,readJSON,writeJSON}`,storageContext);
assert.equal(storageContext.api.safeSetItem("quiz",'{"ok":true}'),false);
assert.deepEqual(storageContext.api.readJSON("quiz",null),{ok:true});
assert.equal(storageContext.api.safeRemoveItem("quiz"),false);
assert.equal(storageContext.api.safeGetItem("quiz"),null);

const phraseIds=["p1","p2","p3","p4"];
const quizContext={
  Set,
  Map,
  Number,
  JSON,
  PHRASES:phraseIds.map(id=>({id})),
  SEASONS:[1,2,3,4,5,6,7,8,9],
  STORE:{quiz:"quiz"},
  safeGetItem:()=>null,
  safeRemoveItem:()=>true
};
vm.runInNewContext(`${source.slice(quizStart,quizEnd)};globalThis.api={validateQuizSession,validateQuizQuestion,getQuizSession}`,quizContext);
const validSession={version:3,series:"friends",quizMode:"test",season:"ALL",scope:"random",questionType:"mixed",questionCount:3,questions:[{id:"p1",type:"mc",choices:["p1","p2"]},{id:"p2",type:"fill"},{id:"p3",type:"tf",presentedMeaning:"Meaning",trueAnswer:true}],index:0,responses:[],score:0,added:0,graduated:0,mistakes:[]};
assert.ok(quizContext.api.validateQuizSession(validSession));
const legacy={...validSession,version:2};delete legacy.quizMode;delete legacy.questionType;delete legacy.questionCount;
const normalizedLegacy=quizContext.api.validateQuizSession(legacy);
assert.equal(normalizedLegacy.quizMode,"test");
assert.equal(normalizedLegacy.questionType,"mixed");
assert.equal(normalizedLegacy.questionCount,3);
const versionless={...legacy};delete versionless.version;
assert.ok(quizContext.api.validateQuizSession(versionless));

const invalidCases=[
  {},
  {...validSession,questions:null},
  {...validSession,questions:[]},
  {...validSession,responses:undefined},
  {...validSession,mistakes:undefined},
  {...validSession,index:3},
  {...validSession,questionType:"unknown"},
  {...validSession,questions:[{id:"missing",type:"fill"}]},
  {...validSession,questions:[{id:"p1",type:"mc",choices:["p2","missing"]}]},
  {...validSession,quizMode:"unknown"},
  {...validSession,scope:"unknown"}
];
for(const candidate of invalidCases)assert.equal(quizContext.api.validateQuizSession(candidate),null);

let rawQuiz="{broken",removeAttempts=0;
quizContext.safeGetItem=()=>rawQuiz;
quizContext.safeRemoveItem=()=>{removeAttempts++;return false};
assert.equal(quizContext.api.getQuizSession(),null);
assert.equal(removeAttempts,1);
rawQuiz=JSON.stringify(validSession);
assert.ok(quizContext.api.getQuizSession());

console.log("quiz resilience tests passed");
