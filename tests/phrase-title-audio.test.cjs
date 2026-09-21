'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8'),styles=fs.readFileSync('css/style.css','utf8');

assert.match(source,/<div class="phrase-title-row"><h1 class="detail-title">\$\{esc\(p\.phrase\)\}<\/h1><button class="speaker-button phrase-title-speaker"[^>]+data-text="\$\{esc\(p\.phrase\)\}"[^>]+onclick="speakPhraseTitle\(this\.dataset\.text\)"[^>]+aria-label="Read phrase aloud">🔊<\/button><\/div>/);
assert.match(source,/function exampleMarkup\([^\n]+onclick="speakExample\(this\.dataset\.text\)" aria-label="Read \$\{label\} aloud"/,'Example audio remains on the existing playback path');
assert.match(styles,/\.phrase-title-row\{display:flex;align-items:flex-start;gap:8px;margin:5px 0 7px\}/);
assert.match(styles,/\.phrase-title-row \.detail-title\{min-width:0;flex:0 1 auto;margin:0;overflow-wrap:anywhere\}/,'long headings wrap without displacing the control');
assert.match(styles,/\.phrase-title-speaker\{flex:0 0 34px;width:34px;height:34px;font-size:15px\}/,'compact fixed-size control on desktop and mobile');

const context={
  document:{querySelector:()=>null},
  window:{speechSynthesis:{cancelCalls:0,spoken:[],cancel(){this.cancelCalls++},speak(utterance){this.spoken.push(utterance.text)},removeEventListener(){}}},
  SpeechSynthesisUtterance:function(text){this.text=text},
  dialoguePlaybackRun:0,dialoguePlaybackActive:false,dialoguePlaybackPauseTimer:null,dialogueVoiceChangeHandler:null,
  clearTimeout(){},
};
vm.createContext(context);
for(const name of ['speechAvailable','updateDialoguePlaybackButton','clearDialogueVoiceWait','stopDialoguePlayback','speakExample','phraseTitleSpeechText','speakPhraseTitle']){
  const line=source.split(/\r?\n/).find(value=>value.startsWith(`function ${name}(`));assert.ok(line,name);vm.runInContext(line,context);
}
context.speakPhraseTitle('if I had a nickel for ~');
context.speakPhraseTitle('plan on ~ing');
context.speakExample('If I had a nickel for every mistake, I’d be rich.');
assert.deepEqual(context.window.speechSynthesis.spoken,['if I had a nickel for …','plan on …ing','If I had a nickel for every mistake, I’d be rich.']);
assert.equal(context.window.speechSynthesis.cancelCalls,3,'each new phrase/example playback cancels prior speech');
assert.equal(context.dialoguePlaybackRun,3,'phrase playback follows existing dialogue interruption behavior');

console.log('Phrase title audio: tilde pause preprocessing, shared TTS, Example isolation and responsive title layout PASS');
