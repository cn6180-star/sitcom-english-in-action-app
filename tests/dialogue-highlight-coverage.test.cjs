"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),c={};
const htmlSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(htmlSource.indexOf('js/dialogue-highlight-matcher.js')>0&&htmlSource.indexOf('js/dialogue-highlight-matcher.js')<htmlSource.indexOf('js/app.js'));
vm.createContext(c);
vm.runInContext(source.split(/\r?\n/).find(l=>l.startsWith('const esc='))+'\nthis.esc=esc;',c);
for(const f of ['dialogue-match-hints.js','dialogue-highlight-matcher.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c);
vm.runInContext(source.split(/\r?\n/).filter(l=>/^const DIALOGUE_(INFLECTION|IRREGULAR|OPTIONAL)/.test(l)||/^function (dialoguePhrase|dialogueVerb|dialogueIrregular|dialoguePronoun|allDialogue|firstDialogue|dialogueExplicit|explicitDialogue|selectedDialogue|highlightDialogueLine|esc\()/.test(l)).join('\n'),c);
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const data=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'data/season'+(i+1)+'.json'))));
const phrases=data.flatMap(s=>s.phrases),dialogues=data.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const fixture=require('./fixtures/dialogue-highlight-approved.json'),key=x=>x.dialogueId+'|'+x.phraseId,approved=new Map(fixture.items.map(x=>[key(x),x]));
assert.equal(approved.size,80);
const exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));
assert.deepEqual(Object.keys(exclusions).sort(),['d8|p117','d35|p262','d38|p346','d62|p400','d109|p806','d145|p912','d146|p874'].sort());
Object.values(exclusions).forEach(reason=>assert.match(reason,/^(BROKEN_LINK|SEMANTIC_MISMATCH): .+/));
let auto=0,explicit=0,excluded=0,links=0;
const protectedRows=[];
for(const d of dialogues)for(const id of d.phraseLinks){
 const p=byId.get(id);assert.ok(p);links++;
 const ranges=plain(c.dialoguePhraseMatchResults(d,[p])),f=approved.get(d.id+'|'+id);
 for(const r of ranges){const text=d.lines[r.lineIndex][1];assert.ok(Number.isInteger(r.start)&&r.start>=0&&r.end<=text.length&&r.end>r.start);assert.equal(text.slice(r.start,r.end),r.text);assert.equal(r.index,r.start);assert.equal(r.length,r.end-r.start);}
 if(exclusions[d.id+'|'+id]){assert.equal(ranges.length,0,'excluded sense stays empty');excluded++;}
 else {assert.ok(ranges.length,'Unexplained zero highlight '+d.id+'/'+id);if(ranges[0].source==='matcher')auto++;else explicit++;}
 if(f){assert.deepEqual(ranges.map(r=>({lineIndex:r.lineIndex,text:r.text})),f.ranges,'reviewed fixed spans '+key(f));if(f.classification==='VALID_VARIANT')assert.ok(ranges.every(r=>r.source==='matcher'));if(f.classification==='VALID_BUT_OVERRIDE')assert.ok(ranges.every(r=>r.source.startsWith('explicit')));}
 else if(d.id==='d57'&&id==='p199'){
  // Approved full-token correction: preserve the other 966 baseline results exactly.
  assert.deepEqual(ranges.map(m=>[m.lineIndex,m.start,m.end,m.text,m.source]),[[5,33,42,'clobbered','matcher']]);
  protectedRows.push([d.id,id,[[5,33,40,'clobber','matcher']]]);
 }else protectedRows.push([d.id,id,ranges.map(m=>[m.lineIndex,m.start,m.end,m.text,m.source])]);
}
assert.equal(dialogues.length,204);assert.equal(links,1047);assert.equal(auto,874);assert.equal(explicit,166);assert.equal(excluded,7);
// Freeze all 967 baseline results, not just the forced overrides.
assert.equal(hash(protectedRows),'1dc0eba43770b1d09a856f43453e319cca94bedb7ab4530b82c0ecaf09f51efb');
const hints=plain(vm.runInContext('Object.entries(DIALOGUE_EXPLICIT_MATCH_HINTS)',c)),oldHints=hints.filter(([k])=>k!=='S2-SEED-004|p2229'&&approved.get(k)?.classification!=='VALID_BUT_OVERRIDE');
assert.equal(oldHints.length,169);assert.equal(oldHints.filter(([,h])=>h.overrideMatcher).length,56);assert.equal(hash(oldHints),fixture.oldHintHash);assert.equal(hints.length,186);
const segments=(phrase,text)=>plain(c.allDialoguePhraseMatches(text,{phrase,type:'phrase'})).map(r=>text.slice(r.index,r.index+r.length));
const positives=[
 ['What if ~?','What if we test it with five people tomorrow?',['What if']],
 ['be all ears','I’m all ears',['I’m all ears']],
 ['take someone’s advice','take your advice',['take','advice']],
 ['hone a skill','honed your presentation skills',['honed','skills']],
 ['beat oneself up','beating yourself up',['beating','up']],
 ['get something out of one’s system','get it out of my system',['get','out of','system']],
 ['turn ~ down','turn the music down',['turn','down']],
 ['Is it true (that) ~?','Is it true you’re leaving?',['Is it true']],
 ['write something down','wrote the number down',['wrote','down']],
 ['fall for ~','fell for her',['fell for']],
 ['Did I miss something?','Did I miss something?',['Did I miss something']],
 ['What if ~?','What if it rains? What if it snows?',['What if','What if']]
];
for(const [p,t,want]of positives)assert.deepEqual(segments(p,t),want,p);
const negatives=[
 ['I can’t say.','I can’t say I’m surprised.'],['register','registration desk'],
 ['Challenge extended','Challenge accepted.'],['Don’t “~” me','Don’t judge me.'],
 ['Way to go!','Way to put yourself out there.'],['draw someone a bath','I was running a bath.'],
 ['shame about ~','Shame on you.'],['be all ears','I got all ears'],
 ['be all ears','I am inexplicably all ears'],['take someone’s advice','take your time. Advice matters'],
 ['turn ~ down','turn the music. Down the road'],['What if ~?','Somewhat iffy weather'],
 ['call shotgun','call it first']
];
for(const [p,t]of negatives)assert.deepEqual(segments(p,t),[],p);
const d44=dialogues.find(d=>d.id==='d44'),p408=byId.get('p408');
assert.deepEqual(plain(c.dialoguePhraseMatchResults(d44,[p408])).map(r=>r.text),['call it first']);
assert.equal(c.dialoguePhraseMatchResults({...d44,id:'not-approved'},[p408]).length,0);
const oldVisible=[];
for(const d of dialogues){
 const all=plain(c.dialoguePhraseMatchResults(d,d.phraseLinks.map(id=>byId.get(id))));
 for(let i=0;i<d.lines.length;i++){
  const text=d.lines[i][1],ranges=all.filter(r=>r.lineIndex===i),selected=plain(c.selectedDialogueMatches(ranges));
  for(const r of ranges)if(approved.has(d.id+'|'+r.phraseId))assert.ok(selected.some(m=>m.phraseId===r.phraseId&&m.start===r.start&&m.end===r.end),'new approved range must survive overlap selection');
  for(const r of selected)if(r.source.startsWith('explicit')&&!approved.has(d.id+'|'+r.phraseId))oldVisible.push([d.id,r.phraseId,i,r.start,r.end]);
  for(let n=1;n<selected.length;n++)assert.ok(selected[n-1].end<=selected[n].start,'no overlap/nesting');
  const html=c.highlightDialogueLine(text,ranges);
  assert.equal(html.replace(/<span class="highlight-phrase">|<\/span>/g,''),c.esc(text),'surrounding text preserved');
  assert.equal((html.match(/<span /g)||[]).length,selected.length);
 }
}
assert.equal(oldVisible.length,167);
assert.equal(hash(oldVisible),'da54fd796575cb54af5cc1c240a03189ce80033bb61e42caa6eeac50a4fed09f','existing explicit ranges remain visible after overlap selection');
assert.equal(hash(dialogues),'8e74658e50349dd6e3ed37dd4d05148b71d529c3cd692231d375c7ac14ab3989');
console.log('Highlight coverage: auto 874, explicit 166, excluded 7; 57/16 fixed spans, positive/negative, offsets and legacy integrity PASS');
