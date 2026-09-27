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
  c.checkDialogueQuizAnswers();
  if(s.review){const reviewed=c.getDialogueQuizSession();assert.equal(reviewed.graded,true);return {...reviewed,score:reviewed.responses.filter(r=>r.correct).length,total:reviewed.questions.length}}
  assert.equal(c.getDialogueQuizSession(),null);return c.route.params.result;
}
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);assert.ok(c.getDialogueQuizSession());
let result=finishRound([0]);assert.equal(result.score,result.total-1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);
assert.equal(c.dialogueQuizSummary().today,1);assert.equal(c.dialogueQuizSummary().perfect,0);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/Incorrect/);assert.match(c.app.innerHTML,/Review mistakes/);assert.match(c.app.innerHTML,/Next Round/);
assert.match(c.app.innerHTML,/quiz-result-actions section/);
assert.equal((c.app.innerHTML.match(/<button[^>]*>Review mistakes<\/button>/g)||[]).length,1);
c.reviewDialogueQuizMistakes();assert.equal(c.getDialogueQuizSession().questions.length,1);assert.equal(c.getDialogueQuizSession().review,true);
result=finishRound();assert.equal(result.score,1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.dialogueQuizSummary().today,1);
c.startDialogueQuiz(d.id,roundSettings);finishRound();assert.equal(c.isDialogueWeak(d.id),false);assert.equal(c.isDialogueLearned(d.id),true);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/<button class="primary-button" disabled>Review mistakes<\/button>/);
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
// Home stays structurally aligned with Phrase Quiz; test scope data is retained but UI hidden.
reset();c.filters.dialogueQuiz={...roundSettings,scope:'weak'};c.renderDialogueQuizHome();
assert.doesNotMatch(c.app.innerHTML,/絞り込み|setDialogueQuizOption\('scope'/);
assert.equal(c.filters.dialogueQuiz.scope,'weak');
assert.doesNotMatch(c.app.innerHTML,/<strong>\d+ Dialogues<\/strong>/);
assert.ok(c.app.innerHTML.indexOf('quiz-start-area')<c.app.innerHTML.indexOf('quiz-settings-panel'));
assert.ok(c.app.innerHTML.indexOf('quiz-settings-panel')<c.app.innerHTML.indexOf('quiz-stats-card'));
assert.ok(c.app.innerHTML.indexOf('quiz-stats-card')<c.app.innerHTML.indexOf('quiz-mode-note'));
c.filters.dialogueQuiz=settings('practice');c.renderDialogueQuizHome();
assert.match(c.app.innerHTML,/絞り込み/);assert.match(c.app.innerHTML,/日本語訳/);
assert.doesNotMatch(c.app.innerHTML,/quiz-stats-card/,'Same practice structure as Phrase home');
assert.match(styles,/\.quiz-kind-tabs\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:0;padding:0/);

// Draft choice changes never grade/reveal. See Results grades and navigates directly once.
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,settings('practice','blank'));c.renderDialogueQuizPlay();
const page=c.app.innerHTML,initialSession=c.getDialogueQuizSession(),firstQuestion=initialSession.questions[0];
assert.match(page,/>See Results<\/button>/);assert.doesNotMatch(page,/答え合わせ|dialogueQuizResult/);
assert.equal(dom.dialogueQuizCheck.disabled,true);assert.equal(Object.hasOwn(initialSession,'index'),false);
const wrongChoice=firstQuestion.choices.find(a=>a!==firstQuestion.answer);
c.answerDialogueQuizChoice(0,firstQuestion.choices.indexOf(wrongChoice));
assert.equal(c.getDialogueQuizSession().responses.length,0);assert.equal(c.isDialogueWeak(d.id),false);assert.equal(soundCalls,0);
assert.equal(c.app.innerHTML,page);
c.answerDialogueQuizChoice(0,firstQuestion.choices.indexOf(firstQuestion.answer));
assert.equal(c.getDialogueQuizSession().drafts[0],firstQuestion.answer);
for(let i=0;i<d.lines.length;i++){
  const markup=dom[`dialogueQuizControls${i}`].innerHTML;
  assert.equal((markup.match(/data-question-index=/g)||[]).length,initialSession.questions.filter(q=>q.lineIndex===i).length);
  assert.doesNotMatch(markup,/選んでください|入力してください|feedback|Your answer|Correct:/);
}
assert.match(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),firstQuestion.lineIndex),/_____/);
c.checkDialogueQuizAnswers();assert.equal(c.getDialogueQuizSession().graded,false);
for(let i=1;i<initialSession.questions.length;i++)c.saveDialogueQuizAnswer(i,initialSession.questions[i].answer);
assert.equal(dom.dialogueQuizCheck.disabled,false);c.checkDialogueQuizAnswers();
assert.equal(c.route.name,'quizResult');assert.equal(c.getDialogueQuizSession(),null);
assert.equal(c.route.params.result.score,initialSession.questions.length);
assert.equal(c.app.innerHTML,page,'No intermediate grading UI before Result navigation');
const originalResult=clone(c.route.params.result);c.checkDialogueQuizAnswers();assert.deepEqual(clone(c.route.params.result),originalResult);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/quiz-result-status correct/);
assert.doesNotMatch(c.app.innerHTML,/Correct:|Your answer:|Next Dialogue/);
assert.match(c.app.innerHTML,/>Next Round<\/button>/);assert.match(c.app.innerHTML,/dialogue-result-item/);

// Input drafts all coexist. Whitespace disables; normalization stays unchanged.
reset();c.startDialogueQuiz(d.id,settings('practice','fill'));c.renderDialogueQuizPlay();
const fillSession=c.getDialogueQuizSession(),fillPage=c.app.innerHTML;
assert.equal(Object.values(dom).reduce((n,e)=>n+(e.innerHTML.match(/id="dialogueQuizInput\d+"/g)||[]).length,0),8);
c.saveDialogueQuizAnswer(5,'draft');c.saveDialogueQuizAnswer(5,'edited');
assert.equal(c.getDialogueQuizSession().drafts[5],'edited');assert.equal(c.getDialogueQuizSession().responses.length,0);
for(let i=0;i<fillSession.questions.length;i++)c.saveDialogueQuizAnswer(i,fillSession.questions[i].answer);
c.saveDialogueQuizAnswer(3,'   ');assert.equal(dom.dialogueQuizCheck.disabled,true);c.checkDialogueQuizAnswers();assert.equal(c.getDialogueQuizSession().graded,false);
c.saveDialogueQuizAnswer(3,fillSession.questions[3].answer);c.toggleDialogueQuizJapanese();
assert.equal(c.getDialogueQuizSession().drafts[5],fillSession.questions[5].answer);c.checkDialogueQuizAnswers();
assert.equal(c.route.name,'quizResult');assert.equal(c.route.params.result.score,8);

// Line choices: first turn eligible; no reveal until direct Result.
reset();c.startDialogueQuiz(d.id,settings('practice','line'));c.renderDialogueQuizPlay();
const lineSession=c.getDialogueQuizSession();assert.equal(lineSession.questions[0].lineIndex,0);
for(let i=0;i<lineSession.questions.length;i++)c.saveDialogueQuizAnswer(i,lineSession.questions[i].answer);
assert.match(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),0),/████/);
c.checkDialogueQuizAnswers();assert.equal(c.route.name,'quizResult');assert.equal(c.getDialogueQuizSession(),null);

// Quick Review uses incorrect targets + preceding context, never independent full Result/history.
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);const normal=finishRound([0,1]);
assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);assert.equal(c.dialogueQuizSummary().today,1);
c.renderDialogueQuizResult();assert.match(c.app.innerHTML,/quiz-result-status incorrect/);
assert.match(c.app.innerHTML,/Your answer:|Correct:/);
c.reviewDialogueQuizMistakes();c.renderDialogueQuizPlay();
const review=c.getDialogueQuizSession();assert.equal(review.questions.length,2);assert.deepEqual(clone(review.parentResult),clone(normal));
assert.deepEqual([...c.dialogueQuizVisibleLines(d,review)],[...new Set(review.questions.flatMap(q=>[q.lineIndex-1,q.lineIndex]).filter(i=>i>=0))].sort((a,b)=>a-b));
assert.ok(c.dialogueQuizVisibleLines(d,review).length<d.lines.length);
const reviewPage=c.app.innerHTML,routeBefore=c.route.name;
assert.doesNotMatch(reviewPage,/学習Phrase|未出題|mistake-list/);
const reviewed=finishRound();assert.equal(reviewed.score,2);assert.equal(c.route.name,routeBefore);
assert.equal(c.app.innerHTML,reviewPage,'Quick Review grade updates page, not full Result');
assert.equal(dom.dialogueQuizBack.hidden,false);assert.equal(dom.dialogueQuizDone.hidden,false);
assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.dialogueQuizSummary().today,1);
c.backToDialogueQuizResults();assert.equal(c.route.name,'quizResult');assert.deepEqual(clone(c.route.params.result),clone(normal));
c.reviewDialogueQuizMistakes();c.doneDialogueQuickReview();assert.equal(c.route.name,'quiz');assert.equal(c.getDialogueQuizSession(),null);
assert.match(styles,/\.dialogue-result-item\{grid-template-columns:minmax\(0,1fr\)/);
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
