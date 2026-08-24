"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","js","app.js"),"utf8");
const typingStart=source.indexOf("function normalizeQuizTypingText");
const typingEnd=source.indexOf("const PHRASE_SCOPES=");
assert.ok(typingStart>=0&&typingEnd>typingStart);
const typingContext={normalize:value=>String(value||"").toLowerCase().replace(/[’]/g,"'").normalize("NFKC").replace(/\s+/g," ").trim(),Set,String};
vm.runInNewContext(`${source.slice(typingStart,typingEnd)};globalThis.matches=typingAnswerMatches;globalThis.variants=quizTypingVariants`,typingContext);

for(const [phrase,answers] of [
  ["Believe you me",["believe you me","  BELIEVE   YOU ME  "]],
  ["What difference does that make?",["what difference does that make","what difference does that make?"]],
  ["(That's) easy for you to say",["that's easy for you to say","easy for you to say"]],
  ["bail on (someone)",["bail on someone","bail on ~","bail on"]],
  ["cut someone out (of ~)",["cut someone out","cut someone out of ~","cut someone out of something"]]
])for(const answer of answers)assert.equal(typingContext.matches(answer,phrase),true,`${answer} should match ${phrase}`);
assert.equal(typingContext.matches("bail on someone tomorrow","bail on (someone)"),false);
assert.equal(typingContext.matches("easy for me to say","(That's) easy for you to say"),false);

const selectionStart=source.indexOf("function quizChoiceIds");
const selectionEnd=source.indexOf("function beginQuizSession");
const phrases=Array.from({length:12},(_,index)=>({id:`p${index+1}`,phrase:`Phrase ${index+1}`,meaning:`意味 ${index+1}`}));
const generationContext={Set,Map,Array,Math,Number,PHRASES:phrases,normalize:value=>String(value||"").toLowerCase(),normalizeQuizQuestionType:type=>type==="tf"?"enmc":type};
vm.runInNewContext(`${source.slice(selectionStart,selectionEnd)};globalThis.create=createQuestions`,generationContext);
const englishToJapanese=generationContext.create(phrases,5,"enmc");
for(const question of englishToJapanese){
  assert.equal(question.type,"enmc");
  assert.equal(question.choices.length,4);
  assert.equal(new Set(question.choices).size,4);
  assert.equal(question.choices.filter(id=>id===question.id).length,1);
  assert.equal(new Set(question.choices.map(id=>phrases.find(phrase=>phrase.id===id).meaning)).size,4);
}
const mixed=generationContext.create(phrases,6,"mixed");
assert.deepEqual(Array.from(mixed,question=>question.type),["mc","enmc","fill","mc","enmc","fill"]);
assert.equal(mixed.some(question=>question.type==="tf"),false);

const play=source.slice(source.indexOf("function renderQuizPlay"),source.indexOf("function answerQuiz"));
assert.match(play,/q\.type==="mc"\|\|q\.type==="enmc"/);
assert.match(play,/q\.type==="enmc"\?p\.phrase:p\.meaning/);
assert.match(play,/q\.type==="enmc"\?choice\.meaning:choice\.phrase/);
assert.doesNotMatch(play,/True|False|presentedMeaning|trueAnswer/);

const answerSource=source.slice(source.indexOf("function answerQuiz"),source.indexOf("function quizFeedback"));
function runAnswer(answer){
  const session={questions:[{id:"p1",type:"enmc",choices:["p1","p2","p3","p4"]}],index:0,responses:[],mistakes:[],score:0,added:0,graduated:0};
  let weakAdds=0,weakCorrects=0,writes=0;
  const context={
    getQuizSession:()=>session,
    PHRASES:phrases,
    returnToQuizHome(){},
    typingAnswerMatches:()=>false,
    markWeakCorrect:()=>{weakCorrects++;return false},
    markMiss:()=>{weakAdds++;return true},
    STORE:{quiz:"quiz"},
    writeJSON:()=>{writes++},
    playQuizSound(){},
    renderQuizPlay(){}
  };
  vm.runInNewContext(`${answerSource};answerQuiz(${JSON.stringify(answer)})`,context);
  return{session,weakAdds,weakCorrects,writes};
}
const correct=runAnswer("p1");
assert.equal(correct.session.score,1);
assert.equal(correct.weakCorrects,1);
assert.equal(correct.weakAdds,0);
assert.equal(correct.session.responses[0].correct,true);
const incorrect=runAnswer("p2");
assert.equal(incorrect.session.score,0);
assert.equal(incorrect.weakAdds,1);
assert.deepEqual(incorrect.session.mistakes,["p1"]);
assert.equal(incorrect.session.responses[0].correct,false);

console.log("quiz question type tests passed");
