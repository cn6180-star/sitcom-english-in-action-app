"use strict";

// Dialogue rounds are independent of Phrase Quiz sessions, scores and promotion.
STORE.dialogueQuiz="sitcomEnglish_dialogueQuizInProgress";
const DIALOGUE_QUIZ_TYPES=["blank","next","fill"];
const dialogueQuizEntryCache=new Map();
function dialogueQuizSettings(value=filters.dialogueQuiz){
  const v=value&&typeof value==="object"?value:{};
  return{mode:v.mode==="practice"?"practice":"test",type:DIALOGUE_QUIZ_TYPES.includes(v.type)?v.type:"blank",season:v.season==="ALL"||SEASONS.includes(Number(v.season))?v.season:"ALL",scope:["all","weak","unlearned","learned","saved"].includes(v.scope)?v.scope:"all",japanese:Boolean(v.japanese)};
}
function dialogueWeakIds(){const ids=dialogueLearnedState().weak;return Array.isArray(ids)?ids.filter(id=>DIALOGUES.some(d=>d.id===id)):[]}
function isDialogueWeak(id){return dialogueWeakIds().includes(id)}
function setDialogueWeak(id,on){const state=dialogueLearnedState(),ids=new Set(dialogueWeakIds());if(on)ids.add(id);else ids.delete(id);state.weak=[...ids];writeJSON(STORE.dialogueLearned,state)}
function dialogueQuizPool(settings=dialogueQuizSettings()){
  return DIALOGUES.filter(d=>(settings.season==="ALL"||seasonNum(d.season)===Number(settings.season))&&(settings.scope!=="weak"||isDialogueWeak(d.id))&&(settings.scope!=="unlearned"||!isDialogueLearned(d.id))&&(settings.scope!=="learned"||isDialogueLearned(d.id))&&(settings.scope!=="saved"||bookmarked("dialogue",d.id)));
}
function dialogueQuizEntries(d){
  if(dialogueQuizEntryCache.has(d.id))return dialogueQuizEntryCache.get(d.id);
  const linked=d.phraseLinks.map(id=>PHRASES.find(p=>p.id===id)).filter(Boolean),matches=dialoguePhraseMatchResults(d,linked);
  const entries=linked.map(p=>{
    // One target per question: unrelated highlights must not suppress its existing range.
    const selected=d.lines.flatMap((line,lineIndex)=>selectedDialogueMatches(matches.filter(m=>m.phraseId===p.id&&m.lineIndex===lineIndex)).map(m=>({...m,lineIndex})));
    const first=selected.find(m=>m.phraseId===p.id);if(!first)return null;
    const ranges=selected.filter(m=>m.phraseId===p.id&&m.lineIndex===first.lineIndex).map(m=>({index:m.index,length:m.length}));
    const answer=ranges.map(r=>d.lines[first.lineIndex][1].slice(r.index,r.index+r.length)).join(" … ");
    return{phraseId:p.id,lineIndex:first.lineIndex,ranges,answer};
  });
  dialogueQuizEntryCache.set(d.id,entries);return entries;
}
function dialogueQuizBlankText(text,ranges){let result="",cursor=0;for(const r of ranges){result+=text.slice(cursor,r.index)+"_____";cursor=r.index+r.length}return result+text.slice(cursor)}
function dialogueQuizChoices(answer,index=0){
  // Deliberately malformed repeated function words: never plausible synonyms.
  const distractors=["to to","for for","would would"].map(words=>answer.slice(0,index)+words+" "+answer.slice(index));
  return shuffle([answer,...distractors]);
}
function createDialogueQuizQuestions(d,settings,onlyPhraseIds=null){
  const entries=dialogueQuizEntries(d);if(entries.some(e=>!e))return[];
  let selected=entries.filter(e=>!onlyPhraseIds||onlyPhraseIds.includes(e.phraseId)),types=selected.map((_,i)=>settings.mode==="test"?DIALOGUE_QUIZ_TYPES[i%3]:settings.type);
  if(settings.mode==="practice"&&settings.type==="next"){
    const lines=new Set();selected=selected.filter(e=>e.lineIndex>0&&!lines.has(e.lineIndex)&&lines.add(e.lineIndex));types=selected.map(()=>"next");
  }else if(settings.mode==="test"){
    const used=new Set();
    for(let i=0;i<selected.length;i++)if(types[i]==="next"){
      if(selected[i].lineIndex===0||used.has(selected[i].lineIndex)){
        const swap=selected.findIndex((e,j)=>types[j]!=="next"&&e.lineIndex>0&&!used.has(e.lineIndex)&&!selected.some((other,k)=>k!==i&&types[k]==="next"&&other.lineIndex===e.lineIndex));
        if(swap>=0){[types[i],types[swap]]=[types[swap],types[i]];if(swap<i)used.add(selected[swap].lineIndex)}else types[i]="blank";
      }else used.add(selected[i].lineIndex);
    }
  }
  return selected.map((e,i)=>{const type=types[i],answer=type==="next"?d.lines[e.lineIndex][1]:e.answer;return{...e,type,answer,choices:type==="fill"?[]:dialogueQuizChoices(answer,type==="next"?e.ranges[0].index:0)}});
}
function normalizeDialogueQuizInput(value){
  let text=String(value??"").replace(/[’‘]/g,"'").trim();
  const contractions={"can't":"cannot","won't":"will not","don't":"do not","doesn't":"does not","didn't":"did not","isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not","haven't":"have not","hasn't":"has not","hadn't":"had not","couldn't":"could not","wouldn't":"would not","shouldn't":"should not","mustn't":"must not"};
  text=text.replace(/\b(?:can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|couldn't|wouldn't|shouldn't|mustn't)\b/gi,word=>{const expanded=contractions[word.toLowerCase()];return word===word.toUpperCase()?expanded.toUpperCase():word[0]===word[0].toUpperCase()?expanded[0].toUpperCase()+expanded.slice(1):expanded});
  text=text.replace(/\b(I|[Yy]ou|[Ww]e|[Tt]hey|[Hh]e|[Ss]he|[Ii]t)'(m|re|ve|ll)\b/g,(_,subject,ending)=>subject+" "+({m:"am",re:"are",ve:"have",ll:"will"}[ending]));
  return text.replace(/[.,!?;:…~]/g," ").replace(/\s+/g," ").trim();
}
function dialogueQuizInputMatches(answer,expected){return normalizeDialogueQuizInput(answer)===normalizeDialogueQuizInput(expected)}
function getDialogueQuizSession(){
  const s=readJSON(STORE.dialogueQuiz,null),d=s&&DIALOGUES.find(d=>d.id===s.dialogueId);
  if(!d||s.version!==1||!Array.isArray(s.questions)||!s.questions.length||!Number.isInteger(s.index)||s.index<0||s.index>=s.questions.length||!Array.isArray(s.responses)||typeof s.review!=="boolean")return null;
  const settings=dialogueQuizSettings(s.settings),entries=dialogueQuizEntries(d),ids=new Set();
  if(!s.questions.every(q=>{const entry=entries.find(e=>e?.phraseId===q?.phraseId);return entry&&!ids.has(q.phraseId)&&ids.add(q.phraseId)&&DIALOGUE_QUIZ_TYPES.includes(q.type)&&q.lineIndex===entry.lineIndex&&JSON.stringify(q.ranges)===JSON.stringify(entry.ranges)&&q.answer===(q.type==="next"?d.lines[q.lineIndex][1]:entry.answer)&&(q.type!=="next"||q.lineIndex>0)&&(q.type==="fill"||Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices).size===4&&q.choices.includes(q.answer))}))return null;
  const indexes=new Set();if(!s.responses.every(r=>r&&Number.isInteger(r.index)&&r.index>=0&&r.index<s.questions.length&&!indexes.has(r.index)&&indexes.add(r.index)&&typeof r.correct==="boolean"))return null;
  return{...s,settings};
}
function quizKindTabsMarkup(){const dialogue=filters.quizTab==="dialogues";return `<div class="segmented quiz-kind-tabs" role="tablist" aria-label="Quiz content"><button class="seg-button ${dialogue?'':'selected'}" role="tab" aria-selected="${!dialogue}" onclick="setQuizKind('phrases')">Phrases</button><button class="seg-button ${dialogue?'selected':''}" role="tab" aria-selected="${dialogue}" onclick="setQuizKind('dialogues')">Dialogues</button></div>`}
function setQuizKind(kind){filters.quizTab=kind==="dialogues"?"dialogues":"phrases";saveAppState();renderQuizHome()}
function setDialogueQuizOption(key,value){filters.dialogueQuiz={...dialogueQuizSettings(),[key]:value};saveAppState();renderDialogueQuizHome()}
function dialogueQuizHistory(){const history=dialogueLearnedState().quizHistory;return Array.isArray(history)?history.filter(r=>r&&DIALOGUES.some(d=>d.id===r.dialogueId)&&Number.isInteger(r.score)&&Number.isInteger(r.total)&&r.score>=0&&r.score<=r.total):[]}
function dialogueQuizSummary(){const history=dialogueQuizHistory(),today=history.filter(r=>r.date===localDate());return{last:history.at(-1)||null,today:today.length,perfect:today.filter(r=>r.score===r.total).length}}
function renderDialogueQuizHome(){
  const settings=dialogueQuizSettings(),session=getDialogueQuizSession(),pool=dialogueQuizPool(settings),summary=dialogueQuizSummary();
  const buttons=(key,values)=>values.map(([value,label])=>`<button class="chip ${String(settings[key])===String(value)?'selected':''}" aria-pressed="${String(settings[key])===String(value)}" onclick="setDialogueQuizOption('${key}','${value}')">${label}</button>`).join("");
  app.innerHTML=`${listPageHeader("Quiz")}${quizKindTabsMarkup()}<div class="segmented quiz-mode-tabs" role="tablist" aria-label="Dialogue quiz mode"><button class="seg-button ${settings.mode==='test'?'selected':''}" role="tab" aria-selected="${settings.mode==='test'}" onclick="setDialogueQuizOption('mode','test')">本番</button><button class="seg-button ${settings.mode==='practice'?'selected':''}" role="tab" aria-selected="${settings.mode==='practice'}" onclick="setDialogueQuizOption('mode','practice')">練習</button></div><div class="quiz-start-area">${session?`<span>${esc(DIALOGUES.find(d=>d.id===session.dialogueId).title)} · ${session.responses.length}/${session.questions.length}</span><div class="button-row"><button class="primary-button" onclick="navigate('quizPlay',{quizKind:'dialogue'})">Resume Quiz</button><button class="secondary-button" onclick="confirmDialogueQuizRestart()">Start Over</button></div>`:`<button class="primary-button" ${pool.length?'onclick="startDialogueQuiz()"':'disabled'}>${settings.mode==='practice'?'Start Practice':'Start Quiz'}</button>`}</div><section class="card filter-panel quiz-settings-panel">${settings.mode==='practice'?`<div class="filter-group"><div class="filter-label">問題形式</div><div class="chips">${buttons('type',[["blank","穴埋め4択"],["next","次のセリフ4択"],["fill","穴埋め入力"]])}</div></div>`:''}<div class="filter-group"><div class="filter-label">絞り込み</div><div class="chips">${buttons('scope',[["all","全て"],["weak","苦手"],["unlearned","未習得"],["learned","習得済み"],["saved","保存"]])}</div></div><div class="filter-group"><div class="filter-label">シーズン</div><div class="chips">${buttons('season',[["ALL","全て"],...SEASONS.map(s=>[s,`S${s}`])])}</div></div><p class="page-subtitle">${pool.length} dialogues available · 1 Round = 1 Dialogue</p><p id="dialogueQuizStatus" role="status"></p></section><section class="card quiz-stats-card"><h2 class="section-title">Your Dialogue Quiz</h2><div class="stats-row"><div class="stat-box"><span>Last</span><strong>${summary.last?`${summary.last.score}/${summary.last.total}`:'—'}</strong></div><div class="stat-box"><span>Today</span><strong>${summary.today} Dialogues</strong></div><div class="stat-box"><span>Perfect</span><strong>${summary.perfect}</strong></div></div><p class="muted">本番の通常Roundのみ集計</p></section>`;
}
function confirmDialogueQuizRestart(){showConfirm("Start the dialogue quiz over?",()=>{safeRemoveItem(STORE.dialogueQuiz);startDialogueQuiz()})}
function startDialogueQuiz(id=null,settings=dialogueQuizSettings(),reviewQuestions=null){
  settings=dialogueQuizSettings(settings);
  const pool=dialogueQuizPool(settings),d=id?DIALOGUES.find(d=>d.id===id):sampleValues(pool,1)[0];if(!d)return;
  const questions=reviewQuestions||createDialogueQuizQuestions(d,settings);
  if(!questions.length){const status=document.getElementById("dialogueQuizStatus");if(status)status.textContent="この形式で出題できる学習Phraseがありません。別の形式またはDialogueを選んでください。";return}
  filters.quizTab="dialogues";filters.dialogueQuiz={...settings};saveAppState();
  writeJSON(STORE.dialogueQuiz,{version:1,dialogueId:d.id,settings,review:Boolean(reviewQuestions),questions,index:0,responses:[]});navigate("quizPlay",{quizKind:"dialogue"});playQuizStartSound();
}
function toggleDialogueQuizJapanese(){const session=getDialogueQuizSession();if(!session||session.settings.mode!=="practice")return;session.settings.japanese=!session.settings.japanese;filters.dialogueQuiz={...dialogueQuizSettings(),japanese:session.settings.japanese};saveAppState();writeJSON(STORE.dialogueQuiz,session);renderDialogueQuizPlay()}
function renderDialogueQuizPlay(){
  const s=getDialogueQuizSession();if(!s){route={name:"quiz",params:{}};filters.quizTab="dialogues";render();return}
  const d=DIALOGUES.find(d=>d.id===s.dialogueId),q=s.questions[s.index],response=s.responses.find(r=>r.index===s.index),practice=s.settings.mode==="practice";
  const lines=q.type==="next"?d.lines.slice(0,q.lineIndex):d.lines;
  const conversation=lines.map((line,i)=>`<div class="bubble-row ${line[0].toLowerCase()}"><div class="bubble"><div class="speaker-label">${line[0]}</div><div>${esc(q.type!=="next"&&i===q.lineIndex&&!response?dialogueQuizBlankText(line[1],q.ranges):line[1])}</div></div></div>`).join("");
  const title={blank:"穴埋め4択",next:"次のセリフ4択",fill:"穴埋め入力"}[q.type];
  app.innerHTML=`<header class="quiz-play-header"><h1 class="quiz-question-count">Question ${s.index+1} / ${s.questions.length}</h1><p>${esc(d.title)} · ${title}${s.review?' · Review mistakes':''}</p>${practice?`<button class="translation-toggle ${s.settings.japanese?'selected':''}" aria-pressed="${s.settings.japanese}" onclick="toggleDialogueQuizJapanese()">日本語訳 ${s.settings.japanese?'表示':'非表示'}</button>`:''}</header><div class="quiz-progress"><span style="width:${Math.round(s.responses.length/s.questions.length*100)}%"></span></div><section class="card dialogue-quiz-card"><div class="conversation">${conversation}</div>${practice&&s.settings.japanese?`<section class="dialogue-quiz-translations"><h2 class="section-title">日本語訳</h2>${d.lines.map(line=>`<p>${esc(line[0])}: ${esc(line[2])}</p>`).join("")}</section>`:''}<p class="muted">${q.type==='next'?'次に来るセリフを選んでください。':'空欄に入る表現を答えてください。'}${q.ranges.length>1&&q.type!=='next'?' 複数の空欄は … で区切れます。':''}</p><div class="answer-list">${q.type==='fill'?`<input id="dialogueQuizInput" class="blank-input" autocomplete="off" aria-label="Dialogue answer" ${response?'disabled':''} value="${esc(response?.answer||'')}">${response?'':`<button class="primary-button" onclick="answerDialogueQuiz(document.getElementById('dialogueQuizInput').value)">Check Answer</button>`}`:q.choices.map((choice,i)=>`<button class="answer-button ${response?(choice===q.answer?'correct':response.answer===choice?'incorrect':''):''}" ${response?'disabled':''} onclick="answerDialogueQuizChoice(${i})">${esc(choice)}</button>`).join("")}</div>${response?`<div class="feedback ${response.correct?'good':'bad'}"><strong>${response.correct?'Correct':'Incorrect'}</strong><p>Correct: ${esc(q.answer)}</p></div><button class="primary-button" onclick="nextDialogueQuizQuestion()">${s.index===s.questions.length-1?'See Results':'Next Question'}</button>`:''}</section>`;
}
function answerDialogueQuizChoice(index){const s=getDialogueQuizSession(),q=s?.questions[s.index];if(q&&Number.isInteger(index)&&index>=0&&index<q.choices.length)answerDialogueQuiz(q.choices[index])}
function answerDialogueQuiz(answer){const s=getDialogueQuizSession();if(!s||s.responses.some(r=>r.index===s.index))return;const q=s.questions[s.index],correct=q.type==="fill"?dialogueQuizInputMatches(answer,q.answer):answer===q.answer;s.responses.push({index:s.index,answer:String(answer),correct});if(!correct&&!s.review)setDialogueWeak(s.dialogueId,true);writeJSON(STORE.dialogueQuiz,s);playQuizSound(correct);renderDialogueQuizPlay()}
function nextDialogueQuizQuestion(){const s=getDialogueQuizSession();if(!s||!s.responses.some(r=>r.index===s.index))return;if(s.index===s.questions.length-1)return completeDialogueQuiz(s);s.index++;writeJSON(STORE.dialogueQuiz,s);renderDialogueQuizPlay();window.scrollTo({top:0,behavior:"instant"})}
function completeDialogueQuiz(s){
  if(s.responses.length!==s.questions.length)return;
  const score=s.responses.filter(r=>r.correct).length,total=s.questions.length;
  if(!s.review)setDialogueWeak(s.dialogueId,score!==total);
  if(!s.review&&s.settings.mode==="test"){const state=dialogueLearnedState();state.quizHistory=[...dialogueQuizHistory(),{dialogueId:s.dialogueId,score,total,date:localDate(),completedAt:new Date().toISOString()}].slice(-100);writeJSON(STORE.dialogueLearned,state)}
  const result={...s,score,total};safeRemoveItem(STORE.dialogueQuiz);navigate("quizResult",{quizKind:"dialogue",result});playQuizCompleteSound(new Date().toISOString(),score===total);
}
function reviewDialogueQuizMistakes(){const r=route.params.result;if(!r)return;const wrong=r.responses.filter(response=>!response.correct).map(response=>response.index);startDialogueQuiz(r.dialogueId,r.settings,r.questions.filter((q,i)=>wrong.includes(i)))}
function nextQuizDialogue(){const r=route.params.result;if(!r)return;const pool=dialogueQuizPool(r.settings),current=pool.findIndex(d=>d.id===r.dialogueId),next=pool[(current+1)%pool.length];if(next)startDialogueQuiz(next.id,r.settings)}
function doneDialogueQuiz(){filters.quizTab="dialogues";saveAppState();navigate("quiz")}
function renderDialogueQuizResult(){
  const r=route.params.result,d=r&&DIALOGUES.find(d=>d.id===r.dialogueId);if(!d)return doneDialogueQuiz();
  const wrong=new Set(r.responses.filter(response=>!response.correct).map(response=>r.questions[response.index].phraseId)),answered=new Set(r.questions.map(q=>q.phraseId));
  app.innerHTML=`<section class="card quiz-result-card"><div class="result-score">${r.score} / ${r.total}</div><p>Mistakes: ${wrong.size}${r.review?' · Review mistakes':''}</p>${dialogueCard(d)}<div class="quiz-result-actions section">${wrong.size?'<button class="primary-button" onclick="reviewDialogueQuizMistakes()">Review mistakes</button>':''}<button class="primary-button" ${dialogueQuizPool(r.settings).length?'onclick="nextQuizDialogue()"':'disabled'}>Next Dialogue</button><button class="secondary-button" onclick="doneDialogueQuiz()">Done</button></div><h2 class="section-title">学習Phrase</h2><div class="mistake-list">${d.phraseLinks.map(id=>{const p=PHRASES.find(p=>p.id===id);return p?`<button class="learning-item mistake-item" onclick="openPhrase('${id}')"><strong>${esc(p.phrase)}</strong><span>${esc(p.meaning)}</span><span class="${wrong.has(id)?'incorrect':'muted'}">${wrong.has(id)?'Incorrect':answered.has(id)?'Correct':'未出題'}</span></button>`:''}).join("")}</div></section>`;
}

// Integrate only at the view boundary; existing Phrase Quiz functions stay intact.
const phraseQuizHomeView=renderQuizHome,phraseQuizPlayView=renderQuizPlay,phraseQuizResultView=renderQuizResult,phraseQuickChallenge=startQuickChallenge,phraseBackupState=safeBackupState;
renderQuizHome=function(){if(filters.quizTab==="dialogues")return renderDialogueQuizHome();phraseQuizHomeView();app.querySelector(".list-page-header")?.insertAdjacentHTML("afterend",quizKindTabsMarkup())};
renderQuizPlay=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizPlay():phraseQuizPlayView()};
renderQuizResult=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizResult():phraseQuizResultView()};
startQuickChallenge=function(){filters.quizTab="phrases";saveAppState();return phraseQuickChallenge()};
safeBackupState=function(value,warnings){const safe=phraseBackupState(value,warnings);if(safe){safe.filters.quizTab=value.filters.quizTab==="dialogues"?"dialogues":"phrases";safe.filters.dialogueQuiz=dialogueQuizSettings(value.filters.dialogueQuiz)}return safe};
