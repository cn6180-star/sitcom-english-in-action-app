"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");

for(const asset of["quiz-perfect.mp3","backup-success.mp3"]){
  const file=path.join(root,"assets","sounds",asset);
  assert.ok(fs.existsSync(file),`${asset} is missing`);
  assert.ok(fs.statSync(file).size>0,`${asset} is empty`);
}

assert.match(source,/quizPerfect:"assets\/sounds\/quiz-perfect\.mp3"/);
assert.match(source,/backupSuccess:"assets\/sounds\/backup-success\.mp3"/);
assert.match(source,/perfect\?UI_SOUND_FILES\.quizPerfect:UI_SOUND_FILES\.quizComplete/);
assert.match(source,/playQuizCompleteSound\(result\.completedAt,result\.score===result\.total\)/);
assert.match(source,/showSeasonCompleteToast\(celebratedSeason\);playSeasonCompleteSound\(\)/);
assert.match(source,/function showSeasonCompleteToast\(season\).*Season \$\{season\} Complete!/);
assert.match(source,/downloadBackupDocument\(backup\);[\s\S]*?playBackupSuccessSound\(\)/);
assert.match(source,/replaceBackupStorage\(restoreData\);[\s\S]*?if\(successSoundEnabled\)playBackupSuccessSound\(\);setTimeout\(\(\)=>location\.reload\(\),1200\)/);
assert.match(source,/解決しないときは？/);
assert.match(source,/https:\/\/discord\.gg\/aRZYaGHgdG/);
assert.match(source,/target="_blank" rel="noopener noreferrer"/);
assert.match(source,/Version 5\.4/);
assert.match(source,/Recordって何？/);
assert.match(source,/Recordはどう使う？/);

console.log("UX feedback tests passed");
