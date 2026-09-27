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
  app:{innerHTML:"",querySelector:()=>null},document:{getElementById:id=>id==='dialogueQuizPage'&&!c.app.innerHTML.includes('id="dialogueQuizPage"')?null:element(id)},window:{innerHeight:800},listPageHeader:()=>"",dialogueCard:d=>`<article>${d.title}</article>`,
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
function finishRound(miss=[]){let s=c.getDialogueQuizSession();for(let i=s.index;i<s.questions.length;i++){
  s=c.getDialogueQuizSession();c.answerDialogueQuiz(miss.includes(i)?"wrong":s.questions[i].answer);
  const responses=c.getDialogueQuizSession().responses.length;c.answerDialogueQuiz("wrong");assert.equal(c.getDialogueQuizSession().responses.length,responses,"No duplicate submission");
  c.nextDialogueQuizQuestion();
}return c.route.params.result}
reset();storage.dialogueLearned={friends:[d.id]};c.startDialogueQuiz(d.id,roundSettings);assert.ok(c.getDialogueQuizSession());
let result=finishRound([0]);assert.equal(result.score,result.total-1);assert.equal(c.isDialogueWeak(d.id),true);assert.equal(c.isDialogueLearned(d.id),true);
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
assert.ok(c.app.innerHTML.includes(d.lines[0][2]));assert.equal(dom.dialogueQuizJapanese.textContent,'日本語訳 表示');assert.equal(dom.dialogueQuizJP0.hidden,false);finishRound();assert.equal(c.dialogueQuizSummary().today,0);
c.nextQuizDialogue();assert.equal(c.getDialogueQuizSession().settings.mode,"practice");assert.equal(c.getDialogueQuizSession().settings.type,"fill");assert.equal(c.getDialogueQuizSession().settings.japanese,true);
reset();c.startDialogueQuiz(d.id,{...roundSettings,japanese:true});c.renderDialogueQuizPlay();assert.doesNotMatch(c.app.innerHTML,/日本語訳|dialogue-quiz-translations/);
storage[c.STORE.dialogueQuiz].questions[0].answer="tampered";assert.equal(c.getDialogueQuizSession(),null);
reset();c.filters.quizTab="dialogues";c.startQuickChallenge();assert.equal(c.filters.quizTab,"phrases");assert.equal(c.quickCalled,true);
const restored=c.safeBackupState({currentSeries:"friends",filters:{quizTab:"dialogues",dialogueQuiz:{...roundSettings,japanese:true}}},[]);
assert.equal(restored.filters.quizTab,"dialogues");assert.equal(restored.filters.dialogueQuiz.japanese,true);
assert.match(source,/Dialogue Quizの「苦手」って何/);assert.match(source,/Dialogue練習では日本語訳ON \/ OFF/);
reset();c.startDialogueQuiz(d.id,settings('practice','blank'));c.renderDialogueQuizPlay();
const page=c.app.innerHTML,initialSession=c.getDialogueQuizSession(),firstQuestion=initialSession.questions[0];
assert.ok(page.includes('dialogueQuizPage'));assert.ok(!page.includes('dialogue-quiz-translations'));
c.answerDialogueQuiz(firstQuestion.answer);assert.equal(c.app.innerHTML,page,'Answer preserves the Dialogue page');
c.nextDialogueQuizQuestion();assert.equal(c.app.innerHTML,page,'Next target preserves the Dialogue page');assert.match(dom.dialogueQuizCount.textContent,/Question 2/);
for(const r of firstQuestion.ranges)assert.ok(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),firstQuestion.lineIndex).includes(d.lines[firstQuestion.lineIndex][1].slice(r.index,r.index+r.length)),'Answered target is restored');
reset();c.startDialogueQuiz(d.id,settings('practice','line'));const lineSession=c.getDialogueQuizSession();
assert.equal(lineSession.questions[0].lineIndex,0,'First utterance remains eligible');c.answerDialogueQuiz('wrong');
assert.ok(c.dialogueQuizLineMarkup(d,c.getDialogueQuizSession(),0).includes(d.lines[0][1]));
const legacyEntries=c.dialogueQuizEntries(d);storage[c.STORE.dialogueQuiz]={version:1,dialogueId:d.id,settings:settings('practice','blank'),review:false,index:1,questions:legacyEntries.map(e=>({...e,type:'blank',choices:[e.answer,'to to '+e.answer,'for for '+e.answer,'would would '+e.answer]})),responses:[{index:0,answer:legacyEntries[0].answer,correct:true}]};
const migrated=c.getDialogueQuizSession();assert.equal(migrated.version,2);assert.equal(migrated.responses.length,1,'v1 completed answer preserved');assert.ok(migrated.questions.every(q=>q.choices.every(a=>! /\b([a-z]+)\s+\1\b/i.test(a))));
assert.ok(!moduleSource.includes('lineIndex===0||'),'No first-turn swap/fallback');
reset();let advance;c.window.setTimeout=callback=>{advance=callback};c.startDialogueQuiz(d.id,settings('practice','blank'));c.renderDialogueQuizPlay();const stablePage=c.app.innerHTML;c.answerDialogueQuiz(c.getDialogueQuizSession().questions[0].answer);assert.equal(typeof advance,'function');advance();assert.equal(c.getDialogueQuizSession().index,1);assert.equal(c.app.innerHTML,stablePage,'Automatic advance does not rebuild the Dialogue page');delete c.window.setTimeout;
console.log(`Dialogue Quiz production ${dialogues.length} dialogues / ${totalQuestions} questions, generation, Weak, Review, input, filters, persistence and scoring PASS`);
