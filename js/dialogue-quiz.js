"use strict";

// Dialogue rounds are independent of Phrase Quiz sessions, scores and promotion.
STORE.dialogueQuiz="sitcomEnglish_dialogueQuizInProgress";
const DIALOGUE_QUIZ_TYPES=["blank","line","fill"];
const dialogueQuizEntryCache=new Map();
function dialogueQuizSettings(value=filters.dialogueQuiz){
  const v=value&&typeof value==="object"?value:{};
  return{mode:v.mode==="practice"?"practice":"test",type:v.type==="next"?"line":DIALOGUE_QUIZ_TYPES.includes(v.type)?v.type:"blank",season:v.season==="ALL"||SEASONS.includes(Number(v.season))?v.season:"ALL",scope:["all","weak","unlearned","learned","saved"].includes(v.scope)?v.scope:"all",japanese:Boolean(v.japanese)};
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
function dialogueQuizChoices(answer,index=0,length=answer.length){
  const target=answer.slice(index,index+length),candidates=[];
  const add=value=>{const option=answer.slice(0,index)+value+answer.slice(index+length);if(value&&dialogueQuizChoiceKey(option)!==dialogueQuizChoiceKey(answer)&&!candidates.some(x=>dialogueQuizChoiceKey(x)===dialogueQuizChoiceKey(option))&&!/\b([a-z]+)\s+\1\b/i.test(option))candidates.push(option)};
  // Change one grammatical component inside the target, never invent a synonym.
  const prepositions={with:"on",on:"at",at:"to",to:"for",for:"of",of:"with",in:"on",into:"at",from:"for",out:"in",over:"under",under:"over",off:"on",about:"at"};
  target.replace(/\b(with|on|at|to|for|of|in|into|from|out|over|under|off|about)\b/gi,(word,_,offset)=>{add(target.slice(0,offset)+prepositions[word.toLowerCase()]+target.slice(offset+word.length));return word});
  target.replace(/\b(a|an|the)\b/gi,(word,_,offset)=>{add(target.slice(0,offset)+(word.toLowerCase()==="a"?"an":"a")+target.slice(offset+word.length));return word});
  const words=[...target.matchAll(/\b[A-Za-z]+(?:[-'’][A-Za-z]+)*\b/g)];
  if(words.length>1){const a=words[0],b=words[1];add(target.slice(0,a.index)+b[0]+target.slice(a.index+a[0].length,b.index)+a[0]+target.slice(b.index+b[0].length))}
  // Inflect known verbs only; do not fabricate forms of nouns, adjectives or hyphenated chunks.
  const forms={go:'going',get:'getting',take:'taking',make:'making',made:'make',have:'having',has:'have',had:'have',put:'putting',give:'giving',gave:'give',keep:'keeping',kept:'keep',do:'doing',did:'do',come:'coming',came:'come',see:'seeing',saw:'see',be:'being',is:'be',are:'be',was:'be',were:'be',feel:'feeling',felt:'feel',know:'knowing',knew:'know',say:'saying',said:'say',roll:'rolling',call:'calling',work:'working',turn:'turning',hold:'holding',held:'hold',run:'running',ran:'run',leave:'leaving',left:'leave',pick:'picking',look:'looking',stand:'standing',stood:'stand',break:'breaking',broke:'break',snap:'snapping',snappped:'snap',got:'get',went:'go'};
  const verb=words.find(w=>Object.hasOwn(forms,w[0].toLowerCase()));if(verb)add(target.slice(0,verb.index)+forms[verb[0].toLowerCase()]+target.slice(verb.index+verb[0].length));
  if(/^a(?:n)?\s/i.test(target)&&words.length>1){const noun=words.at(-1);if(!noun[0].includes('-')&&!noun[0].endsWith('s'))add(target.slice(0,noun.index)+noun[0]+'s'+target.slice(noun.index+noun[0].length))}
  const word=words[0];if(word)for(const prefix of ['to','does','can','will','must'])add(target.slice(0,word.index)+prefix+' '+target.slice(word.index));
  if(candidates.length<3)throw new Error('Insufficient distinct near-misses');
  return shuffle([answer,...candidates.slice(0,3)]);
}
function dialogueQuizChoiceKey(value){return normalizeDialogueQuizInput(value).toLowerCase()}
function dialogueQuizMergedRanges(entries){const merged=[];for(const r of entries.flatMap(e=>e.ranges).sort((a,b)=>a.index-b.index)){const last=merged.at(-1);if(last&&r.index<last.index+last.length)last.length=Math.max(last.index+last.length,r.index+r.length)-last.index;else merged.push({...r})}return merged}
function createDialogueQuizQuestions(d,settings,onlyPhraseIds=null){
  const entries=dialogueQuizEntries(d);if(entries.some(e=>!e))return[];
  const selected=entries.filter(e=>!onlyPhraseIds||onlyPhraseIds.includes(e.phraseId)),types=selected.map((_,i)=>settings.mode==="test"?DIALOGUE_QUIZ_TYPES[i%3]:settings.type),lineTargets=new Set(selected.filter((e,i)=>types[i]==="line").map(e=>e.lineIndex)),used=new Set();
  const consumed=new Set();return selected.flatMap((e,i)=>{if(consumed.has(e.phraseId))return[];const line=lineTargets.has(e.lineIndex);if(line&&used.has(e.lineIndex))return[];if(line)used.add(e.lineIndex);let group=line?selected.filter(x=>x.lineIndex===e.lineIndex):[e];if(!line){let added=true;while(added){added=false;for(const peer of selected.filter(x=>x.lineIndex===e.lineIndex&&!consumed.has(x.phraseId)&&!group.includes(x)))if(group.some(x=>x.ranges.some(a=>peer.ranges.some(b=>a.index<b.index+b.length&&b.index<a.index+a.length)))){group.push(peer);added=true}}}const type=line?'line':types[i],phraseIds=group.map(x=>x.phraseId),ranges=line?e.ranges:dialogueQuizMergedRanges(group),answer=line?d.lines[e.lineIndex][1]:ranges.map(r=>d.lines[e.lineIndex][1].slice(r.index,r.index+r.length)).join(' … ');phraseIds.forEach(id=>consumed.add(id));return[{...e,ranges,phraseIds,type,answer,choices:type==='fill'?[]:dialogueQuizChoices(answer,line?ranges[0].index:0,line?ranges[0].length:answer.length)}]});
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
  if(!d||![1,2].includes(s.version)||!Array.isArray(s.questions)||!s.questions.length||!Number.isInteger(s.index)||s.index<0||s.index>=s.questions.length||!Array.isArray(s.responses)||typeof s.review!=="boolean")return null;
  if(s.version===1){const questions=createDialogueQuizQuestions(d,dialogueQuizSettings(s.settings),s.questions.map(q=>q.phraseId));const responses=questions.flatMap((q,index)=>{const old=s.questions.flatMap((old,i)=>q.phraseIds.includes(old.phraseId)?[s.responses.find(r=>r.index===i)]:[]);return old.length&&old.every(Boolean)?[{index,answer:q.answer,correct:old.every(r=>r.correct)}]:[]});const migrated={...s,version:2,settings:dialogueQuizSettings(s.settings),questions,responses,index:questions.findIndex((q,i)=>!responses.some(r=>r.index===i))};if(migrated.index<0)migrated.index=questions.length-1;writeJSON(STORE.dialogueQuiz,migrated);return getDialogueQuizSession()}
  const settings=dialogueQuizSettings(s.settings),entries=dialogueQuizEntries(d),ids=new Set();
  if(!s.questions.every(q=>{const entry=entries.find(e=>e?.phraseId===q?.phraseId);if(!entry||!Array.isArray(q.phraseIds)||!q.phraseIds.includes(q.phraseId))return false;const ranges=q.type==='line'?entry.ranges:dialogueQuizMergedRanges(entries.filter(e=>q.phraseIds.includes(e?.phraseId)));return q.phraseIds.length&&q.phraseIds.every(id=>!ids.has(id)&&ids.add(id)&&entries.some(e=>e?.phraseId===id&&e.lineIndex===q.lineIndex))&&DIALOGUE_QUIZ_TYPES.includes(q.type)&&q.lineIndex===entry.lineIndex&&JSON.stringify(q.ranges)===JSON.stringify(ranges)&&q.answer===(q.type==="line"?d.lines[q.lineIndex][1]:ranges.map(r=>d.lines[q.lineIndex][1].slice(r.index,r.index+r.length)).join(' … '))&&(q.type==="fill"||Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices.map(dialogueQuizChoiceKey)).size===4&&q.choices.includes(q.answer))}))return null;
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
  app.innerHTML=`${listPageHeader("Quiz")}${quizKindTabsMarkup()}<div class="segmented quiz-mode-tabs" role="tablist" aria-label="Dialogue quiz mode"><button class="seg-button ${settings.mode==='test'?'selected':''}" role="tab" aria-selected="${settings.mode==='test'}" onclick="setDialogueQuizOption('mode','test')">本番</button><button class="seg-button ${settings.mode==='practice'?'selected':''}" role="tab" aria-selected="${settings.mode==='practice'}" onclick="setDialogueQuizOption('mode','practice')">練習</button></div><div class="quiz-start-area">${session?`<span>${esc(DIALOGUES.find(d=>d.id===session.dialogueId).title)} · ${session.responses.length}/${session.questions.length}</span><div class="button-row"><button class="primary-button" onclick="navigate('quizPlay',{quizKind:'dialogue'})">Resume Quiz</button><button class="secondary-button" onclick="confirmDialogueQuizRestart()">Start Over</button></div>`:`<button class="primary-button" ${pool.length?'onclick="startDialogueQuiz()"':'disabled'}>${settings.mode==='practice'?'Start Practice':'Start Quiz'}</button>`}</div><section class="card filter-panel quiz-settings-panel">${settings.mode==='practice'?`<div class="filter-group"><div class="filter-label">問題形式</div><div class="chips">${buttons('type',[["blank","穴埋め4択"],["line","セリフ4択"],["fill","穴埋め入力"]])}</div></div>`:''}<div class="filter-group"><div class="filter-label">絞り込み</div><div class="chips">${buttons('scope',[["all","全て"],["weak","苦手"],["unlearned","未習得"],["learned","習得済み"],["saved","保存"]])}</div></div><div class="filter-group"><div class="filter-label">シーズン</div><div class="chips">${buttons('season',[["ALL","全て"],...SEASONS.map(s=>[s,`S${s}`])])}</div></div><p class="page-subtitle">${pool.length} dialogues available · 1 Round = 1 Dialogue</p><p id="dialogueQuizStatus" role="status"></p></section><section class="card quiz-stats-card"><h2 class="section-title">Your Dialogue Quiz</h2><div class="stats-row"><div class="stat-box"><span>Last</span><strong>${summary.last?`${summary.last.score}/${summary.last.total}`:'—'}</strong></div><div class="stat-box"><span>Today</span><strong>${summary.today} Dialogues</strong></div><div class="stat-box"><span>Perfect</span><strong>${summary.perfect}</strong></div></div><p class="muted">本番の通常Roundのみ集計</p></section>`;
}
function confirmDialogueQuizRestart(){showConfirm("Start the dialogue quiz over?",()=>{safeRemoveItem(STORE.dialogueQuiz);startDialogueQuiz()})}
function startDialogueQuiz(id=null,settings=dialogueQuizSettings(),reviewQuestions=null){
  settings=dialogueQuizSettings(settings);
  const pool=dialogueQuizPool(settings),d=id?DIALOGUES.find(d=>d.id===id):sampleValues(pool,1)[0];if(!d)return;
  const questions=reviewQuestions||createDialogueQuizQuestions(d,settings);
  if(!questions.length){const status=document.getElementById("dialogueQuizStatus");if(status)status.textContent="この形式で出題できる学習Phraseがありません。別の形式またはDialogueを選んでください。";return}
  filters.quizTab="dialogues";filters.dialogueQuiz={...settings};saveAppState();
  writeJSON(STORE.dialogueQuiz,{version:2,dialogueId:d.id,settings,review:Boolean(reviewQuestions),questions,index:0,responses:[]});navigate("quizPlay",{quizKind:"dialogue"});playQuizStartSound();
}
function toggleDialogueQuizJapanese(){const session=getDialogueQuizSession();if(!session||session.settings.mode!=="practice")return;session.settings.japanese=!session.settings.japanese;filters.dialogueQuiz={...dialogueQuizSettings(),japanese:session.settings.japanese};saveAppState();writeJSON(STORE.dialogueQuiz,session);renderDialogueQuizPlay()}
function renderDialogueQuizPlay(){
  const s=getDialogueQuizSession();if(!s){route={name:"quiz",params:{}};filters.quizTab="dialogues";render();return}
  if(!document.getElementById('dialogueQuizPage')){
    const d=DIALOGUES.find(d=>d.id===s.dialogueId);
    app.innerHTML=`<section id="dialogueQuizPage" data-dialogue-id="${esc(d.id)}"><header class="quiz-play-header"><h1 id="dialogueQuizCount" class="quiz-question-count"></h1><p id="dialogueQuizTitle"></p>${s.settings.mode==='practice'?'<button id="dialogueQuizJapanese" class="translation-toggle" onclick="toggleDialogueQuizJapanese()"></button>':''}</header><div class="quiz-progress"><span id="dialogueQuizProgress"></span></div><section class="card dialogue-quiz-card"><div class="conversation">${d.lines.map((line,i)=>`<div id="dialogueQuizLine${i}" class="bubble-row ${line[0].toLowerCase()}"><div class="bubble"><div class="speaker-label">${esc(line[0])}</div><div id="dialogueQuizEnglish${i}"></div><div class="jp" id="dialogueQuizJP${i}" hidden>${esc(line[2])}</div><div id="dialogueQuizControls${i}"></div></div></div>`).join('')}</div></section></section>`;
  }
  updateDialogueQuizPage(s);
}
function dialogueQuizLineMarkup(d,s,lineIndex){
  const text=d.lines[lineIndex][1],answered=new Set(s.responses.map(r=>r.index)),pending=s.questions.flatMap((q,index)=>answered.has(index)?[]:[{...q,index}]),lineTarget=pending.find(q=>q.type==='line'&&q.lineIndex===lineIndex);
  if(lineTarget)return `<span class="dialogue-quiz-hidden ${lineTarget.index===s.index?'active-target':''}">██████████</span>`;
  const linked=pending.flatMap(q=>q.phraseIds),matches=dialoguePhraseMatchResults(d,linked.map(id=>PHRASES.find(p=>p.id===id)).filter(Boolean));
  const ranges=linked.flatMap(id=>selectedDialogueMatches(matches.filter(m=>m.lineIndex===lineIndex&&m.phraseId===id))).map(m=>({...m,active:s.questions[s.index].phraseIds.includes(m.phraseId)&&s.questions[s.index].lineIndex===lineIndex})).sort((a,b)=>a.index-b.index),merged=[];
  for(const r of ranges){const last=merged.at(-1);if(last&&r.index<=last.index+last.length){last.length=Math.max(last.index+last.length,r.index+r.length)-last.index;last.active||=r.active}else merged.push({...r})}
  let result='',cursor=0;for(const r of merged){result+=esc(text.slice(cursor,r.index))+`<span class="dialogue-blank ${r.active?'active-target':''}">_____</span>`;cursor=r.index+r.length}return result+esc(text.slice(cursor));
}
function updateDialogueQuizPage(s){
  const d=DIALOGUES.find(d=>d.id===s.dialogueId),q=s.questions[s.index],response=s.responses.find(r=>r.index===s.index),title={blank:'穴埋め4択',line:'セリフ4択',fill:'穴埋め入力'}[q.type];
  document.getElementById('dialogueQuizCount').textContent=`Question ${s.index+1} / ${s.questions.length}`;
  document.getElementById('dialogueQuizTitle').textContent=`${d.title} · ${title}${s.review?' · Review mistakes':''}`;
  document.getElementById('dialogueQuizProgress').style.width=`${Math.round(s.responses.length/s.questions.length*100)}%`;
  const jp=document.getElementById('dialogueQuizJapanese');if(jp){jp.textContent=`日本語訳 ${s.settings.japanese?'表示':'非表示'}`;jp.setAttribute('aria-pressed',String(s.settings.japanese))}
  for(let i=0;i<d.lines.length;i++){
    const english=document.getElementById(`dialogueQuizEnglish${i}`),markup=dialogueQuizLineMarkup(d,s,i);if(english.innerHTML!==markup)english.innerHTML=markup;
    document.getElementById(`dialogueQuizJP${i}`).hidden=!(s.settings.mode==='practice'&&s.settings.japanese);
    const row=document.getElementById(`dialogueQuizLine${i}`);row.classList.toggle('quiz-active-line',i===q.lineIndex);
    const controls=document.getElementById(`dialogueQuizControls${i}`);if(i!==q.lineIndex){const completed=s.responses.filter(r=>s.questions[r.index].lineIndex===i);controls.innerHTML=completed.map(r=>`<span class="muted">${r.correct?'Correct':'Incorrect'}</span>`).join(' · ');continue}
    const draft=controls.dataset.question===String(s.index)?document.getElementById('dialogueQuizInput')?.value||'':'';controls.dataset.question=String(s.index);
    controls.innerHTML=`<div class="dialogue-quiz-controls"><p class="muted">${q.type==='line'?'隠れているセリフを選んでください。':'空欄に入る表現を答えてください。'}${q.ranges.length>1&&q.type!=='line'?' 複数の空欄は … で区切れます。':''}</p><div class="answer-list">${q.type==='fill'?`<input id="dialogueQuizInput" class="blank-input" autocomplete="off" aria-label="Dialogue answer" ${response?'disabled':''} value="${esc(response?.answer||draft)}">${response?'':`<button class="primary-button" onclick="answerDialogueQuiz(document.getElementById('dialogueQuizInput').value)">Check Answer</button>`}`:q.choices.map((choice,i)=>`<button class="answer-button ${response?(choice===q.answer?'correct':response.answer===choice?'incorrect':''):''}" ${response?'disabled':''} onclick="answerDialogueQuizChoice(${i})">${esc(choice)}</button>`).join('')}</div>${response?`<div class="feedback ${response.correct?'good':'bad'}" role="status"><strong>${response.correct?'Correct':'Incorrect'}</strong><p>Correct: ${esc(q.answer)}</p></div><button class="primary-button" onclick="nextDialogueQuizQuestion()">${s.index===s.questions.length-1?'See Results':'Next Question'}</button>`:''}</div>`;
  }
}
function scrollDialogueQuizTarget(s){const target=document.getElementById(`dialogueQuizLine${s.questions[s.index].lineIndex}`);if(!target)return;const rect=target.getBoundingClientRect();if(rect.top<70||rect.top>window.innerHeight-160)target.scrollIntoView({behavior:'smooth',block:'start'})}
function answerDialogueQuizChoice(index){const s=getDialogueQuizSession(),q=s?.questions[s.index];if(q&&Number.isInteger(index)&&index>=0&&index<q.choices.length)answerDialogueQuiz(q.choices[index])}
function answerDialogueQuiz(answer){const s=getDialogueQuizSession();if(!s||s.responses.some(r=>r.index===s.index))return;const q=s.questions[s.index],correct=q.type==="fill"?dialogueQuizInputMatches(answer,q.answer):answer===q.answer;s.responses.push({index:s.index,answer:String(answer),correct});if(!correct&&!s.review)setDialogueWeak(s.dialogueId,true);writeJSON(STORE.dialogueQuiz,s);playQuizSound(correct);renderDialogueQuizPlay();if(s.index<s.questions.length-1&&typeof window.setTimeout==='function')window.setTimeout(()=>{const current=getDialogueQuizSession();if(route.name==='quizPlay'&&route.params.quizKind==='dialogue'&&current?.dialogueId===s.dialogueId&&current.index===s.index&&current.responses.length===s.responses.length)nextDialogueQuizQuestion()},650)}
function nextDialogueQuizQuestion(){const s=getDialogueQuizSession();if(!s||!s.responses.some(r=>r.index===s.index))return;if(s.index===s.questions.length-1)return completeDialogueQuiz(s);s.index++;writeJSON(STORE.dialogueQuiz,s);renderDialogueQuizPlay();scrollDialogueQuizTarget(s)}
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
  const wrong=new Set(r.responses.filter(response=>!response.correct).flatMap(response=>r.questions[response.index].phraseIds)),answered=new Set(r.questions.flatMap(q=>q.phraseIds));
  app.innerHTML=`<section class="card quiz-result-card"><div class="result-score">${r.score} / ${r.total}</div><p>Mistakes: ${r.responses.filter(response=>!response.correct).length}${r.review?' · Review mistakes':''}</p>${dialogueCard(d)}<div class="quiz-result-actions section">${wrong.size?'<button class="primary-button" onclick="reviewDialogueQuizMistakes()">Review mistakes</button>':''}<button class="primary-button" ${dialogueQuizPool(r.settings).length?'onclick="nextQuizDialogue()"':'disabled'}>Next Dialogue</button><button class="secondary-button" onclick="doneDialogueQuiz()">Done</button></div><h2 class="section-title">学習Phrase</h2><div class="mistake-list">${d.phraseLinks.map(id=>{const p=PHRASES.find(p=>p.id===id);return p?`<button class="learning-item mistake-item" onclick="openPhrase('${id}')"><strong>${esc(p.phrase)}</strong><span>${esc(p.meaning)}</span><span class="${wrong.has(id)?'incorrect':'muted'}">${wrong.has(id)?'Incorrect':answered.has(id)?'Correct':'未出題'}</span></button>`:''}).join("")}</div></section>`;
}

// Integrate only at the view boundary; existing Phrase Quiz functions stay intact.
const phraseQuizHomeView=renderQuizHome,phraseQuizPlayView=renderQuizPlay,phraseQuizResultView=renderQuizResult,phraseQuickChallenge=startQuickChallenge,phraseBackupState=safeBackupState;
renderQuizHome=function(){if(filters.quizTab==="dialogues")return renderDialogueQuizHome();phraseQuizHomeView();app.querySelector(".list-page-header")?.insertAdjacentHTML("afterend",quizKindTabsMarkup())};
renderQuizPlay=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizPlay():phraseQuizPlayView()};
renderQuizResult=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizResult():phraseQuizResultView()};
startQuickChallenge=function(){filters.quizTab="phrases";saveAppState();return phraseQuickChallenge()};
safeBackupState=function(value,warnings){const safe=phraseBackupState(value,warnings);if(safe){safe.filters.quizTab=value.filters.quizTab==="dialogues"?"dialogues":"phrases";safe.filters.dialogueQuiz=dialogueQuizSettings(value.filters.dialogueQuiz)}return safe};
