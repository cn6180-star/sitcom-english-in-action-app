"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/>英→日<\/button>.*>日→英<\/button>.*>入力<\/button>/);
assert.doesNotMatch(source,/>4択<\/button>|>正誤<\/button>/);
assert.match(source,/pattern=\["mc","enmc","fill"\]/);

const play=source.slice(source.indexOf("function renderQuizPlay"),source.indexOf("function answerQuiz"));
assert.doesNotMatch(play,/Friends · Daily Quiz/);
assert.doesNotMatch(play,/Which phrase matches this meaning\?|Fill in the English phrase\.|True or False\?/);
assert.match(play,/quiz-question-count/);
assert.match(play,/quiz-prompt/);
assert.match(styles,/\.quiz-question-count\{[^}]*font-size:13px/);
assert.match(styles,/\.quiz-play-card \.quiz-question\{[^}]*color:#eef2ff/);

assert.match(source,/function startQuickChallenge\(\).*quizMode:"test".*season:"ALL".*scope:"random".*questionType:"mixed".*questionCount/);
assert.match(source,/Quick Challenge/);
assert.match(source,/10 mixed questions\. Ready when you are\./);
assert.match(source,/onclick="startQuickChallenge\(\)"/);
assert.doesNotMatch(styles,/\.home-view \.home-quiz-card\{display:none\}/);

const quizHome=source.slice(source.indexOf("function renderQuizHome"),source.indexOf("function shuffle"));
assert.match(quizHome,/const settings=practice\?`\$\{typeGroup\}\$\{scopeGroup\}\$\{seasonGroup\}`:seasonGroup/);
assert.doesNotMatch(quizHome,/countGroup|setQuizOption\('quizQuestionCount'|<div class="filter-label">問題数<\/div>/);
assert.match(quizHome,/\$\{startArea\}<section class="card filter-panel quiz-settings-panel">\$\{settings\}/);
assert.match(quizHome,/\$\{practice\?'':`<section class="card quiz-stats-card">/);
assert.match(quizHome,/practice\?'Start Practice':'Start Quiz'/);
assert.doesNotMatch(quizHome,/Start Daily Quiz/);
assert.match(styles,/\.quiz-mode-tabs\{[^}]*width:100%/);
assert.match(styles,/\.quiz-start-area>\.quiz-start-button\{width:100%\}/);
assert.match(styles,/\.quiz-settings-panel\{width:100%/);
assert.match(source,/Today<\/span><strong>\$\{today\} Qs<\/strong>/);

const result=source.slice(source.indexOf("function renderQuizResult"),source.indexOf("function nextQuizRound"));
assert.doesNotMatch(result,/pageHeader\(/);
assert.doesNotMatch(result,/今回の問題/);
assert.match(result,/<section class="card quiz-result-card"><div class="result-score">/);
assert.match(result,/mistake-list quiz-result-list/);
assert.ok(result.indexOf("quiz-result-actions section")<result.indexOf("mistake-list quiz-result-list"));
assert.equal((result.match(/class="primary-button"/g)||[]).length,3);
assert.match(result,/Review mistakes<\/button><button class="primary-button"/);
assert.match(result,/mistakes\.length\?'onclick="reviewMistakes\(\)"':'disabled'/);
assert.match(styles,/\.quiz-result-card \.result-score\{[^}]*font-size:44px/);
assert.match(styles,/\.quiz-result-actions\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(styles,/\.quiz-result-actions \.primary-button:disabled\{[^}]*pointer-events:none/);

const review=source.slice(source.indexOf("function reviewMistakes"),source.indexOf("function normalizePhraseSearch"));
assert.match(review,/r\.quizMode==="practice"\?\(r\.nextRound\?\.questionType\|\|"mixed"\):"mixed"/);
assert.match(review,/createQuestions\(pool,questionCount,questionType\)/);

for(const [quizMode,selectedType,expectedType] of [["practice","mc","mc"],["practice","enmc","enmc"],["practice","fill","fill"],["test","fill","mixed"]]){
  let started=null;
  const context={route:{params:{result:{quizMode,mistakes:["p1"],nextRound:{questionType:selectedType}}}},PHRASES:[{id:"p1"}],createQuestions:(_pool,_count,type)=>[{id:"p1",type}],beginQuizSession:session=>{started=session},Date};
  vm.runInNewContext(`${review};reviewMistakes()`,context);
  assert.equal(started.questionType,expectedType);
  assert.equal(started.questions[0].type,expectedType);
}

let quickSession=null;
const quick=source.slice(source.indexOf("function startQuickChallenge"),source.indexOf("function resumeQuiz"));
const quickPool=Array.from({length:12},(_,index)=>({id:`p${index}`}));
vm.runInNewContext(`${quick};startQuickChallenge()`,{quizPool:()=>quickPool,createQuestions:(_pool,count,type)=>Array.from({length:count},(_,index)=>({id:`p${index}`,type})),beginQuizSession:session=>{quickSession=session},navigate:()=>{},Date,Math});
assert.equal(quickSession.quizMode,"test");
assert.equal(quickSession.questionType,"mixed");
assert.equal(quickSession.questionCount,10);
assert.equal(quickSession.questions.length,10);

const start=source.slice(source.indexOf("function startQuiz"),source.indexOf("function startQuickChallenge"));
for(const [mode,savedCount,expectedCount] of [["practice",5,5],["practice",10,5],["practice",15,5],["test",15,10]]){
  let session=null;
  const filters={quizMode:mode,quizSeason:"ALL",quizScope:"random",quizQuestionType:"fill",quizQuestionCount:savedCount};
  vm.runInNewContext(`${start};startQuiz()`,{filters,sanitizeSavedQuizFilters:value=>({...value}),quizPool:()=>quickPool,createQuestions:(_pool,count)=>Array.from({length:count},(_,index)=>({id:`p${index}`})),beginQuizSession:value=>{session=value},renderQuizHome:()=>{},Date,Object});
  assert.equal(session.questionCount,expectedCount);
  assert.equal(session.questions.length,expectedCount);
  assert.equal(session.quizMode,mode);
}
let shortageRendered=false,shortageStarted=false;
vm.runInNewContext(`${start};startQuiz()`,{filters:{quizMode:"practice",quizSeason:"ALL",quizScope:"weak",quizQuestionType:"fill",quizQuestionCount:15},sanitizeSavedQuizFilters:value=>({...value}),quizPool:()=>quickPool.slice(0,4),createQuestions:()=>[],beginQuizSession:()=>{shortageStarted=true},renderQuizHome:()=>{shortageRendered=true},Date,Object});
assert.equal(shortageRendered,true);assert.equal(shortageStarted,false);

console.log("quiz UX v5.3 tests passed");
