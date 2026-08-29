"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");
assert.ok(fs.existsSync(path.join(root,"assets","sounds","decision34.mp3")));
assert.ok(fs.existsSync(path.join(root,"assets","sounds","decision35.mp3")));
const recordingSourceStart=source.indexOf("function createEmptyRecordingSession");
const end=source.indexOf("function bookmarks");
assert.ok(recordingSourceStart>=0&&end>recordingSourceStart);

const order=[],audios=[],recorders=[],streams=[],revoked=[],toasts=[],timeouts=new Map(),intervals=new Map();
let timerId=0,soundOn=false,getUserMediaImpl;
class FakeTrack{
  constructor(){this.stopped=false;this.listeners={}}
  stop(){this.stopped=true}
  addEventListener(name,fn){this.listeners[name]=fn}
  end(){this.listeners.ended?.()}
}
class FakeStream{
  constructor(){this.track=new FakeTrack();streams.push(this)}
  getTracks(){return[this.track]}
}
class FakeAudio{
  constructor(src){this.src=src;this.currentTime=0;this.paused=false;this.onended=null;this.onerror=null;audios.push(this)}
  play(){order.push(`audio:${this.src}`);return Promise.resolve()}
  pause(){this.paused=true}
  end(){this.onended?.()}
}
class FakeRecorder{
  static unsupported=new Set();
  static throws=new Set();
  static isTypeSupported(type){return!this.unsupported.has(type)}
  constructor(stream,options){const type=options?.mimeType||"";order.push(`construct:${type||"default"}`);if(FakeRecorder.throws.has(type))throw new Error("constructor failed");this.stream=stream;this.mimeType=type||"audio/default";this.state="inactive";this.ondataavailable=null;this.onstop=null;this.onerror=null;recorders.push(this)}
  start(){order.push("recorder:start");this.state="recording"}
  stop(){order.push("recorder:stop");this.state="inactive";this.ondataavailable?.({data:new Blob(["voice"],{type:this.mimeType})});this.onstop?.()}
}
const controller={id:"recordingControllerRoot",innerHTML:"",remove(){documentState.controller=null}};
const documentState={controller:null};
const document={
  getElementById:id=>id==="recordingControllerRoot"?documentState.controller:null,
  createElement:()=>controller,
  body:{appendChild:node=>{documentState.controller=node}},
  querySelectorAll:()=>[]
};
const context={
  Promise,Set,Blob,Date,Math,console,
  window:{MediaRecorder:FakeRecorder},
  navigator:{mediaDevices:{getUserMedia:constraints=>getUserMediaImpl(constraints)}},
  document,Audio:FakeAudio,
  URL:{createObjectURL:()=>`blob:${Math.random()}`,revokeObjectURL:url=>revoked.push(url)},
  route:{name:"phraseDetail",params:{id:"p1"}},
  soundEnabled:()=>soundOn,
  showFeedbackToast:(message)=>toasts.push(message),
  esc:value=>String(value),
  setTimeout:(fn,ms)=>{const id=++timerId;timeouts.set(id,{fn,ms});return id},
  clearTimeout:id=>timeouts.delete(id),
  setInterval:(fn,ms)=>{const id=++timerId;intervals.set(id,{fn,ms});return id},
  clearInterval:id=>intervals.delete(id)
};
vm.runInNewContext(`
const RECORDING_MAX_SECONDS=60;
const RECORDING_MIME_TYPES=["audio/webm;codecs=opus","audio/webm","audio/mp4;codecs=mp4a.40.2","audio/mp4"];
const RECORDING_CUE_FILES={start:"decision34.mp3",stop:"decision35.mp3"};
let recordingSession=createEmptyRecordingSession();
${source.slice(recordingSourceStart,end)}
globalThis.api={
 startRecording,stopRecording,retryRecording,closeRecording,toggleRecordingPlayback,
 cleanupRecordingForRoute,createRecordingMediaRecorder,handleRecordingTrackEnded,
 state:()=>recordingSession,setRoute:(name,id)=>{route={name,params:{id}}}
};`,context);

const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function start(type="phrase",id="p1"){
  getUserMediaImpl=async()=>new FakeStream();
  await context.api.startRecording(type,id);
  assert.equal(context.api.state().phase,"recording");
}

(async()=>{
  FakeRecorder.throws=new Set(["audio/webm;codecs=opus"]);
  const chosen=context.api.createRecordingMediaRecorder(new FakeStream(),FakeRecorder);
  assert.equal(chosen.mimeType,"audio/webm");
  assert.deepEqual(order.slice(-2),["construct:audio/webm;codecs=opus","construct:audio/webm"]);
  FakeRecorder.throws.clear();

  context.window.MediaRecorder=undefined;
  await context.api.startRecording("phrase","p1");
  assert.equal(context.api.state().phase,"idle");
  assert.match(toasts.at(-1),/この端末では録音を開始できません/);
  context.window.MediaRecorder=FakeRecorder;

  context.navigator.mediaDevices=undefined;
  await context.api.startRecording("phrase","p1");
  assert.equal(context.api.state().phase,"idle");
  context.navigator.mediaDevices={getUserMedia:constraints=>getUserMediaImpl(constraints)};

  getUserMediaImpl=async()=>{const error=new Error("denied");error.name="NotAllowedError";throw error};
  await context.api.startRecording("phrase","p1");
  assert.match(toasts.at(-1),/マイクへのアクセスを許可してください/);

  soundOn=true;getUserMediaImpl=async()=>new FakeStream();
  const cueStart=context.api.startRecording("phrase","p1");
  await flush();
  assert.equal(context.api.state().phase,"cue");
  assert.equal(recorders.at(-1).state,"inactive","recorder must wait for the start cue");
  audios.at(-1).end();
  await cueStart;
  assert.equal(context.api.state().phase,"recording");
  assert.ok(order.indexOf("recorder:start")>order.indexOf("audio:decision34.mp3"));

  context.api.closeRecording();
  soundOn=true;getUserMediaImpl=async()=>new FakeStream();
  const abandonedCue=context.api.startRecording("phrase","p1");
  await flush();
  assert.equal(context.api.state().phase,"cue");
  context.api.setRoute("phraseDetail","p2");
  context.api.cleanupRecordingForRoute();
  await abandonedCue;
  assert.equal(context.api.state().phase,"idle","route cleanup must release a pending cue");
  context.api.setRoute("phraseDetail","p1");

  soundOn=false;
  const audioCountBeforeSilentStart=audios.length;
  await start();
  assert.equal(audios.length,audioCountBeforeSilentStart,"Sound OFF must skip the recording start cue");
  const stopRecorder=context.api.state().recorder;
  assert.equal(context.api.stopRecording(),true);
  assert.equal(context.api.state().phase,"ready");
  assert.equal(context.api.state().blob.size,5);
  assert.ok(context.api.state().objectUrl);
  assert.equal(audios.length,audioCountBeforeSilentStart,"Sound OFF must skip the recording stop cue");
  assert.equal(stopRecorder.stream.track.stopped,true);
  assert.equal(context.api.stopRecording(),false,"double stop must be harmless");

  context.api.toggleRecordingPlayback();
  assert.equal(context.api.state().phase,"playing");
  const playback=context.api.state().playback;
  context.api.toggleRecordingPlayback();
  assert.equal(context.api.state().phase,"ready");
  assert.equal(playback.paused,true);
  context.api.toggleRecordingPlayback();
  context.api.state().playback.end();
  assert.equal(context.api.state().phase,"ready");

  const oldUrl=context.api.state().objectUrl;
  const oldStream=stopRecorder.stream;
  context.api.retryRecording();
  await flush();
  assert.equal(context.api.state().phase,"recording");
  assert.ok(revoked.includes(oldUrl));
  assert.equal(oldStream.track.stopped,true);

  const sameGeneration=context.api.state().generation;
  context.api.cleanupRecordingForRoute();
  assert.equal(context.api.state().generation,sameGeneration,"same owner rerender must continue");
  context.api.setRoute("phraseDetail","p2");
  context.api.cleanupRecordingForRoute();
  assert.equal(context.api.state().phase,"idle","owner change must clean up");

  context.api.setRoute("dialogueDetail","d1");
  await start("dialogue","d1");
  const dialogueStream=context.api.state().stream;
  context.api.setRoute("phraseDetail","p1");
  await start("phrase","p1");
  assert.equal(dialogueStream.track.stopped,true,"only one shared session may remain active");
  assert.equal(context.api.state().owner.type,"phrase");
  assert.equal(context.api.state().owner.id,"p1");

  const limit=[...timeouts.values()].find(timer=>timer.ms===60000);
  assert.ok(limit,"60 second auto-stop timer is required");
  limit.fn();
  assert.equal(context.api.state().phase,"ready","auto-stop must use normal finish flow");

  const closeUrl=context.api.state().objectUrl;
  context.api.closeRecording();
  assert.equal(context.api.state().phase,"idle");
  assert.ok(revoked.includes(closeUrl));
  assert.equal(intervals.size,0);

  let resolvePermission;
  context.api.setRoute("phraseDetail","p1");
  getUserMediaImpl=()=>new Promise(resolve=>{resolvePermission=resolve});
  const pending=context.api.startRecording("phrase","p1");
  await flush();
  context.api.setRoute("phraseDetail","p2");
  context.api.cleanupRecordingForRoute();
  const lateStream=new FakeStream();resolvePermission(lateStream);await pending;
  assert.equal(lateStream.track.stopped,true,"late permission stream must be stopped");
  assert.equal(context.api.state().phase,"idle");

  context.api.setRoute("dialogueDetail","d1");
  await start("dialogue","d1");
  context.api.state().stream.track.end();
  assert.equal(context.api.state().phase,"ready");
  assert.match(toasts.at(-1),/録音が停止しました/);

  assert.match(source,/function render\(\)\{\s*cleanupRecordingForRoute\(\)/);
  assert.match(source,/togglePhraseTranslations\(\).*renderPhraseDetail\(\)/);
  assert.doesNotMatch(source.slice(source.indexOf("function speakExample"),source.indexOf("function togglePhraseTranslations")),/cleanupRecording/);
  assert.doesNotMatch(source.slice(source.indexOf("function playDialogue"),source.indexOf("function toggleDialoguePlayback")),/cleanupRecording/);
  assert.match(source,/pagehide[^\n]*cleanupRecording\(\)/);
  assert.match(source,/freeze[^\n]*cleanupRecording\(\)/);
  assert.match(source,/detail-recording-actions/);
  assert.match(source,/dialogue-recording-actions/);
  assert.match(styles,/#recordingControllerRoot\{[^}]*position:fixed[^}]*z-index:70/);
  assert.match(source,/function positionRecordingController\(\).*buttonRect\.top-controllerRect\.height-10/);
  assert.match(source,/root\.style\.right=`max\([^`]+env\(safe-area-inset-right/);
  assert.match(source,/addEventListener\("resize",positionRecordingController\)/);
  assert.match(styles,/\.dialogue-recording-actions,\.detail-recording-actions\{[^}]*repeat\(2/);
  assert.match(styles,/\.dialogue-play-button\{[^}]*width:100%/);
  assert.match(styles,/safe-area-inset-right/);
  console.log("recording v1 tests passed");
})().catch(error=>{console.error(error);process.exitCode=1});
