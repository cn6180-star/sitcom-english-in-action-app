"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
// Tiny DOM contract for the production view adapter, not a second blank renderer.
class Element {
 constructor(text=''){this._text=text;this.children=[];this.dataset={};this.attrs={};this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x),contains:x=>this.classes.has(x)};}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('')}
 set textContent(value){this._text=value;this.children=[]}
 append(child){this.children.push(child)}
 setAttribute(k,v){this.attrs[k]=v}
 removeAttribute(k){delete this.attrs[k]}
 querySelector(selector){return selector==='.dialogue-blank-text'?this.children[0]:null}
}
let rows=[],highlights=[],phraseButton=null,rendered=0;
const list=new Element(),hint=new Element(),buttons=['Normal','Blank','Hide A','Hide B'].map(x=>new Element(x));
const side={querySelector:s=>s==='.learning-list'?list:phraseButton,insertBefore:b=>{phraseButton=b}};
c.app={querySelector:s=>s==='.blank-mode-hint'?hint:s==='.dialogue-side'?side:null,querySelectorAll:s=>s==='.bubble-row'?rows:s==='[data-blank-key]'?highlights.filter(h=>h.dataset.blankKey):s==='.dialogue-controls .seg-button'?buttons:[]};
c.document={createElement:()=>new Element()};c.PHRASES=phrases;c.DIALOGUES=dialogues;c.route={params:{}};
c.setContinue=()=>{};c.render=()=>{rendered++};c.renderDialogueDetail=()=>{throw Error('Blank/Normal must not rerender or stop playback/recording')};
const names=['setPractice','revealDialogueBlank','toggleDialogueBlankPhrases','updateDialogueBlankPhraseList','dialogueMove','dialoguePracticeDelay','englishDialogueVoices','playDialogue'];
vm.runInContext(source.split(/\r?\n/).filter(l=>names.some(n=>l.startsWith('function '+n+'('))).join('\n'),c);
vm.runInContext(source.slice(source.indexOf('function applyDialogueBlankMode(){'),source.indexOf('\nrenderDialogueDetail=function(){renderDialogueDetailBase();')),c);
function mount(d,matches){c.DIALOGUES=[d];c.route.params={id:d.id,practice:'normal',blankRevealed:[]};rows=d.lines.map((line,i)=>{const selected=c.selectedDialogueMatches(matches.filter(m=>m.lineIndex===i));const spans=selected.map(m=>new Element(line[1].slice(m.index,m.index+m.length)));return {selected,spans,querySelectorAll:()=>spans}});highlights=rows.flatMap(r=>r.spans);c.dialoguePhraseMatchResults=()=>matches;}
function visible(d,i){let cursor=0,out='';rows[i].selected.forEach((m,j)=>{out+=d.lines[i][1].slice(cursor,m.index);out+=rows[i].spans[j].classes.has('dialogue-blank')?'_____':rows[i].spans[j].textContent;cursor=m.index+m.length});return out+d.lines[i][1].slice(cursor)}
function sample(text,parts){const d={id:'fixture',phraseLinks:['p1'],lines:[['A',text,'訳']]};mount(d,parts.map(part=>({lineIndex:0,phraseId:'p1',index:text.indexOf(part),length:part.length,priority:0})));return d}
let d=sample('I’m all ears.',['all ears']);c.setPractice('blank');assert.equal(visible(d,0),'I’m _____.');assert.equal(list.hidden,true);assert.equal(highlights[0].attrs.role,'button');assert.equal(highlights[0].children[0].attrs['aria-hidden'],'true');
c.revealDialogueBlank('0:0');assert.equal(visible(d,0),d.lines[0][1]);assert.equal(highlights[0].attrs['aria-label'],'Hide revealed phrase');c.revealDialogueBlank('0:0');assert.equal(visible(d,0),'I’m _____.');
d=sample('It’s hard to keep cravings at bay.',['keep','at bay']);c.setPractice('blank');assert.equal(visible(d,0),'It’s hard to _____ cravings _____.');highlights[0].onkeydown({key:'Enter',preventDefault(){}});assert.equal(visible(d,0),'It’s hard to keep cravings _____.','first blank reveals independently');highlights[1].onclick();assert.equal(visible(d,0),d.lines[0][1]);highlights[0].onclick();assert.equal(visible(d,0),'It’s hard to _____ cravings at bay.','revealed blank toggles back independently');highlights[1].onclick();assert.equal(visible(d,0),'It’s hard to _____ cravings _____.');
c.toggleDialogueBlankPhrases();assert.equal(list.hidden,false);c.setPractice('normal');assert.equal(visible(d,0),d.lines[0][1]);assert.equal(list.hidden,false);
d=sample('What if we test it tomorrow?',['What if']);c.setPractice('blank');assert.equal(visible(d,0),'_____ we test it tomorrow?');
// Exercise every real selected range, including overrides, repeated phrases and exclusions.
vm.runInContext(source.split(/\r?\n/).find(l=>l.startsWith('function dialoguePhraseMatchResults('))+'\nthis.realMatches=dialoguePhraseMatchResults;',c);
let checked=0;
for(const real of dialogues){const matches=c.realMatches(real,real.phraseLinks.map(id=>phrases.find(p=>p.id===id)));mount(real,matches);c.setPractice('blank');rows.forEach((row,i)=>row.selected.forEach((m,j)=>{assert.equal(row.spans[j].textContent,real.lines[i][1].slice(m.index,m.index+m.length));assert.equal(row.spans[j].dataset.blankKey,`${i}:${j}`);assert.ok(row.spans[j].classes.has('dialogue-blank'));checked++}));if(highlights.length){const key=highlights[0].dataset.blankKey;c.revealDialogueBlank(key);assert.ok(highlights[0].classes.has('blank-revealed'));assert.ok(highlights.slice(1).every(h=>h.classes.has('dialogue-blank')));c.revealDialogueBlank(key);assert.ok(highlights.every(h=>h.classes.has('dialogue-blank')))}c.setPractice('normal');real.lines.forEach((line,i)=>assert.equal(visible(real,i),line[1]));}
assert.ok(checked>1000);
for(const [id,target] of [['d44','call it first'],['d204','What if']]){const real=dialogues.find(d=>d.id===id),matches=c.realMatches(real,real.phraseLinks.map(id=>phrases.find(p=>p.id===id)));mount(real,matches);c.setPractice('blank');assert.ok(highlights.some(h=>h.textContent===target&&h.classes.has('dialogue-blank')));}
const formerlyExcluded=dialogues.find(d=>d.id==='d8');mount(formerlyExcluded,c.realMatches(formerlyExcluded,[phrases.find(p=>p.id==='p117')]));c.setPractice('blank');assert.deepEqual(highlights.map(h=>h.textContent),['per se']);
// Original English, not rendered DOM, is the TTS source even in Blank mode.
const speech=[];c.window={speechSynthesis:{getVoices:()=>[{lang:'en-US'}],speak:u=>{speech.push(u.text);u.onend()},addEventListener:()=>{}}};c.document.hidden=false;c.SpeechSynthesisUtterance=function(text){this.text=text};c.stopDialoguePlayback=()=>{};c.speechAvailable=()=>true;c.updateDialoguePlaybackButton=()=>{};c.clearDialogueVoiceWait=()=>{};c.dialoguePlaybackRun=1;c.dialoguePlaybackPauseTimer=null;c.clearTimeout=()=>{};c.setTimeout=f=>{f();return 1};c.playDialogue();assert.deepEqual(speech,formerlyExcluded.lines.map(l=>l[1]));
// Switching dialogues preserves Blank but discards reveal/list state.
c.DIALOGUES=dialogues;c.route.params={id:'d44',ids:['d44','d45'],practice:'blank',blankRevealed:['p408'],blankPhrasesExpanded:true};c.dialogueMove(1);assert.equal(c.route.params.id,'d45');assert.equal(c.route.params.practice,'blank');assert.equal(c.route.params.blankRevealed.length,0);assert.equal(c.route.params.blankPhrasesExpanded,false);assert.equal(rendered,1);
assert.match(source,/data-text="\$\{esc\(line\[1\]\)\}"/,'line TTS original data');
assert.doesNotMatch(source.slice(source.indexOf('function applyDialogueBlankMode(){'),source.indexOf('\nrenderDialogueDetail=function(){renderDialogueDetailBase();')),/recordingSession|stopRecording|stopDialoguePlayback|speechSynthesis/);
assert.doesNotMatch(source,/Show All|setDialogueBlanksRevealed|blank-mode-actions/);
console.log('Dialogue Blank mode: single/multi/explicit/exclusion, independent reveal/re-blank, TTS and switch PASS');
