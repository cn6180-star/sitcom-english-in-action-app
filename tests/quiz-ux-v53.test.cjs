"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");

assert.match(source,/>4択<\/button>/);
assert.doesNotMatch(source,/>3択<\/button>/);
assert.match(source,/sampleValues\(PHRASES,3,[^)]+\)/);

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
assert.match(quizHome,/const settings=practice\?`\$\{typeGroup\}\$\{countGroup\}\$\{scopeGroup\}\$\{seasonGroup\}`:seasonGroup/);
assert.match(quizHome,/\$\{startArea\}<section class="card filter-panel quiz-settings-panel">\$\{settings\}/);
assert.match(quizHome,/\$\{practice\?'':`<section class="card quiz-stats-card">/);
assert.match(quizHome,/practice\?'Start Practice':'Start Quiz'/);
assert.doesNotMatch(quizHome,/Start Daily Quiz/);
assert.match(source,/Today<\/span><strong>\$\{today\} Qs<\/strong>/);

const result=source.slice(source.indexOf("function renderQuizResult"),source.indexOf("function nextQuizRound"));
assert.doesNotMatch(result,/pageHeader\(/);
assert.match(result,/<section class="card quiz-result-card"><div class="result-score">/);
assert.match(styles,/\.quiz-result-card \.result-score\{[^}]*font-size:44px/);

const review=source.slice(source.indexOf("function reviewMistakes"),source.indexOf("function normalizePhraseSearch"));
assert.match(review,/r\.quizMode==="practice"\?\(r\.nextRound\?\.questionType\|\|"mixed"\):"mixed"/);
assert.match(review,/createQuestions\(pool,questionCount,questionType\)/);

for(const [quizMode,selectedType,expectedType] of [["practice","mc","mc"],["practice","fill","fill"],["practice","tf","tf"],["test","fill","mixed"]]){
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

console.log("quiz UX v5.3 tests passed");
