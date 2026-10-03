'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8'),clone=value=>JSON.parse(JSON.stringify(value));
const STORE={activity:'activity',history:'history',quiz:'quiz',achievementSound:'achievementSound'};
const storage=new Map(),feedback={};let writes=0,downloads=[],sounds=0;
const c={STORE,LEGACY:{},BACKUP_KEYS:['activity','history'],BACKUP_JSON_KEYS:new Set(['activity','history']),
  BACKUP_APP:'Sitcom English in Action',BACKUP_SCHEMA_VERSION:1,APP_VERSION:'6',
  PHRASES:[{id:'p1'}],DIALOGUES:[{id:'d1'}],
  localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){writes++;storage.set(key,value)},removeItem(key){writes++;storage.delete(key)}},
  document:{getElementById:()=>feedback},sessionStorage:{setItem(){}},STARTUP_JINGLE_SUPPRESS_ONCE:'suppress',
  soundEnabled:()=>false,playBackupSuccessSound(){sounds++},setTimeout(){},location:{reload(){}},pendingRestore:null};
vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('const isPlainObject='),source.indexOf('function openBackup(')),c);
vm.runInContext(source.slice(source.indexOf('function storageValueForRestore('),source.indexOf('function targetButton(')),c);
c.downloadBackupDocument=(document,prefix)=>downloads.push({document:clone(document),prefix,snapshot:[...storage],writes});
const activity={dates:{'2026-08-10':{items:['phrase:p1','phrase:gone','dialogue:d1','dialogue:gone','quiz:p1','quiz:gone','phrase:d1','dialogue:p1','quiz:d1'],note:'preserved'},'2026-08-11':{items:['phrase:gone']}},target:10,extra:'kept'};
storage.set('activity',JSON.stringify(activity));storage.set('history','[]');storage.set('unrelated','keep');
const original=[...storage],document=c.createBackupDocument(),input=clone(document);
const validated=c.validateBackupDocument(document);
assert.deepEqual(clone(document),input,'validation must not mutate input');
const expected={...clone(activity),dates:{'2026-08-10':{items:['phrase:p1','dialogue:d1','quiz:p1'],note:'preserved'},'2026-08-11':{items:[]}}};
assert.deepEqual(clone(validated.data.activity),expected);assert.equal(validated.warnings.length,7);
c.exportBackup();
assert.equal(downloads.length,1);assert.deepEqual(downloads[0].document.data.activity,expected);
assert.equal(downloads[0].document.backupSchemaVersion,1);assert.equal(downloads[0].document.backupType,'manual');
assert.deepEqual(downloads[0].document.data.history,[]);assert.match(feedback.textContent,/Activityの無効な参照を7件除外/);
assert.equal(sounds,1);assert.equal(writes,0);assert.deepEqual([...storage],original);
assert.deepEqual(clone(c.validateBackupDocument(downloads[0].document).data.activity),expected);
// Valid and absent Activity retain their values, without warnings.
for(const value of [null,{dates:{'2026-08-10':{items:['phrase:p1','dialogue:d1','quiz:p1']}},target:10}]){
 const backup=clone(document);backup.data.activity=value;const result=c.validateBackupDocument(backup);
 assert.deepEqual(clone(result.data.activity),value);assert.equal(result.warnings.length,0);
}
// Only missing references are tolerated; malformed structure/items remain errors.
for(const value of [[],{dates:[]},{dates:{'2026-02-30':{items:[]}}},{dates:{'2026-08-10':null}},{dates:{'2026-08-10':{items:'bad'}}},
 ...[42,null,'unknown:p1','phrase:','p1'].map(item=>({dates:{'2026-08-10':{items:['phrase:gone',item]}}})),
 {dates:{},target:0},{dates:{},target:'10'}]){
 const backup=clone(document);backup.data.activity=value;
 assert.throws(()=>c.validateBackupDocument(backup),/Activity/);
}
const historyBackup=clone(document);historyBackup.data.history=[{total:1,score:0,mistakes:['gone'],completedAt:'2026-08-10T00:00:00.000Z'}];
assert.throws(()=>c.validateBackupDocument(historyBackup),/Quiz History/,'Quiz History must remain strict');
// Safety Backup is downloaded before any storage write, using the same sanitized Activity.
c.pendingRestore={data:validated.data};c.performRestore();
assert.equal(downloads.length,2);assert.equal(downloads[1].document.backupType,'safety');
assert.equal(downloads[1].prefix,'sitcom-english-safety-backup');assert.deepEqual(downloads[1].document.data.activity,expected);
assert.equal(downloads[1].writes,0);assert.deepEqual(downloads[1].snapshot,original);
assert.deepEqual(JSON.parse(storage.get('activity')),expected);assert.equal(storage.get('unrelated'),'keep');
// A failed Safety Backup download prevents replacement of current storage.
for(const [key,value] of original)storage.set(key,value);
const beforeFailure=[...storage];writes=0;c.pendingRestore={data:validated.data};
c.downloadBackupDocument=()=>{throw Error('download failed')};c.performRestore();
assert.equal(writes,0);assert.deepEqual([...storage],beforeFailure);assert.match(feedback.textContent,/Safety Backup/);
// Restore write failure still rolls back the exact original values.
let failOnce=true;const normalSet=c.localStorage.setItem;
c.localStorage.setItem=function(key,value){if(failOnce){failOnce=false;throw Error('quota')}normalSet(key,value)};
assert.throws(()=>c.replaceBackupStorage(validated.data),/元のデータへ戻しました/);
assert.deepEqual([...storage].sort(),beforeFailure.sort());
// Empty days do not count as studied after restoration.
vm.runInContext(source.slice(source.indexOf('function activityStudiedDates('),source.indexOf('function recentStudyDays(')),c);
assert.deepEqual([...c.activityStudiedDates(expected)],['2026-08-10']);
console.log('Backup Activity validation, Export, Safety Backup and Restore regression tests passed');
