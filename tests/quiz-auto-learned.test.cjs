"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","js/app.js"),"utf8");
const functions=["learnedState","learnedPhraseIds","isLearned","getWeakStats","setWeakStats","isWeak","markMiss","markWeakCorrect","answerQuiz"];
const code=source.split(/\r?\n/).filter(line=>functions.some(name=>line.startsWith(`function ${name}(`))).join("\n")+"\n"+source.slice(source.indexOf("function updateQuizLearnedProgress("),source.indexOf("function getLearnedCount("));
let storage={},session,sounds=[];
const clone=value=>JSON.parse(JSON.stringify(value));
const context={STORE:{learned:"learned",quiz:"quiz"},LEGACY:{weak:"weak"},PHRASES:[{id:"p1",phrase:"test phrase"}],
  readJSON:(key,fallback)=>clone(storage[key]??fallback),writeJSON:(key,value)=>{storage[key]=clone(value)},
  getQuizSession:()=>session,typingAnswerMatches:(answer,phrase)=>answer===phrase,
  returnToQuizHome:()=>{throw new Error("Unexpected navigation")},renderQuizPlay(){},playQuizSound:correct=>sounds.push(correct)};
vm.createContext(context);vm.runInContext(code,context);
function reset(){storage={};sounds=[]}
function answer(type,correct=true){
  session={questions:[{id:"p1",type}],index:0,responses:[],mistakes:[],score:0,added:0,graduated:0};
  context.answerQuiz(correct?(type==="fill"?"test phrase":"p1"):"wrong");
  assert.equal(session.score,correct?1:0);assert.equal(session.responses.length,1);
  assert.equal(session.responses[0].correct,correct);assert.equal(sounds.at(-1),correct);
  const saved=clone(storage);context.answerQuiz("p1");assert.deepEqual(storage,saved,"Repeat submission must be ignored");
  return session;
}
const history=()=>storage.learned?.quizCorrectTypes?.p1||[];
reset();answer("enmc");assert.deepEqual(history(),["enmc"]);assert.equal(context.isLearned("p1"),false);
answer("enmc");assert.deepEqual(history(),["enmc","enmc"]);assert.equal(context.isLearned("p1"),false);
answer("mc");assert.equal(context.isLearned("p1"),true);assert.deepEqual(history(),[]);
for(const types of [["enmc","mc"],["mc","fill"],["fill","enmc"],["mc","mc"]]){
  reset();answer(types[0]);assert.equal(context.isLearned("p1"),false);
  // Storage reload between sessions retains the actual first quiz type.
  storage=clone(storage);answer(types[1]);assert.equal(context.isLearned("p1"),true);
  assert.equal(context.isWeak("p1"),false);assert.deepEqual(history(),[]);
}
reset();answer("mc");answer("enmc",false);assert.deepEqual(history(),[]);
assert.equal(context.isWeak("p1"),true);assert.equal(session.added,1);assert.equal(storage.weak.p1.streak,0);
answer("mc");assert.equal(storage.weak.p1.streak,1);assert.deepEqual(history(),[]);
answer("fill");assert.equal(session.graduated,1);assert.equal(context.isWeak("p1"),false);
assert.equal(context.isLearned("p1"),false,"Weak graduation cannot promote Learned");assert.deepEqual(history(),[]);
answer("enmc");assert.equal(context.isLearned("p1"),false);assert.deepEqual(history(),["enmc"]);
answer("fill");assert.equal(context.isLearned("p1"),true);
reset();answer("enmc",false);answer("enmc");answer("enmc");
assert.equal(context.isWeak("p1"),false,"Weak graduation still accepts passive quiz types");
assert.equal(context.isLearned("p1"),false);
reset();answer("fill",false);answer("mc");answer("fill",false);
assert.equal(storage.weak.p1.streak,0);assert.deepEqual(history(),[]);
answer("enmc");assert.equal(context.isWeak("p1"),true);answer("enmc");assert.equal(context.isWeak("p1"),false);
reset();storage.learned={friends:["p1"]};answer("fill",false);
assert.equal(context.isLearned("p1"),true,"Incorrect never demotes existing Learned");assert.equal(context.isWeak("p1"),true);
answer("mc");answer("fill");assert.equal(context.isLearned("p1"),true);assert.deepEqual(history(),[]);
reset();storage.learned={friends:[],quizCorrectTypes:{p1:"invalid"}};answer("enmc");assert.deepEqual(history(),["enmc"]);
assert.match(source,/苦手解除に使った正解は、この判定には含めません/);
assert.match(source,/問題形式に関係なく自動で「苦手」から解除/);
console.log("Quiz auto Learned promotion, persistence, Weak and scoring regression PASS");
