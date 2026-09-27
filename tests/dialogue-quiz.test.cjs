"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,".."),source=fs.readFileSync(path.join(root,"js/app.js"),"utf8"),moduleSource=fs.readFileSync(path.join(root,"js/dialogue-quiz.js"),"utf8");
const {context:c,phrases,dialogues}=require("../tools/audit-dialogue-highlight.cjs");
let storage={},savedIds=new Set(),soundCalls=0,dom={};
const element=id=>dom[id]||(dom[id]={innerHTML:'',textContent:'',style:{},dataset:{},classList:{toggle(){}},setAttribute(){},getBoundingClientRect:()=>({top:100})});
const clone=x=>JSON.parse(JSON.stringify(x));
Object.assign(c,{PHRASES:phrases,DIALOGUES:dialogues,SEASONS:Array.from({length:10},(_,i)=>i+1),STORE:{dialogueLearned:"dialogueLearned"},filters:{dialogue:{scope:"all",season:"ALL",episode:"ALL",category:"all"},quizTab:"dialogues"},route:{name:"quiz",params:{}},
  readJSON:(key,fallback)=>clone(storage[key]??fallback),writeJSON:(key,value)=>{storage[key]=clone(value)},safeRemoveItem:key=>{delete storage[key]},
  seasonNum:s=>Number(String(s).match(/\d+/)?.[0]),bookmarked:(_type,id)=>savedIds.has(id),shuffle:xs=>[...xs].reverse(),sampleValues:(xs,n)=>xs.slice(0,n),localDate:()=>"2026-09-27",esc:s=>String(s??"").replace(/</g,"&lt;"),
  app:{innerHTML:"",querySelector:()=>null},document:{getElementById:id=>{if(id==='dialogueQuizPage'){if(!c.app.innerHTML.includes('id="dialogueQuizPage"'))return null;element(id).dataset.dialogueId=c.app.innerHTML.match(/data-dialogue-id="([^"]+)"/)?.[1]}return element(id)}},window:{innerHeight:800},listPageHeader:()=>"",dialogueCard:d=>`<article>${d.title}</article>`,
  renderQuizHome(){},renderQuizPlay(){},renderQuizResult(){},startQuickChallenge(){c.quickCalled=true},saveAppState(){c.settingsSaved=clone(c.filters)},safeBackupState:value=>clone(value),
  navigate:(name,params={})=>{c.route={name,params}},render(){},playQuizSound:()=>soundCalls++,playQuizStartSound(){},playQuizCompleteSound(){},showConfirm:(_message,fn)=>fn()});
vm.runInContext(source.split(/\r?\n/).filter(line=>["dialogueLearnedState","learnedDialogueIds","isDialogueLearned","dialogueScopeFrom","filteredDialogues"].some(name=>line.startsWith(`function ${name}(`))).join("\n"),c);
vm.runInContext(moduleSource,c);
const settings=(mode="test",type="blank",scope="all")=>({mode,type,season:"ALL",scope,japanese:false});
let totalQuestions=0;
for(const d of dialogues){
  const questions=c.createDialogueQuizQuestions(d,settings());
  assert.deepEqual([...questions.flatMap(q=>q.phraseIds)].sort(),[...d.phraseLinks].sort(),`All production ranges available: ${d.id}`);
  assert.equal(new Set(questions.flatMap(q=>q.phraseIds)).size,d.phraseLinks.length);
  for(const q of questions){assert.ok(q.ranges.length);assert.ok(q.answer);if(q.type!=="fill"){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c.dialogueQuizChoiceKey)).size,4);assert.equal(q.choices.filter(a=>a===q.answer).length,1);assert.ok(q.choices.every(a=>a.trim()&&!/\b([a-z]+)\s+\1\b/i.test(a)))}if(q.type==='line')assert.deepEqual([...q.phraseIds].sort(),[...c.dialogueQuizEntries(d).filter(e=>e.lineIndex===q.lineIndex).map(e=>e.phraseId)].sort())}
  const initial={questions,index:0,responses:[]};for(let i=0;i<d.lines.length;i++){const markup=c.dialogueQuizLineMarkup(d,initial,i);for(const q of questions.filter(q=>q.lineIndex===i)){assert.ok(markup.includes(q.type==='line'?'████':'_____'))}}
  const practice=c.createDialogueQuizQuestions(d,settings("practice","line"));
  assert.equal(new Set(practice.map(q=>q.lineIndex)).size,practice.length);
  assert.ok(practice.every(q=>q.type==="line"));assert.deepEqual([...practice.flatMap(q=>q.phraseIds)].sort(),[...d.phraseLinks].sort());totalQuestions+=questions.length;
}
for(const count of [6,7,8,9]){
  const d=dialogues.find(d=>d.phraseLinks.length===count);assert.ok(d);assert.equal(c.createDialogueQuizQuestions(d,settings('practice','blank')).length,count);
}
for(const [answer,expected] of [["I am","I'm"],["don't","do not"],["cannot","can't"],["  I’m!  ","I am"],["we're","we are"],["keep at bay","keep … at bay"]])assert.equal(c.dialogueQuizInputMatches(answer,expected),true);
for(const [answer,expected] of [["i am","I'm"],["Do not","don't"],["go away","get away"],["at bay keep","keep … at bay"],["rock in","rock on"]])assert.equal(c.dialogueQuizInputMatches(answer,expected),false);
const originalMatcher=c.dialoguePhraseMatchResults;
const fakePhrases=["alpha","bravo","charlie","delta","echo","foxtrot"].map((phrase,i)=>({id:`fixture-p${i}`,phrase}));
c.PHRASES=[...phrases,...fakePhrases];
c.dialoguePhraseMatchResults=(d,linked)=>d.lines.flatMap((line,lineIndex)=>linked.flatMap((p,priority)=>{const index=line[1].indexOf(p.phrase);return index<0?[]:[{phraseId:p.id,lineIndex,index,length:p.phrase.length,priority}]}));
const fixture={id:"fixture-swap",phraseLinks:fakePhrases.map(p=>p.id),lines:[["A","alpha bravo","訳"],["B","charlie","訳"],["A","delta","訳"],["B","echo","訳"],["A","foxtrot","訳"]]};
const grouped=c.createDialogueQuizQuestions(fixture,settings());assert.equal(grouped[0].type,'line');assert.equal(grouped[0].lineIndex,0);assert.equal(grouped[0].phraseIds.length,2);
const fallback={id:"fixture-fallback",phraseLinks:fakePhrases.slice(0,2).map(p=>p.id),lines:[["A","alpha bravo","訳"]]};
assert.equal(c.createDialogueQuizQuestions(fallback,settings()).length,1);assert.equal(c.createDialogueQuizQuestions(fallback,settings("practice","line")).length,1);
c.dialoguePhraseMatchResults=originalMatcher;c.PHRASES=phrases;
const d=dialogues.find(d=>d.phraseLinks.length===8),roundSettings=settings();
function reset(){storage={};dom={};c.app.innerHTML='';soundCalls=0;c.filters.dialogueQuiz=roundSettings}
function finishRound(miss=[]){
  const s=c.getDialogueQuizSession();
  for(let i=s.questions.length-1;i>=0;i--){const q=s.questions[i];c.saveDialogueQuizAnswer(i,miss.includes(i)?q.type==='fill'?'wrong':q.choices.find(a=>a!==q.answer):q.answer)}
  assert.equal(c.getDialogueQuizSession().responses.length,0,'No grading while drafting');
  c.checkDialogueQuizAnswers();assert.equal(c.getDialogueQuizSession().graded,true);
  c.completeDialogueQuiz();return c.route.params.result;
}
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);assert.ok(c.getDialogueQuizSession());
let result=finishRound([0]);assert.equal(result.score,result.total-1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);
assert.equal(c.dialogueQuizSummary().today,1);assert.equal(c.dialogueQuizSummary().perfect,0);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/Incorrect/);assert.match(c.app.innerHTML,/Review mistakes/);assert.match(c.app.innerHTML,/Next Dialogue/);
assert.match(c.app.innerHTML,/quiz-result-actions dialogue-quiz-result-actions section/);
assert.equal((c.app.innerHTML.match(/<button[^>]*>Review mistakes<\/button>/g)||[]).length,1);
c.reviewDialogueQuizMistakes();assert.equal(c.getDialogueQuizSession().questions.length,1);assert.equal(c.getDialogueQuizSession().review,true);
result=finishRound();assert.equal(result.score,1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.dialogueQuizSummary().today,1);
c.startDialogueQuiz(d.id,roundSettings);finishRound();assert.equal(c.isDialogueWeak(d.id),false);assert.equal(c.isDialogueLearned(d.id),true);
c.renderDialogueQuizResult();assert.doesNotMatch(c.app.innerHTML,/>Review mistakes<\/button>/);
const styles=fs.readFileSync(path.join(root,'css/style.css'),'utf8');
assert.match(moduleSource,/primary-button quiz-start-button dialogue-quiz-start-button/);
assert.match(styles,/\.quiz-start-area>\.dialogue-quiz-start-button\{width:100%\}/);
assert.match(styles,/\.quiz-result-actions\.dialogue-quiz-result-actions\{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax\(0,1fr\)\}/);
assert.equal(c.dialogueQuizSummary().today,2);assert.equal(c.dialogueQuizSummary().perfect,1);
c.setDialogueWeak(d.id,true);assert.ok(c.dialogueQuizPool(settings("test","blank","weak")).some(x=>x.id===d.id));
c.filters.dialogue.scope="weak";assert.ok(c.filteredDialogues().every(x=>c.isDialogueWeak(x.id)));c.filters.dialogue.scope="all";
savedIds.add(d.id);assert.ok(c.dialogueQuizPool(settings("test","blank","saved")).some(x=>x.id===d.id));
assert.ok(c.dialogueQuizPool(settings("test","blank","learned")).some(x=>x.id===d.id));assert.ok(!c.dialogueQuizPool(settings("test","blank","unlearned")).some(x=>x.id===d.id));
assert.ok(c.dialogueQuizPool({...roundSettings,season:2}).every(x=>c.seasonNum(x.season)===2));
reset();c.startDialogueQuiz(d.id,settings("practice","fill"));c.toggleDialogueQuizJapanese();
assert.equal(c.getDialogueQuizSession().settings.japanese,true);assert.equal(c.filters.dialogueQuiz.japanese,true);
assert.ok(c.app.innerHTML.includes(d.lines[0][2]));assert.equal(dom.dialogueQuizJapanese.textContent,'日本語訳 表示');assert.equal(dom.dialogueQuizJP0.hidden,false);finishRound();assert.equal(c.dialogueQuizSummary().today,0);
c.nextQuizDialogue();assert.equal(c.getDialogueQuizSession().settings.mode,"practice");assert.equal(c.getDialogueQuizSession().settings.type,"fill");assert.equal(c.getDialogueQuizSession().settings.japanese,true);
reset();c.startDialogueQuiz(d.id,{...roundSettings,japanese:true});c.renderDialogueQuizPlay();assert.doesNotMatch(c.app.innerHTML,/日本語訳|dialogue-quiz-translations/);
storage[c.STORE.dialogueQuiz].questions[0].answer="tampered";assert.equal(c.getDialogueQuizSession(),null);
reset();c.filters.quizTab="dialogues";c.startQuickChallenge();assert.equal(c.filters.quizTab,"phrases");assert.equal(c.quickCalled,true);
const restored=c.safeBackupState({currentSeries:"friends",filters:{quizTab:"dialogues",dialogueQuiz:{...roundSettings,japanese:true}}},[]);
assert.equal(restored.filters.quizTab,"dialogues");assert.equal(restored.filters.dialogueQuiz.japanese,true);
assert.match(source,/Dialogue Quizの「苦手」って何/);assert.match(source,/Dialogue練習では日本語訳ON \/ OFF/);
// Batch answering: every target available, editable drafts, no grading/Weak/sound until Check.
reset();c.startDialogueQuiz(d.id,settings('practice','blank'));c.renderDialogueQuizPlay();
const page=c.app.innerHTML,initialSession=c.getDialogueQuizSession(),firstQuestion=initialSession.questions[0];
assert.ok(page.includes('dialogueQuizPage'));assert.ok(!page.includes('dialogue-quiz-translations'));
assert.equal(dom.dialogueQuizCheck.disabled,true);
assert.equal(Object.hasOwn(initialSession,'index'),false);
assert.equal(c.isDialogueWeak(d.id),false);
const wrongChoice=firstQuestion.choices.find(a=>a!==firstQuestion.answer);
c.answerDialogueQuizChoice(0,firstQuestion.choices.indexOf(wrongChoice));
assert.equal(c.getDialogueQuizSession().responses.length,0);assert.equal(c.isDialogueWeak(d.id),false);assert.equal(soundCalls,0);
assert.equal(c.app.innerHTML,page,'Selecting preserves Dialogue page');
assert.match(dom[`dialogueQuizControls${firstQuestion.lineIndex}`].innerHTML,/selected/);
assert.doesNotMatch(dom[`dialogueQuizControls${firstQuestion.lineIndex}`].innerHTML,/feedback|Correct:|Incorrect/);
c.answerDialogueQuizChoice(0,firstQuestion.choices.indexOf(firstQuestion.answer));
assert.equal(c.getDialogueQuizSession().drafts[0],firstQuestion.answer,'Can change choice');
for(let i=0;i<d.lines.length;i++)assert.equal((dom[`dialogueQuizControls${i}`].innerHTML.match(/data-question-index=/g)||[]).length,initialSession.questions.filter(q=>q.lineIndex===i).length,'All answer UIs initially present');
assert.match(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),firstQuestion.lineIndex),/_____/,'Choice does not reveal');
c.checkDialogueQuizAnswers();assert.equal(c.getDialogueQuizSession().graded,false,'Partial answers cannot be checked');
for(let i=1;i<initialSession.questions.length;i++)c.saveDialogueQuizAnswer(i,initialSession.questions[i].answer);
assert.equal(dom.dialogueQuizCheck.disabled,false);c.checkDialogueQuizAnswers();
assert.equal(c.app.innerHTML,page,'Checking preserves Dialogue page');
assert.equal(c.getDialogueQuizSession().responses.length,initialSession.questions.length);
assert.ok(c.getDialogueQuizSession().responses.every(r=>r.correct));
assert.equal(dom.dialogueQuizResult.hidden,false);assert.equal(dom.dialogueQuizCheck.hidden,true);
assert.match(dom[`dialogueQuizControls${firstQuestion.lineIndex}`].innerHTML,/Correct/);
const locked=clone(c.getDialogueQuizSession());c.saveDialogueQuizAnswer(0,wrongChoice);c.answerDialogueQuizChoice(0,firstQuestion.choices.indexOf(wrongChoice));c.checkDialogueQuizAnswers();
assert.deepEqual(clone(c.getDialogueQuizSession()),locked,'Graded answers locked and no duplicate grading');
for(const r of firstQuestion.ranges)assert.ok(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),firstQuestion.lineIndex).includes(d.lines[firstQuestion.lineIndex][1].slice(r.index,r.index+r.length)));

// All input fields coexist. Whitespace is unanswered; typing has no grading or rerender.
reset();c.startDialogueQuiz(d.id,settings('practice','fill'));c.renderDialogueQuizPlay();
const fillSession=c.getDialogueQuizSession(),fillPage=c.app.innerHTML;
assert.equal(fillSession.questions.length,8);
assert.equal(Object.values(dom).reduce((n,e)=>n+(e.innerHTML.match(/id="dialogueQuizInput\d+"/g)||[]).length,0),8);
c.saveDialogueQuizAnswer(5,'draft');c.saveDialogueQuizAnswer(5,'edited');
assert.equal(c.getDialogueQuizSession().drafts[5],'edited');assert.equal(c.getDialogueQuizSession().responses.length,0);
assert.equal(c.app.innerHTML,fillPage);assert.equal(c.isDialogueWeak(d.id),false);
for(let i=0;i<fillSession.questions.length;i++)c.saveDialogueQuizAnswer(i,fillSession.questions[i].answer);
c.saveDialogueQuizAnswer(3,'   ');assert.equal(dom.dialogueQuizCheck.disabled,true);
c.checkDialogueQuizAnswers();assert.equal(c.getDialogueQuizSession().graded,false);
c.saveDialogueQuizAnswer(3,fillSession.questions[3].answer);assert.equal(dom.dialogueQuizCheck.disabled,false);
c.toggleDialogueQuizJapanese();assert.equal(c.getDialogueQuizSession().drafts[5],fillSession.questions[5].answer,'Japanese toggle preserves drafts');
c.checkDialogueQuizAnswers();assert.ok(c.getDialogueQuizSession().responses.every(r=>r.correct));
assert.match(dom[`dialogueQuizControls${fillSession.questions[0].lineIndex}`].innerHTML,/disabled/);

// First-turn line choices remain hidden until all responses are checked.
reset();c.startDialogueQuiz(d.id,settings('practice','line'));c.renderDialogueQuizPlay();
const lineSession=c.getDialogueQuizSession();assert.equal(lineSession.questions[0].lineIndex,0);
for(let i=0;i<lineSession.questions.length;i++)c.saveDialogueQuizAnswer(i,lineSession.questions[i].answer);
assert.match(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),0),/████/);
c.checkDialogueQuizAnswers();assert.ok(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),0).includes(d.lines[0][1]));

// Weak/history only change when batch-checked, not when showing Result (or checking twice).
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);c.renderDialogueQuizPlay();
const weakRound=c.getDialogueQuizSession();
for(let i=0;i<weakRound.questions.length;i++)c.saveDialogueQuizAnswer(i,i===0?weakRound.questions[0].choices.find(a=>a!==weakRound.questions[0].answer):weakRound.questions[i].answer);
assert.equal(c.isDialogueWeak(d.id),false);assert.equal(c.dialogueQuizSummary().today,0);
c.checkDialogueQuizAnswers();assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);
assert.equal(c.dialogueQuizSummary().today,1);c.checkDialogueQuizAnswers();assert.equal(c.dialogueQuizSummary().today,1);
c.completeDialogueQuiz();assert.equal(c.dialogueQuizSummary().today,1);
c.reviewDialogueQuizMistakes();c.renderDialogueQuizPlay();assert.equal(c.getDialogueQuizSession().graded,false);finishRound();assert.equal(c.isDialogueWeak(d.id),true);

// Legacy sessions keep entered answers as editable drafts and do not require an active index.
const legacyEntries=c.dialogueQuizEntries(d);storage[c.STORE.dialogueQuiz]={version:1,dialogueId:d.id,settings:settings('practice','blank'),review:false,index:1,questions:legacyEntries.map(e=>({...e,type:'blank',choices:[e.answer,'to to '+e.answer,'for for '+e.answer,'would would '+e.answer]})),responses:[{index:0,answer:legacyEntries[0].answer,correct:true}]};
const migrated=c.getDialogueQuizSession();assert.equal(migrated.version,3);assert.equal(migrated.responses.length,0);
assert.equal(migrated.drafts[0],legacyEntries[0].answer);assert.equal(Object.hasOwn(migrated,'index'),false);
assert.ok(migrated.questions.every(q=>q.choices.every(a=>! /\b([a-z]+)\s+\1\b/i.test(a))));
storage[c.STORE.dialogueQuiz]={...clone(migrated),version:2,index:2,responses:[{index:0,answer:migrated.questions[0].answer,correct:true}]};
delete storage[c.STORE.dialogueQuiz].drafts;delete storage[c.STORE.dialogueQuiz].graded;
assert.equal(c.getDialogueQuizSession().drafts[0],migrated.questions[0].answer);
assert.ok(!moduleSource.includes('lineIndex===0||'),'No first-turn swap/fallback');
for(const token of ['scrollDialogueQuizTarget','nextDialogueQuizQuestion','active-target','s.index','setTimeout','Next Question'])assert.ok(!moduleSource.includes(token),`No sequential progression: ${token}`);
console.log(`Dialogue Quiz production ${dialogues.length} dialogues / ${totalQuestions} questions, batch answers/grading, Weak, Review, input, filters, persistence and scoring PASS`);
