"use strict";

// Dialogue rounds are independent of Phrase Quiz sessions, scores and promotion.
STORE.dialogueQuiz="sitcomEnglish_dialogueQuizInProgress";
const DIALOGUE_QUIZ_TYPES=["blank","line","fill"];
const dialogueQuizEntryCache=new Map();
const DIALOGUE_DISTRACTORS_PATH="artifacts/dialogue-distractor-audit/dialogue-distractors-final.json";
let dialogueQuizDistractorIndex=null;
function setDialogueQuizDistractors(document){
  if(document?.status!=="final"||!Array.isArray(document.items)||document.items.length!==2652)throw new Error("Dialogue distractor master is incomplete");
  const phraseById=new Map(PHRASES.map(p=>[p.id,p])),index=new Map(),seen=new Set();let offset=0,eligible=0;
  for(const dialogue of DIALOGUES){
    const records=new Map();
    for(const phraseId of dialogue.phraseLinks){
      const item=document.items[offset++];
      if(!item||item.dqId!==`DQ-${String(offset).padStart(4,'0')}`||seen.has(item.dqId)||item.phraseId!==phraseId||item.phrase!==phraseById.get(phraseId)?.phrase||!dialogue.lines.some(line=>line[1]===item.dialogue)||typeof item.quizEligible!=="boolean"||(item.quizEligible&&(typeof item.correctSpan!=="string"||typeof item.slot!=="string"||item.correct!==item.correctSpan||!Array.isArray(item.distractors)||item.distractors.length!==3||new Set([item.correct,...item.distractors]).size!==4)))throw new Error(`Dialogue distractor mapping mismatch: ${item?.dqId||offset}`);
      seen.add(item.dqId);if(item.quizEligible)eligible++;
      records.set(phraseId,item);
    }
    index.set(dialogue.id,records);
  }
  if(offset!==document.items.length||eligible!==2649||seen.size!==2652||["DQ-0601","DQ-1383","DQ-1704"].some(id=>document.items.find(item=>item.dqId===id)?.quizEligible!==false))throw new Error("Dialogue distractor counts do not match the final master");
  dialogueQuizDistractorIndex=index;
}
async function loadDialogueQuizDistractors(){
  const response=await fetch(DIALOGUE_DISTRACTORS_PATH,{cache:"no-store"});
  if(!response.ok)throw new Error(`${DIALOGUE_DISTRACTORS_PATH}: ${response.status}`);
  setDialogueQuizDistractors(await response.json());
}
function dialogueQuizAuditItem(dialogue,phraseId){
  const item=dialogueQuizDistractorIndex?.get(dialogue.id)?.get(phraseId);
  if(!item&&DIALOGUES.includes(dialogue))throw new Error(`Missing final distractor: ${dialogue.id}/${phraseId}`);
  return item;
}
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
function dialogueQuizAuditText(value){return value.toLowerCase().replace(/[’‘]/g,"'")}
function dialogueQuizAuditPieces(text,pattern,anchor=0){
  const source=dialogueQuizAuditText(text),parts=pattern.split('…').map(part=>part.trim()).filter(Boolean),first=dialogueQuizAuditText(parts[0]);let best=null,bestDistance=Infinity;
  for(let start=source.indexOf(first);start>=0;start=source.indexOf(first,start+1)){
    const ranges=[{index:start,length:parts[0].length}];
    for(const part of parts.slice(1)){
      const index=source.indexOf(dialogueQuizAuditText(part),ranges.at(-1).index+ranges.at(-1).length);
      if(index<0)break;
      ranges.push({index,length:part.length});
    }
    if(ranges.length!==parts.length)continue;
    const end=ranges.at(-1).index+ranges.at(-1).length,distance=anchor<start?start-anchor:anchor>end?anchor-end:0;
    if(distance<bestDistance){best=ranges;bestDistance=distance}
  }
  if(!best)throw new Error(`Final distractor span not found: ${pattern}`);
  return best;
}
function dialogueQuizAuditRanges(text,item,anchor){
  const span=dialogueQuizAuditPieces(text,item.correctSpan,anchor);
  const start=span[0].index,end=span.at(-1).index+span.at(-1).length;
  if(item.slot==='構文全体'||item.slot==='短いリアクション全体')return span;
  if(item.slot.includes('…')){
    const ranges=dialogueQuizAuditPieces(text,item.slot,start);
    if(ranges.at(-1).index+ranges.at(-1).length>end)throw new Error(`Final distractor slot outside span: ${item.dqId}`);
    return ranges;
  }
  const source=dialogueQuizAuditText(text),target=dialogueQuizAuditText(item.slot),ranges=[],count=item.slotOccurrences||1;
  let cursor=start;
  for(let i=0;i<count;i++){
    const index=source.indexOf(target,cursor);
    if(index<0||index+item.slot.length>end)throw new Error(`Final distractor slot not found: ${item.dqId}`);
    ranges.push({index,length:item.slot.length});cursor=index+item.slot.length;
  }
  return ranges;
}
function dialogueQuizSlotChoices(item){
  if(item.slot==='構文全体'||item.slot==='短いリアクション全体')return[item.correct,...item.distractors];
  const source=dialogueQuizAuditText(item.correctSpan),slot=dialogueQuizAuditText(item.slot);
  if(item.slot.includes('…')&&slot!==source){
    const parts=slot.split('…').map(part=>part.trim()),middle=source.slice(source.indexOf(parts[0])+parts[0].length,source.lastIndexOf(parts.at(-1)));
    if(parts.length===2&&parts[0]&&parts[1]&&middle.trim()&&item.distractors.every(choice=>dialogueQuizAuditText(choice).includes(middle))){
      return[item.slot,...item.distractors.map(choice=>{const index=dialogueQuizAuditText(choice).indexOf(middle);return`${choice.slice(0,index).trim()} … ${choice.slice(index+middle.length).trim()}`})];
    }
    return[item.correct,...item.distractors];
  }
  const starts=[];for(let index=source.indexOf(slot);index>=0;index=source.indexOf(slot,index+1))starts.push(index);
  for(const index of starts){
    const before=source.slice(0,index),after=source.slice(index+slot.length);
    if(item.distractors.every(choice=>{const text=dialogueQuizAuditText(choice);return text.startsWith(before)&&text.endsWith(after)&&text.length>before.length+after.length})){
      return[item.slot,...item.distractors.map(choice=>choice.slice(before.length,choice.length-after.length))];
    }
  }
  const tokens=value=>[...value.matchAll(/\S+/g)],sourceWords=tokens(item.correctSpan),slotStart=starts[0];
  const position=sourceWords.findIndex(word=>slotStart>=word.index&&slotStart<word.index+word[0].length);
  if(position>=0&&item.distractors.every(choice=>tokens(choice).length===sourceWords.length)){
    return[item.slot,...item.distractors.map(choice=>tokens(choice)[position][0].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,''))];
  }
  const words=tokens(item.dialogue).map(word=>word[0].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'')),at=words.findIndex(word=>dialogueQuizAuditText(word)===slot);
  if(at>0&&at<words.length-1){
    const before=dialogueQuizAuditText(words[at-1]),after=dialogueQuizAuditText(words[at+1]);
    const projected=item.distractors.map(choice=>{const parts=tokens(choice).map(word=>word[0].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,''));const index=parts.findIndex((word,i)=>dialogueQuizAuditText(word)===before&&i+2<parts.length&&dialogueQuizAuditText(parts[i+2])===after);return index<0?null:parts[index+1]});
    if(projected.every(Boolean))return[item.slot,...projected];
  }
  return[item.slot,...item.distractors];
}
function createDialogueQuizQuestions(d,settings,onlyPhraseIds=null){
  const entries=dialogueQuizEntries(d);if(entries.some(e=>!e))return[];
  const candidates=entries.filter(e=>!onlyPhraseIds||onlyPhraseIds.includes(e.phraseId)),typed=candidates.map((e,i)=>({entry:e,type:settings.mode==="test"?DIALOGUE_QUIZ_TYPES[i%3]:settings.type})).filter(({entry,type})=>type!=="blank"||dialogueQuizAuditItem(d,entry.phraseId)?.quizEligible!==false),selected=typed.map(x=>x.entry),types=typed.map(x=>x.type),lineTargets=new Set(selected.filter((e,i)=>types[i]==="line").map(e=>e.lineIndex)),used=new Set();
  const consumed=new Set();return selected.flatMap((e,i)=>{if(consumed.has(e.phraseId))return[];const line=lineTargets.has(e.lineIndex);if(line&&used.has(e.lineIndex))return[];if(line)used.add(e.lineIndex);let group=line?selected.filter(x=>x.lineIndex===e.lineIndex):[e];if(!line){let added=true;while(added){added=false;for(const peer of selected.filter(x=>x.lineIndex===e.lineIndex&&!consumed.has(x.phraseId)&&!group.includes(x)))if(group.some(x=>x.ranges.some(a=>peer.ranges.some(b=>a.index<b.index+b.length&&b.index<a.index+a.length)))){group.push(peer);added=true}}}const type=line?'line':types[i],audit=type==='blank'?dialogueQuizAuditItem(d,e.phraseId):null;if(audit&&!audit.quizEligible)return[];const phraseIds=group.map(x=>x.phraseId),ranges=audit?dialogueQuizAuditRanges(d.lines[e.lineIndex][1],audit,e.ranges[0].index):line?e.ranges:dialogueQuizMergedRanges(group),slotChoices=audit?dialogueQuizSlotChoices(audit):null,answer=audit?slotChoices[0]:line?d.lines[e.lineIndex][1]:ranges.map(r=>d.lines[e.lineIndex][1].slice(r.index,r.index+r.length)).join(' … ');phraseIds.forEach(id=>consumed.add(id));return[{...e,ranges,phraseIds,type,answer,choices:audit?shuffle(slotChoices):type==='fill'?[]:dialogueQuizChoices(answer,line?ranges[0].index:0,line?ranges[0].length:answer.length)}]});
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
  if(!d||![1,2,3].includes(s.version)||!Array.isArray(s.questions)||!s.questions.length||!Array.isArray(s.responses)||typeof s.review!=="boolean")return null;
  if(s.version!==3){
    const questions=s.version===1?createDialogueQuizQuestions(d,dialogueQuizSettings(s.settings),s.questions.map(q=>q.phraseId)):s.questions;
    // Keep legacy answers as editable drafts; no old per-question grading carries into the new round.
    const drafts=questions.map(q=>{
      const previous=s.questions.map((old,index)=>({old,response:s.responses.find(r=>r.index===index)})).filter(x=>q.phraseIds.includes(x.old.phraseId)&&x.response);
      if(previous.length===1&&previous[0].old.answer===q.answer)return String(previous[0].response.answer);
      return previous.length===q.phraseIds.length&&previous.every(x=>x.response.correct)?q.answer:"";
    }).map((answer,index)=>questions[index].type==='fill'||questions[index].choices.includes(answer)?answer:"");
    writeJSON(STORE.dialogueQuiz,{version:3,dialogueId:d.id,settings:dialogueQuizSettings(s.settings),review:s.review,questions,drafts,graded:false,responses:[]});
    return getDialogueQuizSession();
  }
  const settings=dialogueQuizSettings(s.settings),entries=dialogueQuizEntries(d),ids=new Set();
  if(!s.questions.every(q=>{const entry=entries.find(e=>e?.phraseId===q?.phraseId);if(!entry||!Array.isArray(q.phraseIds)||!q.phraseIds.includes(q.phraseId))return false;const audit=q.type==='blank'?dialogueQuizAuditItem(d,q.phraseId):null;if(audit&&!audit.quizEligible)return false;const ranges=audit?dialogueQuizAuditRanges(d.lines[entry.lineIndex][1],audit,entry.ranges[0].index):q.type==='line'?entry.ranges:dialogueQuizMergedRanges(entries.filter(e=>q.phraseIds.includes(e?.phraseId))),slotChoices=audit?dialogueQuizSlotChoices(audit):null;return q.phraseIds.length&&q.phraseIds.every(id=>!ids.has(id)&&ids.add(id)&&entries.some(e=>e?.phraseId===id&&e.lineIndex===q.lineIndex))&&DIALOGUE_QUIZ_TYPES.includes(q.type)&&q.lineIndex===entry.lineIndex&&JSON.stringify(q.ranges)===JSON.stringify(ranges)&&q.answer===(audit?slotChoices[0]:q.type==="line"?d.lines[q.lineIndex][1]:ranges.map(r=>d.lines[q.lineIndex][1].slice(r.index,r.index+r.length)).join(' … '))&&(q.type==="fill"||Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices.map(dialogueQuizChoiceKey)).size===4&&q.choices.includes(q.answer)&&(audit?slotChoices.every(choice=>q.choices.includes(choice)):true))}))return null;
  if(typeof s.graded!=="boolean"||!Array.isArray(s.drafts)||s.drafts.length!==s.questions.length||!s.drafts.every((answer,index)=>typeof answer==='string'&&(s.questions[index].type==='fill'||answer===''||s.questions[index].choices.includes(answer))))return null;
  if(!s.graded&&s.responses.length)return null;
  if(s.graded&&(!dialogueQuizCanSubmit(s)||s.responses.length!==s.questions.length||!s.responses.every((r,index)=>r?.index===index&&r.answer===s.drafts[index]&&r.correct===dialogueQuizAnswerCorrect(s.questions[index],r.answer))))return null;
  return{...s,settings};
}
function dialogueQuizAnswerCorrect(question,answer){return question.type==='fill'?dialogueQuizInputMatches(answer,question.answer):answer===question.answer}
function dialogueQuizAnsweredCount(s){return s.drafts.filter(answer=>answer.trim()).length}
function dialogueQuizAllAnswered(s){return dialogueQuizAnsweredCount(s)===s.questions.length}
function dialogueQuizCanSubmit(s){return s.questions.every((q,index)=>q.type==='fill'||Boolean(s.drafts[index].trim()))}
function dialogueQuizDisplayNumbers(s){const ordered=s.questions.map((q,index)=>({index,line:q.lineIndex,start:q.ranges[0].index})).sort((a,b)=>a.line-b.line||a.start-b.start);return new Map(ordered.map((q,index)=>[q.index,index+1]))}
function quizKindTabsMarkup(){const dialogue=filters.quizTab==="dialogues";return `<div class="segmented quiz-kind-tabs" role="tablist" aria-label="Quiz content"><button class="seg-button ${dialogue?'selected':''}" role="tab" aria-selected="${dialogue}" onclick="setQuizKind('dialogues')">Dialogues</button><button class="seg-button ${dialogue?'':'selected'}" role="tab" aria-selected="${!dialogue}" onclick="setQuizKind('phrases')">Phrases</button></div>`}
function setQuizKind(kind){filters.quizTab=kind==="dialogues"?"dialogues":"phrases";saveAppState();renderQuizHome()}
function setDialogueQuizOption(key,value){filters.dialogueQuiz={...dialogueQuizSettings(),[key]:value};saveAppState();renderDialogueQuizHome()}
function dialogueQuizHistory(){const history=dialogueLearnedState().quizHistory;return Array.isArray(history)?history.filter(r=>r&&DIALOGUES.some(d=>d.id===r.dialogueId)&&Number.isInteger(r.score)&&Number.isInteger(r.total)&&r.score>=0&&r.score<=r.total):[]}
function dialogueQuizSummary(){const history=dialogueQuizHistory(),today=history.filter(r=>r.date===localDate());return{last:history.at(-1)||null,today:today.length,perfect:today.filter(r=>r.score===r.total).length}}
function renderDialogueQuizHome(){
  const settings=dialogueQuizSettings(),practice=settings.mode==='practice',session=getDialogueQuizSession(),pool=dialogueQuizPool(settings),summary=dialogueQuizSummary();
  const buttons=(key,values)=>values.map(([value,label])=>`<button class="chip ${String(settings[key])===String(value)?'selected':''}" aria-pressed="${String(settings[key])===String(value)}" onclick="setDialogueQuizOption('${key}','${value}')">${label}</button>`).join("");
  const seasonGroup=`<div class="filter-group"><div class="filter-label">シーズン</div><div class="chips">${buttons('season',[["ALL","全て"],...SEASONS.map(s=>[s,`S${s}`])])}</div></div>`;
  const practiceGroups=practice?`<div class="filter-group"><div class="filter-label">問題形式</div><div class="chips quiz-setting-chips">${buttons('type',[["blank","穴埋め4択"],["line","セリフ4択"],["fill","穴埋め入力"]])}</div></div><div class="filter-group"><div class="filter-label">絞り込み</div><div class="chips scope-chips">${buttons('scope',[["all","全て"],["weak","苦手"],["unlearned","未習得"],["learned","習得済み"],["saved","保存"]])}</div></div>`:'';
  const startArea=session?`<div class="quiz-start-area"><div><strong>${session.review?'Quick Review':session.settings.mode==='practice'?'Practice':'Quiz'} in progress</strong><p class="page-subtitle">${dialogueQuizAnsweredCount(session)} / ${session.questions.length} answered</p></div><div class="button-row"><button class="primary-button" onclick="navigate('quizPlay',{quizKind:'dialogue'})">Resume Quiz</button><button class="secondary-button" onclick="confirmDialogueQuizRestart()">Start Over</button></div></div>`:`<div class="quiz-start-area"><button class="primary-button quiz-start-button dialogue-quiz-start-button" ${pool.length?'onclick="startDialogueQuiz()"':'disabled'}>${practice?'Start Practice':'Start Quiz'}</button></div>`;
  const stats=`<section class="card quiz-stats-card"><h2 class="section-title">Your Dialogue Quiz</h2><div class="stats-row"><div class="stat-box"><span>Last</span><strong>${summary.last?`${summary.last.score}/${summary.last.total}`:'—'}</strong></div><div class="stat-box"><span>Today</span><strong>${summary.today}</strong></div><div class="stat-box"><span>Perfect</span><strong>${summary.perfect}</strong></div></div></section>`;
  const note=practice?'<div class="quiz-mode-note"><strong>練習モード</strong><span>形式・日本語訳を選べます。本番のスコアには反映されません。</span></div>':'<div class="quiz-mode-note"><strong>本番モード</strong><span>3形式Mix・1 Round = 1 Dialogue。本番のスコアに反映されます。</span></div>';
  app.innerHTML=`${listPageHeader("Quiz")}${quizKindTabsMarkup()}<div class="segmented quiz-mode-tabs" role="tablist" aria-label="Dialogue quiz mode"><button class="seg-button ${!practice?'selected':''}" role="tab" aria-selected="${!practice}" onclick="setDialogueQuizOption('mode','test')">本番</button><button class="seg-button ${practice?'selected':''}" role="tab" aria-selected="${practice}" onclick="setDialogueQuizOption('mode','practice')">練習</button></div>${startArea}<section class="card filter-panel quiz-settings-panel ${practice?'quiz-practice-settings':''}">${practiceGroups}${seasonGroup}<div class="page-subtitle">${pool.length} dialogues available</div><p id="dialogueQuizStatus" role="status"></p></section>${practice?'':stats}${note}`;
}
function confirmDialogueQuizRestart(){showConfirm("Start the dialogue quiz over?",()=>{safeRemoveItem(STORE.dialogueQuiz);startDialogueQuiz()})}
function startDialogueQuiz(id=null,settings=dialogueQuizSettings(),reviewQuestions=null,parentResult=null){
  settings=dialogueQuizSettings(settings);
  const pool=dialogueQuizPool(settings),d=id?DIALOGUES.find(d=>d.id===id):sampleValues(pool,1)[0];if(!d)return;
  const questions=reviewQuestions||createDialogueQuizQuestions(d,settings);
  if(!questions.length){const status=document.getElementById("dialogueQuizStatus");if(status)status.textContent="この形式で出題できる学習Phraseがありません。別の形式またはDialogueを選んでください。";return}
  filters.quizTab="dialogues";filters.dialogueQuiz={...settings};saveAppState();
  writeJSON(STORE.dialogueQuiz,{version:3,dialogueId:d.id,settings,review:Boolean(reviewQuestions),questions,drafts:questions.map(()=>""),graded:false,responses:[],parentResult});navigate("quizPlay",{quizKind:"dialogue"});playQuizStartSound();
}
function toggleDialogueQuizJapanese(){const session=getDialogueQuizSession();if(!session||session.settings.mode!=="practice")return;session.settings.japanese=!session.settings.japanese;filters.dialogueQuiz={...dialogueQuizSettings(),japanese:session.settings.japanese};saveAppState();writeJSON(STORE.dialogueQuiz,session);renderDialogueQuizPlay()}
function renderDialogueQuizPlay(){
  const s=getDialogueQuizSession();if(!s){route={name:"quiz",params:{}};filters.quizTab="dialogues";render();return}
  if(s.graded&&!s.review)return completeDialogueQuiz();
  const page=document.getElementById('dialogueQuizPage');
  if(!page||page.dataset.dialogueId!==s.dialogueId){
    const d=DIALOGUES.find(d=>d.id===s.dialogueId);
    app.innerHTML=`<section id="dialogueQuizPage" data-dialogue-id="${esc(d.id)}"><header class="quiz-play-header"><p id="dialogueQuizTitle"></p>${s.settings.mode==='practice'?'<button id="dialogueQuizJapanese" class="translation-toggle" onclick="toggleDialogueQuizJapanese()"></button>':''}</header><div class="dialogue-quiz-progress"><h1 id="dialogueQuizCount" class="quiz-question-count"></h1><div class="quiz-progress"><span id="dialogueQuizProgress"></span></div></div><section class="card dialogue-quiz-card"><div class="conversation">${dialogueQuizVisibleLines(d,s).map(i=>{const line=d.lines[i];return `<div id="dialogueQuizLine${i}" class="bubble-row ${line[0].toLowerCase()}"><div class="bubble"><div class="speaker-label">${esc(line[0])}</div><div id="dialogueQuizEnglish${i}"></div><div class="translation translation-concealed" id="dialogueQuizJP${i}" aria-hidden="true">${esc(line[2])}</div><div id="dialogueQuizControls${i}"></div></div></div>`}).join('')}</div><div class="dialogue-quiz-submit"><p id="dialogueQuizScore" role="status"></p><button id="dialogueQuizCheck" class="primary-button" onclick="checkDialogueQuizAnswers()" disabled>See Results</button><button id="dialogueQuizBack" class="primary-button" onclick="backToDialogueQuizResults()" hidden>Back to Results</button><button id="dialogueQuizDone" class="secondary-button" onclick="doneDialogueQuickReview()" hidden>Done</button></div></section></section>`;
  }
  updateDialogueQuizPage(s);
}
function dialogueQuizLineMarkup(d,s,lineIndex){
  const text=d.lines[lineIndex][1],pending=s.graded?[]:s.questions.map((q,index)=>({...q,index})),lineTarget=pending.find(q=>q.type==='line'&&q.lineIndex===lineIndex);
  if(lineTarget)return `<div class="hidden-line"><span class="dialogue-line-text hidden-dialogue-text" aria-hidden="true">${esc(text)}</span></div>`;
  const ranges=pending.filter(q=>q.lineIndex===lineIndex).flatMap(q=>q.ranges.map(r=>({...r,question:q.index}))).sort((a,b)=>a.index-b.index),merged=[];
  for(const r of ranges){const last=merged.at(-1);if(last&&r.index<=last.index+last.length)last.length=Math.max(last.index+last.length,r.index+r.length)-last.index;else merged.push({...r})}
  const numbers=dialogueQuizDisplayNumbers(s);let result='',cursor=0;for(const r of merged){result+=esc(text.slice(cursor,r.index))+`<span class="dialogue-blank">_____<sup>${numbers.get(r.question)}</sup></span>`;cursor=r.index+r.length}return result+esc(text.slice(cursor));
}
function dialogueQuizVisibleLines(d,s){
  if(!s.review)return d.lines.map((_,i)=>i);
  return [...new Set(s.questions.flatMap(q=>[q.lineIndex-1,q.lineIndex]).filter(i=>i>=0))].sort((a,b)=>a-b);
}
function dialogueQuizQuestionMarkup(s,q,index){
  const response=s.review&&s.graded?s.responses[index]:null,draft=s.drafts[index];
  return `<div class="dialogue-quiz-controls" data-question-index="${index}"><div class="answer-list">${q.type==='fill'?`<input id="dialogueQuizInput${index}" class="blank-input" autocomplete="off" aria-label="Answer ${dialogueQuizDisplayNumbers(s).get(index)}" ${s.graded?'disabled':''} value="${esc(draft)}" oninput="saveDialogueQuizAnswer(${index},this.value)">`:q.choices.map((choice,i)=>`<button class="answer-button ${response?(choice===q.answer?'correct':draft===choice?'incorrect':''):draft===choice?'selected':''}" ${s.graded?'disabled':''} aria-pressed="${draft===choice}" onclick="answerDialogueQuizChoice(${index},${i})">${esc(choice)}</button>`).join('')}</div>${response?`<div class="feedback ${response.correct?'good':'bad'}" role="status"><span class="quiz-result-status ${response.correct?'correct':'incorrect'}">${response.correct?'Correct':'Incorrect'}</span>${response.correct?'':`<p>Your answer: ${esc(response.answer)}</p><p>Correct: ${esc(q.answer)}</p>`}</div>`:''}</div>`;
}
function updateDialogueQuizProgress(s){
  const count=dialogueQuizAnsweredCount(s);
  document.getElementById('dialogueQuizCount').textContent=`Answered ${count} / ${s.questions.length}`;
  document.getElementById('dialogueQuizProgress').style.width=`${Math.round(count/s.questions.length*100)}%`;
  document.getElementById('dialogueQuizCheck').disabled=s.graded||!dialogueQuizCanSubmit(s);
  document.getElementById('dialogueQuizCheck').hidden=s.graded;
  document.getElementById('dialogueQuizBack').hidden=!(s.review&&s.graded&&s.parentResult);
  document.getElementById('dialogueQuizDone').hidden=!(s.review&&s.graded);
  document.getElementById('dialogueQuizScore').textContent=s.graded?`${s.responses.filter(r=>r.correct).length} / ${s.questions.length}`:'';
}
function updateDialogueQuizPage(s){
  const d=DIALOGUES.find(d=>d.id===s.dialogueId);
  document.getElementById('dialogueQuizTitle').textContent=`${d.title}${s.review?' · Review mistakes':''}`;
  updateDialogueQuizProgress(s);
  const jp=document.getElementById('dialogueQuizJapanese');if(jp){const action=s.settings.japanese?'日本語訳を非表示':'日本語訳を表示';jp.innerHTML=`${lineIcon(s.settings.japanese?'eyeOff':'eye')}<span>${action}</span>`;jp.setAttribute('aria-label',action);jp.setAttribute('aria-pressed',String(s.settings.japanese))}
  for(const i of dialogueQuizVisibleLines(d,s)){
    const english=document.getElementById(`dialogueQuizEnglish${i}`),markup=dialogueQuizLineMarkup(d,s,i);if(english.innerHTML!==markup)english.innerHTML=markup;
    const translation=document.getElementById(`dialogueQuizJP${i}`),showJapanese=s.settings.mode==='practice'&&s.settings.japanese;
    translation.classList.toggle('translation-concealed',!showJapanese);translation.setAttribute('aria-hidden',String(!showJapanese));
    const numbers=dialogueQuizDisplayNumbers(s);
    document.getElementById(`dialogueQuizControls${i}`).innerHTML=s.questions.map((q,index)=>({q,index})).filter(({q})=>q.lineIndex===i).sort((a,b)=>numbers.get(a.index)-numbers.get(b.index)).map(({q,index})=>dialogueQuizQuestionMarkup(s,q,index)).join('');
  }
}
function saveDialogueQuizAnswer(index,answer){
  const s=getDialogueQuizSession(),q=s?.questions[index];
  if(!s||s.graded||!Number.isInteger(index)||!q||typeof answer!=='string'||(q.type!=='fill'&&!q.choices.includes(answer)))return;
  s.drafts[index]=answer;writeJSON(STORE.dialogueQuiz,s);
  // Typing updates only the summary/button: keep focus, caret, scroll and every input node.
  updateDialogueQuizProgress(s);
}
function answerDialogueQuizChoice(questionIndex,choiceIndex){
  const s=getDialogueQuizSession(),q=s?.questions[questionIndex];
  if(!s||s.graded||!Number.isInteger(questionIndex)||!Number.isInteger(choiceIndex)||!q||q.type==='fill'||choiceIndex<0||choiceIndex>=q.choices.length)return;
  saveDialogueQuizAnswer(questionIndex,q.choices[choiceIndex]);renderDialogueQuizPlay();
}
function checkDialogueQuizAnswers(){
  const s=getDialogueQuizSession();if(!s||s.graded||!dialogueQuizCanSubmit(s))return;
  s.responses=s.questions.map((q,index)=>({index,answer:s.drafts[index],correct:dialogueQuizAnswerCorrect(q,s.drafts[index])}));s.graded=true;
  const score=s.responses.filter(r=>r.correct).length,total=s.questions.length;
  writeJSON(STORE.dialogueQuiz,s);
  if(!s.review)setDialogueWeak(s.dialogueId,score!==total);
  if(!s.review&&s.settings.mode==='test'){const state=dialogueLearnedState();state.quizHistory=[...dialogueQuizHistory(),{dialogueId:s.dialogueId,score,total,date:localDate(),completedAt:new Date().toISOString()}].slice(-100);writeJSON(STORE.dialogueLearned,state)}
  if(s.review)renderDialogueQuizPlay();else completeDialogueQuiz();playQuizCompleteSound(new Date().toISOString(),score===total);
}
function completeDialogueQuiz(){
  const s=getDialogueQuizSession();if(!s?.graded||s.review)return;
  const result={...s,score:s.responses.filter(r=>r.correct).length,total:s.questions.length};safeRemoveItem(STORE.dialogueQuiz);navigate("quizResult",{quizKind:"dialogue",result});
}
function reviewDialogueQuizMistakes(){const r=route.params.result;if(!r)return;const wrong=r.responses.filter(response=>!response.correct).map(response=>response.index);startDialogueQuiz(r.dialogueId,r.settings,r.questions.filter((q,i)=>wrong.includes(i)),r)}
function backToDialogueQuizResults(){const s=getDialogueQuizSession();if(!s?.review||!s.parentResult)return;const result=s.parentResult;safeRemoveItem(STORE.dialogueQuiz);navigate("quizResult",{quizKind:"dialogue",result})}
function doneDialogueQuickReview(){safeRemoveItem(STORE.dialogueQuiz);doneDialogueQuiz()}
function nextQuizDialogue(){const r=route.params.result;if(!r)return;const pool=dialogueQuizPool(r.settings),current=pool.findIndex(d=>d.id===r.dialogueId),next=pool[(current+1)%pool.length];if(next)startDialogueQuiz(next.id,r.settings)}
function doneDialogueQuiz(){filters.quizTab="dialogues";saveAppState();navigate("quiz")}
function dialogueQuizPhraseDisplayOrder(d){
  const positions=new Map(dialogueQuizEntries(d).map(e=>[e.phraseId,e]));
  return [...d.phraseLinks].sort((a,b)=>{const x=positions.get(a),y=positions.get(b);return (x?.lineIndex??Infinity)-(y?.lineIndex??Infinity)||(x?.ranges[0].index??Infinity)-(y?.ranges[0].index??Infinity)});
}
function renderDialogueQuizResult(){
  const r=route.params.result,d=r&&DIALOGUES.find(d=>d.id===r.dialogueId);if(!d)return doneDialogueQuiz();
  const wrong=new Set(r.responses.filter(response=>!response.correct).flatMap(response=>r.questions[response.index].phraseIds));
  const items=dialogueQuizPhraseDisplayOrder(d).map(id=>{
    const p=PHRASES.find(p=>p.id===id),questionIndex=r.questions.findIndex(q=>q.phraseIds.includes(id)),response=r.responses.find(x=>x.index===questionIndex),question=r.questions[questionIndex];if(!p)return '';
    if(!response)return `<button class="learning-item mistake-item dialogue-result-item" onclick="openPhrase('${id}')"><span class="mistake-copy"><strong>${esc(p.phrase)}</strong><span>${esc(p.meaning)}</span></span><span class="muted">未出題</span></button>`;
    return `<button class="learning-item mistake-item dialogue-result-item" onclick="openPhrase('${id}')"><span class="mistake-copy"><strong>${esc(p.phrase)}</strong><span>${esc(p.meaning)}</span>${response.correct?'':`<span>Your answer: ${esc(response.answer)}</span><span>Correct: ${esc(question.answer)}</span>`}</span><span class="quiz-result-status ${response.correct?'correct':'incorrect'}">${response.correct?'Correct':'Incorrect'}</span></button>`;
  }).join('');
  app.innerHTML=`<section class="card quiz-result-card"><div class="result-score">${r.score} / ${r.total}${r.score===r.total?' 👑':''}</div>${dialogueCard(d)}<div class="quiz-result-actions section"><button class="primary-button" ${wrong.size?'onclick="reviewDialogueQuizMistakes()"':'disabled'}>Review mistakes</button><button class="primary-button" ${dialogueQuizPool(r.settings).length?'onclick="nextQuizDialogue()"':'disabled'}>Next Round</button><button class="primary-button" onclick="doneDialogueQuiz()">Done</button></div><h2 class="section-title">学習Phrase</h2><div class="mistake-list">${items}</div></section>`;
}

// Integrate only at the view boundary; existing Phrase Quiz functions stay intact.
const phraseQuizHomeView=renderQuizHome,phraseQuizPlayView=renderQuizPlay,phraseQuizResultView=renderQuizResult,phraseQuickChallenge=startQuickChallenge,phraseBackupState=safeBackupState;
renderQuizHome=function(){if(filters.quizTab==="dialogues")return renderDialogueQuizHome();phraseQuizHomeView();app.querySelector(".list-page-header")?.insertAdjacentHTML("afterend",quizKindTabsMarkup());app.querySelector(".quiz-settings-panel")?.classList.toggle("quiz-practice-settings",filters.quizMode==="practice")};
renderQuizPlay=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizPlay():phraseQuizPlayView()};
renderQuizResult=function(){return route.params.quizKind==="dialogue"?renderDialogueQuizResult():phraseQuizResultView()};
startQuickChallenge=function(){filters.quizTab="phrases";saveAppState();return phraseQuickChallenge()};
safeBackupState=function(value,warnings){const safe=phraseBackupState(value,warnings);if(safe){safe.filters.quizTab=value.filters.quizTab==="dialogues"?"dialogues":"phrases";safe.filters.dialogueQuiz=dialogueQuizSettings(value.filters.dialogueQuiz)}return safe};
