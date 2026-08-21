"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","js","app.js"),"utf8");
const start=source.indexOf("function clearUiSoundQueue");
const end=source.indexOf("function playStartupJingle");
assert.ok(start>=0&&end>start);

let timerId=0;
class FakeAudio{
  constructor(){this.src="";this.duration=.7;this.currentTime=0;this.pauseCalls=0;this.playCalls=0;this.onended=null;this.onerror=null}
  load(){}
  pause(){this.pauseCalls++}
  play(){this.playCalls++;return{then:resolve=>{resolve();return{catch(){}}}}}
}

const context={
  Map,Set,Number,Math,
  document:{createElement:()=>new FakeAudio()},
  soundEnabled:()=>true,
  setTimeout:()=>++timerId,
  clearTimeout:()=>{},
  getAudioContext:()=>null,
  UI_SOUND_FILES:{quizStart:"start.mp3",quizCorrect:"correct.mp3",quizIncorrect:"incorrect.mp3",quizComplete:"complete.mp3",quizPerfect:"perfect.mp3",learned:"learned.mp3",seasonComplete:"season.mp3",backupSuccess:"backup.mp3"}
};

vm.runInNewContext(`
let activeSoundNodes=[],activeSoundRun=0,activeUiAudio=null,activeUiSoundItem=null,uiSoundQueue=[],uiSoundTimer=null,uiSoundBusy=false,uiSoundSerial=0;
const queuedUiSoundKeys=new Set(),preloadedUiSounds=new Map();
let startupJingleResolved=true;
${source.slice(start,end)}
globalThis.api={
  playQuizSound,queueMp3Sound,
  state:()=>({busy:uiSoundBusy,active:activeUiSoundItem&&{key:activeUiSoundItem.key,src:activeUiSoundItem.src,kind:activeUiSoundItem.kind},queue:uiSoundQueue.map(item=>({key:item.key,src:item.src,kind:item.kind})),keys:[...queuedUiSoundKeys],audio:activeUiAudio}),
  sounds:()=>[...preloadedUiSounds.values()]
};`,context);

context.api.playQuizSound(true);
const firstAudio=context.api.state().audio;
assert.equal(context.api.state().active.src,"correct.mp3");
context.api.queueMp3Sound("protected-complete","complete.mp3");
context.api.playQuizSound(false);
assert.equal(firstAudio.pauseCalls,1,"active feedback should be interrupted");
assert.equal(context.api.state().active.src,"incorrect.mp3");
assert.equal(context.api.state().queue.map(item=>item.src).join(","),"complete.mp3","protected FIFO sound must remain queued");
assert.equal(context.api.state().queue.some(item=>item.kind==="quiz-feedback"),false,"stale feedback must not remain queued");

context.api.state().audio.onended();
assert.equal(context.api.state().active.src,"complete.mp3","protected sound should play after the latest feedback");
context.api.state().audio.onended();
assert.equal(context.api.state().busy,false);

for(let index=0;index<50;index++){
  context.api.playQuizSound(index%2===0);
  const state=context.api.state();
  assert.equal(state.active.kind,"quiz-feedback");
  assert.equal(state.queue.some(item=>item.kind==="quiz-feedback"),false);
  assert.equal(state.keys.filter(key=>key.startsWith("quiz-answer:")).length,0,"active keys must not remain in queued key tracking");
}
const pauseCalls=context.api.sounds().reduce((sum,audio)=>sum+audio.pauseCalls,0);
assert.ok(pauseCalls>=49,"rapid feedback should interrupt previous feedback instead of accumulating it");

console.log("quiz feedback sound tests passed");
