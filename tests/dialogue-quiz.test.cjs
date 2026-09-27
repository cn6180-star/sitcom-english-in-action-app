"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,".."),source=fs.readFileSync(path.join(root,"js/app.js"),"utf8"),moduleSource=fs.readFileSync(path.join(root,"js/dialogue-quiz.js"),"utf8");
const {context:c,phrases,dialogues}=require("../tools/audit-dialogue-highlight.cjs");
let storage={},savedIds=new Set(),soundCalls=0;
const clone=x=>JSON.parse(JSON.stringify(x));
Object.assign(c,{PHRASES:phrases,DIALOGUES:dialogues,SEASONS:Array.from({length:10},(_,i)=>i+1),STORE:{dialogueLearned:"dialogueLearned"},filters:{dialogue:{scope:"all",season:"ALL",episode:"ALL",category:"all"},quizTab:"dialogues"},route:{name:"quiz",params:{}},
  readJSON:(key,fallback)=>clone(storage[key]??fallback),writeJSON:(key,value)=>{storage[key]=clone(value)},safeRemoveItem:key=>{delete storage[key]},
  seasonNum:s=>Number(String(s).match(/\d+/)?.[0]),bookmarked:(_type,id)=>savedIds.has(id),shuffle:xs=>[...xs].reverse(),sampleValues:(xs,n)=>xs.slice(0,n),localDate:()=>"2026-09-27",esc:s=>String(s??"").replace(/</g,"&lt;"),
  app:{innerHTML:"",querySelector:()=>null},document:{getElementById:()=>null},window:{scrollTo(){}},listPageHeader:()=>"",dialogueCard:d=>`<article>${d.title}</article>`,
  renderQuizHome(){},renderQuizPlay(){},renderQuizResult(){},startQuickChallenge(){c.quickCalled=true},saveAppState(){c.settingsSaved=clone(c.filters)},safeBackupState:value=>clone(value),
  navigate:(name,params={})=>{c.route={name,params}},render(){},playQuizSound:()=>soundCalls++,playQuizStartSound(){},playQuizCompleteSound(){},showConfirm:(_message,fn)=>fn()});
vm.runInContext(source.split(/\r?\n/).filter(line=>["dialogueLearnedState","learnedDialogueIds","isDialogueLearned","dialogueScopeFrom","filteredDialogues"].some(name=>line.startsWith(`function ${name}(`))).join("\n"),c);
vm.runInContext(moduleSource,c);
const settings=(mode="test",type="blank",scope="all")=>({mode,type,season:"ALL",scope,japanese:false});
let totalQuestions=0;
for(const d of dialogues){
  const questions=c.createDialogueQuizQuestions(d,settings());
  assert.equal(questions.length,d.phraseLinks.length,`All production ranges available: ${d.id}`);
  assert.equal(new Set(questions.map(q=>q.phraseId)).size,questions.length);
  for(const q of questions){assert.ok(q.ranges.length);assert.ok(q.answer);if(q.type!=="fill"){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.equal(q.choices.filter(a=>a===q.answer).length,1)}if(q.type==="next")assert.ok(q.lineIndex>0)}
  const practice=c.createDialogueQuizQuestions(d,settings("practice","next"));
  assert.equal(new Set(practice.map(q=>q.lineIndex)).size,practice.length);
  assert.ok(practice.every(q=>q.type==="next"&&q.lineIndex>0));totalQuestions+=questions.length;
}
for(const count of [6,7,8,9]){
  const d=dialogues.find(d=>d.phraseLinks.length===count);assert.ok(d);assert.equal(c.createDialogueQuizQuestions(d,settings()).length,count);
}
for(const [answer,expected] of [["I am","I'm"],["don't","do not"],["cannot","can't"],["  I’m!  ","I am"],["we're","we are"],["keep at bay","keep … at bay"]])assert.equal(c.dialogueQuizInputMatches(answer,expected),true);
for(const [answer,expected] of [["i am","I'm"],["Do not","don't"],["go away","get away"],["at bay keep","keep … at bay"],["rock in","rock on"]])assert.equal(c.dialogueQuizInputMatches(answer,expected),false);
const originalMatcher=c.dialoguePhraseMatchResults;
const fakePhrases=["alpha","bravo","charlie","delta","echo","foxtrot"].map((phrase,i)=>({id:`fixture-p${i}`,phrase}));
c.PHRASES=[...phrases,...fakePhrases];
c.dialoguePhraseMatchResults=(d,linked)=>d.lines.flatMap((line,lineIndex)=>linked.flatMap((p,priority)=>{const index=line[1].indexOf(p.phrase);return index<0?[]:[{phraseId:p.id,lineIndex,index,length:p.phrase.length,priority}]}));
const fixture={id:"fixture-swap",phraseLinks:fakePhrases.map(p=>p.id),lines:[["A","alpha bravo","訳"],["B","charlie","訳"],["A","delta","訳"],["B","echo","訳"],["A","foxtrot","訳"]]};
const swapped=c.createDialogueQuizQuestions(fixture,settings());assert.notEqual(swapped[1].type,"next");assert.equal(swapped[2].type,"next");
const fallback={id:"fixture-fallback",phraseLinks:fakePhrases.slice(0,2).map(p=>p.id),lines:[["A","alpha bravo","訳"]]};
assert.equal(c.createDialogueQuizQuestions(fallback,settings())[1].type,"blank");assert.equal(c.createDialogueQuizQuestions(fallback,settings("practice","next")).length,0);
c.dialoguePhraseMatchResults=originalMatcher;c.PHRASES=phrases;
const d=dialogues.find(d=>d.phraseLinks.length===8),roundSettings=settings();
function reset(){storage={};soundCalls=0;c.filters.dialogueQuiz=roundSettings}
function finishRound(miss=[]){let s=c.getDialogueQuizSession();for(let i=s.index;i<s.questions.length;i++){
  s=c.getDialogueQuizSession();c.answerDialogueQuiz(miss.includes(i)?"wrong":s.questions[i].answer);
  const responses=c.getDialogueQuizSession().responses.length;c.answerDialogueQuiz("wrong");assert.equal(c.getDialogueQuizSession().responses.length,responses,"No duplicate submission");
  c.nextDialogueQuizQuestion();
}return c.route.params.result}
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);assert.ok(c.getDialogueQuizSession());
let result=finishRound([0]);assert.equal(result.score,7);assert.equal(result.total,8);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);
assert.equal(c.dialogueQuizSummary().today,1);assert.equal(c.dialogueQuizSummary().perfect,0);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/Incorrect/);assert.match(c.app.innerHTML,/Review mistakes/);assert.match(c.app.innerHTML,/Next Dialogue/);
c.reviewDialogueQuizMistakes();assert.equal(c.getDialogueQuizSession().questions.length,1);assert.equal(c.getDialogueQuizSession().review,true);
result=finishRound();assert.equal(result.score,1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.dialogueQuizSummary().today,1);
c.startDialogueQuiz(d.id,roundSettings);finishRound();assert.equal(c.isDialogueWeak(d.id),false);assert.equal(c.isDialogueLearned(d.id),true);
assert.equal(c.dialogueQuizSummary().today,2);assert.equal(c.dialogueQuizSummary().perfect,1);
c.setDialogueWeak(d.id,true);assert.ok(c.dialogueQuizPool(settings("test","blank","weak")).some(x=>x.id===d.id));
c.filters.dialogue.scope="weak";assert.ok(c.filteredDialogues().every(x=>c.isDialogueWeak(x.id)));c.filters.dialogue.scope="all";
savedIds.add(d.id);assert.ok(c.dialogueQuizPool(settings("test","blank","saved")).some(x=>x.id===d.id));
assert.ok(c.dialogueQuizPool(settings("test","blank","learned")).some(x=>x.id===d.id));assert.ok(!c.dialogueQuizPool(settings("test","blank","unlearned")).some(x=>x.id===d.id));
assert.ok(c.dialogueQuizPool({...roundSettings,season:2}).every(x=>c.seasonNum(x.season)===2));
reset();c.startDialogueQuiz(d.id,settings("practice","fill"));c.toggleDialogueQuizJapanese();
assert.equal(c.getDialogueQuizSession().settings.japanese,true);assert.equal(c.filters.dialogueQuiz.japanese,true);
assert.ok(c.app.innerHTML.includes(d.lines[0][2]));assert.match(c.app.innerHTML,/日本語訳 表示/);finishRound();assert.equal(c.dialogueQuizSummary().today,0);
c.nextQuizDialogue();assert.equal(c.getDialogueQuizSession().settings.mode,"practice");assert.equal(c.getDialogueQuizSession().settings.type,"fill");assert.equal(c.getDialogueQuizSession().settings.japanese,true);
reset();c.startDialogueQuiz(d.id,{...roundSettings,japanese:true});c.renderDialogueQuizPlay();assert.doesNotMatch(c.app.innerHTML,/日本語訳|dialogue-quiz-translations/);
storage[c.STORE.dialogueQuiz].questions[0].answer="tampered";assert.equal(c.getDialogueQuizSession(),null);
reset();c.filters.quizTab="dialogues";c.startQuickChallenge();assert.equal(c.filters.quizTab,"phrases");assert.equal(c.quickCalled,true);
const restored=c.safeBackupState({currentSeries:"friends",filters:{quizTab:"dialogues",dialogueQuiz:{...roundSettings,japanese:true}}},[]);
assert.equal(restored.filters.quizTab,"dialogues");assert.equal(restored.filters.dialogueQuiz.japanese,true);
assert.match(source,/Dialogue Quizの「苦手」って何/);assert.match(source,/Dialogue練習では日本語訳ON \/ OFF/);
console.log(`Dialogue Quiz production ${dialogues.length} dialogues / ${totalQuestions} questions, generation, Weak, Review, input, filters, persistence and scoring PASS`);
