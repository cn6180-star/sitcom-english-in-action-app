"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const source=fs.readFileSync(require("node:path").join(__dirname,"..","js","app.js"),"utf8");
const storageStart=source.indexOf("function showStorageWarningOnce");
const storageEnd=source.indexOf("const seasonNum=");
const quizStart=source.indexOf("const QUIZ_SESSION_VERSIONS=");
const quizEnd=source.indexOf("function returnToQuizHome");
const filterStart=source.indexOf("function sanitizeSavedQuizFilters");
const filterEnd=source.indexOf("async function loadData");
const selectionStart=source.indexOf("function quizChoiceIds");
const selectionEnd=source.indexOf("function beginQuizSession");
assert.ok(storageStart>=0&&storageEnd>storageStart&&quizStart>=0&&quizEnd>quizStart&&filterStart>=0&&filterEnd>filterStart&&selectionStart>=0&&selectionEnd>selectionStart);

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
  Array,
  Math,
  Number,
  JSON,
  normalize:value=>String(value||"").toLowerCase(),
  sampleValues:(values,count)=>values.slice(0,count),
  shuffle:values=>[...values],
  PHRASES:phraseIds.map((id,index)=>({id,phrase:`Phrase ${index+1}`,meaning:`Meaning ${index+1}`})),
  SEASONS:[1,2,3,4,5,6,7,8,9],
  STORE:{quiz:"quiz"},
  safeGetItem:()=>null,
  safeRemoveItem:()=>true
};
vm.runInNewContext(`${source.slice(quizStart,quizEnd)};globalThis.api={validateQuizSession,validateQuizQuestion,getQuizSession}`,quizContext);
const validSession={version:3,series:"friends",quizMode:"test",season:"ALL",scope:"random",questionType:"mixed",questionCount:3,questions:[{id:"p1",type:"mc",choices:["p1","p2","p3","p4"]},{id:"p2",type:"fill"},{id:"p3",type:"enmc",choices:["p1","p2","p3","p4"]}],index:0,responses:[],score:0,added:0,graduated:0,mistakes:[]};
assert.ok(quizContext.api.validateQuizSession(validSession));
const legacyTrueFalse={...validSession,questionType:"tf",questions:[{id:"p1",type:"tf",presentedMeaning:"Meaning 1",trueAnswer:true}],questionCount:1};
const normalizedTrueFalse=quizContext.api.validateQuizSession(legacyTrueFalse);
assert.equal(normalizedTrueFalse.questionType,"enmc");
assert.equal(normalizedTrueFalse.questions[0].type,"enmc");
assert.equal(normalizedTrueFalse.questions[0].choices.length,4);
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
  {...validSession,questions:[{id:"p1",type:"mc",choices:["p1","p2","p3","missing"]}]},
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

const filterContext={Set,Number,SEASONS:[1,2,3,4,5,6,7,8,9]};
vm.runInNewContext(`${source.slice(filterStart,filterEnd)};globalThis.sanitize=sanitizeSavedQuizFilters`,filterContext);
const plain=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(filterContext.sanitize({quizMode:"broken",quizSeason:"99",quizScope:"mistakes",quizQuestionType:"mixed",quizQuestionCount:1063})),{quizMode:"test",quizSeason:"ALL",quizScope:"random",quizQuestionType:"mc",quizQuestionCount:10});
assert.deepEqual(plain(filterContext.sanitize({quizMode:"practice",quizSeason:"8",quizScope:"weak",quizQuestionType:"fill",quizQuestionCount:15})),{quizMode:"practice",quizSeason:"8",quizScope:"weak",quizQuestionType:"fill",quizQuestionCount:15});
assert.equal(filterContext.sanitize({quizQuestionType:"tf"}).quizQuestionType,"enmc");

const selectionPhrases=Array.from({length:30},(_,index)=>({id:`p${index+1}`,phrase:`Phrase ${index+1}`,meaning:`Meaning ${index+1}`}));
const selectionContext={Set,Map,Array,Math,Number,PHRASES:selectionPhrases,normalize:value=>String(value||"").toLowerCase(),normalizeQuizQuestionType:type=>type==="tf"?"enmc":type};
vm.runInNewContext(`${source.slice(selectionStart,selectionEnd)};globalThis.api={selectQuizPhrases,createQuestions}`,selectionContext);
let previousIds=[];
for(let round=0;round<100;round++){
  const selected=selectionContext.api.selectQuizPhrases(selectionPhrases,10,previousIds);
  assert.equal(selected.length,10);
  assert.equal(new Set(selected.map(item=>item.id)).size,10);
  if(previousIds.length)assert.equal(selected.some(item=>previousIds.includes(item.id)),false);
  const questions=selectionContext.api.createQuestions(selectionPhrases,10,"mixed",previousIds);
  assert.equal(questions.length,10);
  assert.equal(new Set(questions.map(item=>item.id)).size,10);
  previousIds=questions.map(item=>item.id);
}
const smallPool=selectionPhrases.slice(0,8),smallPrevious=smallPool.slice(0,5).map(item=>item.id),smallNext=selectionContext.api.selectQuizPhrases(smallPool,5,smallPrevious);
assert.equal(smallNext.filter(item=>!smallPrevious.includes(item.id)).length,3);
assert.equal(smallNext.filter(item=>smallPrevious.includes(item.id)).length,2);

console.log("quiz resilience tests passed");
