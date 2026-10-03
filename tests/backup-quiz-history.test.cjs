'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const seasons=Array.from({length:10},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data',`season${i+1}.json`),'utf8')));
const PHRASES=seasons.flatMap(s=>s.phrases),DIALOGUES=seasons.flatMap(s=>s.dialogues),clone=v=>JSON.parse(JSON.stringify(v));
assert.equal(PHRASES.length,4062);assert.equal(DIALOGUES.length,334);
const storage=new Map(),feedback={},downloads=[];let writes=0,confirmation;
const c={PHRASES,DIALOGUES,SEASONS:seasons.map(s=>s.season),Blob,
 localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){writes++;storage.set(key,value)},removeItem(key){writes++;storage.delete(key)}},
 URL:{createObjectURL(blob){c.currentBlob=blob;return 'blob:mock'},revokeObjectURL(){}},
 document:{getElementById:()=>feedback,body:{appendChild(){}},createElement:()=>({style:{},click(){downloads.push({blob:c.currentBlob,name:this.download,snapshot:[...storage],writes})},remove(){}})},
 setTimeout(){},playBackupSuccessSound(){},soundEnabled:()=>false,sessionStorage:{setItem(){}},location:{reload(){}},pendingRestore:null};
vm.createContext(c);
// Use production storage keys, schema constants and full Backup / Restore implementations.
vm.runInContext(source.slice(source.indexOf('const LEGACY ='),source.indexOf('const TODAY_TARGET =')),c);
vm.runInContext(source.slice(source.indexOf('const isPlainObject='),source.indexOf('function targetButton(')),c);
c.showRestoreConfirmation=()=>{confirmation=clone(c.pendingRestore)};
const {STORE,LEGACY,BACKUP_KEYS,BACKUP_JSON_KEYS}=vm.runInContext('({STORE,LEGACY,BACKUP_KEYS,BACKUP_JSON_KEYS})',c);
const p=seasons.map(s=>s.phrases[0].id),d=seasons.map(s=>s.dialogues[0].id);
// IDs model historical deletions; they are intentionally absent from the current DB.
const goneP=['p-deleted-20260810-a','p-deleted-20260810-b'],goneD=['S1-DELETED-A','S10-DELETED-B'];
for(const id of goneP)assert.ok(!PHRASES.some(p=>p.id===id));
for(const id of goneD)assert.ok(!DIALOGUES.some(d=>d.id===id));
const activity={dates:{
 '2026-08-09':{items:[`phrase:${p[0]}`,`dialogue:${d[9]}`,`quiz:${p[9]}`]},
 '2026-08-10':{items:[`phrase:${goneP[0]}`,`phrase:${p[4]}`,`dialogue:${goneD[0]}`,`quiz:${p[8]}`,`quiz:${goneP[1]}`,`dialogue:${d[5]}`,`phrase:${goneP[1]}`,`dialogue:${goneD[1]}`,`quiz:${goneP[0]}`],note:'retain metadata'},
 '2026-08-11':{items:[`phrase:${goneP[0]}`,`dialogue:${goneD[1]}`,`quiz:${goneP[1]}`]},
 '2026-08-12':{items:[]}},target:10};
const expected=clone(activity);expected.dates['2026-08-10'].items=[`phrase:${p[4]}`,`quiz:${p[8]}`,`dialogue:${d[5]}`];expected.dates['2026-08-11'].items=[];
const data=Object.fromEntries(BACKUP_KEYS.map(key=>[key,null]));
Object.assign(data,{[LEGACY.phraseBookmarks]:[p[0],p[9]],[LEGACY.dialogueBookmarks]:[d[0],d[9]],
 [LEGACY.weak]:{[p[1]]:{miss:2,streak:0,graduated:false}},[STORE.learned]:{friends:[p[2]]},[STORE.dialogueLearned]:{friends:[d[2]]},
 [STORE.activity]:activity,[STORE.history]:[{total:10,score:9,mistakes:[p[3]],completedAt:'2026-08-10T12:00:00.000Z',quizMode:'test',scope:'random'}],
 [STORE.continue]:{series:'friends',kind:'phrase',id:p[4],timestamp:1786363200000},[STORE.dailyTarget]:10,[STORE.sound]:false});
for(const [key,value] of Object.entries(data))if(value!==null)storage.set(key,BACKUP_JSON_KEYS.has(key)?JSON.stringify(value):String(value));
storage.set(STORE.quiz,'{"unrelated":"in-progress"}');storage.set('unrelated-key','unchanged');
// Include six historical attempts, multiple deleted IDs and an all-orphan attempt.
const history=Array.from({length:6},(_,i)=>({score:8,total:10,mistakes:[p[i]],completedAt:`2026-08-${String(i+9).padStart(2,'0')}T12:00:00.000Z`,completedDate:`2026-08-${String(i+9).padStart(2,'0')}`,added:2,graduated:1,scope:'random',quizMode:i%2?'practice':'test',note:`attempt-${i}`}));
history[1].mistakes=[goneP[0],p[1],goneP[1],p[2],p[1]];
history[4].mistakes=[];
history[5].mistakes=[goneP[0],goneP[1]];
data[STORE.history]=history;storage.set(STORE.history,JSON.stringify(history));
const expectedHistory=clone(history);expectedHistory[1].mistakes=[p[1],p[2],p[1]];expectedHistory[5].mistakes=[];
const original=[...storage];
async function main(){
 c.exportBackup();assert.equal(downloads.length,1);assert.equal(writes,0);assert.deepEqual([...storage],original);
 const text=await downloads[0].blob.text(),backup=JSON.parse(text);
 assert.equal(backup.backupSchemaVersion,1);assert.equal(backup.backupType,'manual');
 assert.deepEqual(backup.data,{...data,[STORE.activity]:expected,[STORE.history]:expectedHistory},'only orphan Activity and Quiz History references may change in the actual Blob JSON');
 assert.match(feedback.textContent,/Activityの無効な参照を9件除外/);assert.match(feedback.textContent,/Quiz Historyの無効な参照を4件除外/);
 const input={files:[{name:downloads[0].name,text:async()=>text}],value:'selected'};
 await c.handleRestoreFile({currentTarget:input});
 assert.equal(input.value,'');assert.ok(confirmation);assert.deepEqual(confirmation.data,backup.data);assert.deepEqual(confirmation.warnings,[]);
 assert.equal(writes,0);assert.deepEqual([...storage],original,'Restore preview must not write storage');
 c.performRestore();assert.equal(downloads.length,2);
 const safety=JSON.parse(await downloads[1].blob.text());assert.equal(safety.backupType,'safety');assert.match(downloads[1].name,/sitcom-english-safety-backup/);
 assert.deepEqual(safety.data,backup.data);assert.equal(downloads[1].writes,0);assert.deepEqual(downloads[1].snapshot,original);
 assert.deepEqual(JSON.parse(storage.get(STORE.history)),expectedHistory);assert.deepEqual(JSON.parse(storage.get(STORE.activity)),expected);assert.equal(storage.get('unrelated-key'),'unchanged');
 assert.match(feedback.textContent,/Restore completed/);
 // Older backups with the same orphan references are also accepted without mutating their input.
 const oldBackup={...backup,data:clone(data)},before=clone(oldBackup),validated=c.validateBackupDocument(oldBackup);
 assert.deepEqual(clone(validated.data[STORE.activity]),expected);assert.deepEqual(clone(validated.data[STORE.history]),expectedHistory);assert.equal(validated.warnings.length,13);assert.deepEqual(oldBackup,before);
 const base=clone(history[0]);
 const invalidEntries=[null,[],
 ...[42,null,{},[]].map(id=>({...base,mistakes:[goneP[0],id]})),
 ...[null,'bad',{}].map(mistakes=>({...base,mistakes})),
 ...[0,101,1.5,'10'].map(total=>({...base,total})),
 ...[-1,11,1.5,'8'].map(score=>({...base,score})),
 ...['bad','2026-08-09'].map(completedAt=>({...base,completedAt})),
 {...base,completedDate:'2026-02-30'},{...base,scope:'broken'},{...base,quizMode:'broken'},
 ...['added','graduated'].flatMap(field=>[-1,1.5,'1'].map(value=>({...base,[field]:value})))];
 const invalid=[{},'bad',...invalidEntries.map(entry=>[...clone(history).slice(0,5),entry])];
 for(const value of invalid){
  const broken={...backup,data:{...backup.data,[STORE.history]:value}};
  assert.throws(()=>c.validateBackupDocument(broken),/Quiz History/);
  const previous=confirmation,snapshot=[...storage],writeCount=writes;
  await c.handleRestoreFile({currentTarget:{files:[{name:'broken.json',text:async()=>JSON.stringify(broken)}],value:'selected'}});
  assert.equal(confirmation,previous);assert.match(feedback.textContent,/Quiz History/);assert.equal(writes,writeCount);assert.deepEqual([...storage],snapshot);
  storage.set(STORE.history,JSON.stringify(value));const exportSnapshot=[...storage],count=downloads.length;
  c.exportBackup();assert.equal(downloads.length,count);assert.match(feedback.textContent,/Quiz History/);assert.equal(writes,writeCount);assert.deepEqual([...storage],exportSnapshot);
  c.pendingRestore={data:backup.data};c.performRestore();assert.equal(downloads.length,count);assert.match(feedback.textContent,/Quiz History/);assert.equal(writes,writeCount);assert.deepEqual([...storage],exportSnapshot);
 }
 // Null history and legacy optional fields retain compatibility.
 for(const value of [null,[],[{score:0,total:1,mistakes:[goneP[0]],completedAt:base.completedAt}]]){
  const result=c.validateBackupDocument({...backup,data:{...backup.data,[STORE.history]:value}});
  assert.deepEqual(clone(result.data[STORE.history]),value===null?null:value.map(entry=>({...entry,mistakes:[]})));
 }
 console.log(`Quiz History production Backup / Restore / Safety regression PASS: 6 attempts retained, 4 history + 9 Activity references removed, ${invalid.length} malformed histories rejected`);
}
main().catch(error=>{console.error(error);process.exitCode=1});
