'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {context:c,rows,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const plain=value=>JSON.parse(JSON.stringify(value)),hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const byId=new Map(dialogues.map(dialogue=>[dialogue.id,dialogue])),phraseById=new Map(phrases.map(phrase=>[phrase.id,phrase]));
const exclusions=plain(vm.runInContext('DIALOGUE_HIGHLIGHT_EXCLUSIONS',c));
const exclusionKeys=['d35|p262','d38|p346','d62|p400','d109|p806','d145|p912','d146|p874'];
assert.deepEqual(Object.keys(exclusions).sort(),exclusionKeys.sort());
Object.values(exclusions).forEach(reason=>assert.match(reason,/^SEMANTIC_MISMATCH: .+/));

let auto=0,explicit=0,excluded=0;
const partialTokens=[];
for(const row of rows){
  const dialogue=byId.get(row.dialogueId),textFor=range=>dialogue.lines[range.lineIndex][1];
  if(exclusions[row.dialogueId+'|'+row.phraseId]){assert.equal(row.ranges.length,0);excluded++;continue;}
  assert.ok(row.ranges.length,'unexplained zero highlight '+row.dialogueId+'/'+row.phraseId);
  if(row.ranges[0].source==='matcher')auto++;else explicit++;
  for(const range of row.ranges){
    const text=textFor(range);assert.equal(text.slice(range.start,range.end),range.text);
    assert.ok(Number.isInteger(range.start)&&range.start>=0&&range.end>range.start&&range.end<=text.length);
    const intentionalAffix=/^-/.test(row.headline);
    if(!intentionalAffix&&(/[A-Za-z]/.test(text[range.start-1]||'')||/[A-Za-z]/.test(text[range.end]||'')))partialTokens.push(`${row.dialogueId}|${row.phraseId}|${range.text}`);
  }
}
assert.equal(dialogues.length,326);assert.equal(rows.length,2217);
assert.deepEqual({auto,explicit,excluded},{auto:1963,explicit:248,excluded:6});
assert.deepEqual(partialTokens,[],'no production selected range may split a word token');
Object.keys(exclusions).forEach(key=>assert.ok(rows.some(row=>row.dialogueId+'|'+row.phraseId===key),'no stale exclusion'));

for(const dialogue of dialogues){
  const ranges=plain(c.dialoguePhraseMatchResults(dialogue,dialogue.phraseLinks.map(id=>phraseById.get(id))));
  for(let index=0;index<dialogue.lines.length;index++){
    const selected=plain(c.selectedDialogueMatches(ranges.filter(range=>range.lineIndex===index)));
    for(let n=1;n<selected.length;n++)assert.ok(selected[n-1].end<=selected[n].start,'no overlap/nesting');
  }
}
const nonS1=rows.filter(row=>byId.get(row.dialogueId).season!=='Season 1').map(row=>[row.dialogueId,row.phraseId,row.ranges.map(range=>[range.lineIndex,range.start,range.end,range.text,range.source])]);
assert.equal(nonS1.length,1340);assert.equal(hash(nonS1),'4d1f77d8caa9536e09894df58c2e59e344fc93b4d4e5346db9ab00df376bfef2','non-S1 matcher ranges match the reviewed Notion Dialogue synchronization and S3 cleanup implementation');

const expectedProductionRanges={
  'd50|p448':['handled'],
  'd74|p564':['pivot'],
  'd104|p706':['brat','brats'],
  'd115|p830':['pull','pulled'],
  'd144|p962':['bamboozled'],
  'd153|p994':['called']
};
for(const [key,expected] of Object.entries(expectedProductionRanges)){
  const [dialogueId,phraseId]=key.split('|'),row=rows.find(item=>item.dialogueId===dialogueId&&item.phraseId===phraseId);
  assert.deepEqual(row.ranges.map(range=>range.text),expected,key);
  assert.ok(row.ranges.every(range=>range.source==='matcher'),key+' common matcher');
}

const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c));
assert.equal(Object.keys(hints).length,280);assert.equal(Object.values(hints).filter(hint=>hint.overrideMatcher).length,179);
for(const stale of ['d56|p119','d56|p101','d203|p1289','d6|p102','d6|p95','d8|p43','d54|p55','d54|p126','d54|p118','d53|p65','d21|p174','d14|p177','d15|p192','d17|p202','d17|p250'])assert.ok(!hints[stale]);
for(const added of ['d182|p1163','d185|p2642','d186|p2432','d190|p433','d198|p1112','d198|p1928','d200|p3088','d201|p2291','d203|p1112','d19|p249','d22|p137','d210|p1903','d15|p802'])assert.ok(hints[added]?.overrideMatcher);
assert.ok(hints['d208|p2229']?.overrideMatcher);

const segments=(phrase,text,type='phrase')=>plain(c.allDialoguePhraseMatches(text,{phrase,type})).map(range=>text.slice(range.index,range.index+range.length));
const positives=[
 ['What if ~?','What if we test it with five people tomorrow?',['What if'],'phrase'],
 ['be all ears','I’m all ears',['I’m all ears'],'phrase'],
 ['take someone’s advice','take your advice',['take','advice'],'phrase'],
 ['hone a skill','honed your presentation skills',['honed','skills'],'phrase'],
 ['beat oneself up','beating yourself up',['beating','up'],'phrase'],
 ['get something out of one’s system','get it out of my system',['get','out of','system'],'phrase'],
 ['turn ~ down','turn the music down',['turn','down'],'phrase'],
 ['Is it true (that) ~?','Is it true you’re leaving?',['Is it true'],'phrase'],
 ['write something down','wrote the number down',['wrote','down'],'phrase'],
 ['fall for ~','fell for her',['fell for'],'phrase'],
 ['snap','I snapped.',['snapped'],'word'],
 ['sycophant','They are sycophants.',['sycophants'],'word'],
 ['handle ~','She handled it well.',['handled'],'phrase'],
 ['brat','They are brats.',['brats'],'word'],
 ['bamboozle','They bamboozled me.',['bamboozled'],'word'],
 ['call ~','She called dibs.',['called'],'word'],
 ['pull something','He pulled a fast one.',['pulled'],'word'],
 ['X it is','Friday it is.',['Friday it is.'],'phrase'],
 ["can't/couldn't resist","I couldn't resist.",["couldn't resist"],'phrase'],
 ['quit ~ing','I quit snacking.',['quit snacking'],'phrase'],
 ['pack up','Pack it up.',['Pack it up'],'phrasal verb'],
 ['put down ~','I put it down.',['put it down'],'phrasal verb'],
 ['Have you ever + past participle ~?','Have you ever tried Korean food?',['Have you ever tried'],'pattern'],
 ['can afford to ~','Can you afford to spend sixty dollars?',['Can you afford to'],'pattern'],
 ['not mind ~ing',"I don't mind eating there.",["don't mind eating"],'grammar'],
 ['forget to ~','I forgot to charge it.',['forgot to'],'pattern']
];
for(const [phrase,text,want,type] of positives)assert.deepEqual(segments(phrase,text,type),want,phrase);
const negatives=[
 ['I can’t say.','I can’t say I’m surprised.'],['register','registration desk'],
 ['Challenge extended','Challenge accepted.'],['Don’t “~” me','Don’t judge me.'],
 ['Way to go!','Way to put yourself out there.'],['draw someone a bath','I was running a bath.'],
 ['shame about ~','Shame on you.'],['call ~','callback'],['brat','bratwurst'],
 ['pivot','pivotal'],['sycophant','sycophantic'],
 ['X it is','This is it.'],["can't/couldn't resist",'I could resist.'],
 ['quit ~ing','This is quite interesting.'],['pack up','The package is up front.'],
 ['put down ~','The output went downward.'],['Have you ever + past participle ~?','Did you ever try it?'],
 ['can afford to ~','Can you force it?'],['not mind ~ing','I do mind eating there.'],
 ['forget to ~','I remember to charge it.']
];
for(const [phrase,text] of negatives)assert.deepEqual(segments(phrase,text),[],phrase);
for(const text of ['snapshot','snappish']){
  const dialogue={id:'snap-negative',phraseLinks:['p50'],lines:[['A',text]]};
  assert.deepEqual(plain(c.dialoguePhraseMatchResults(dialogue,[phraseById.get('p50')])),[],'snap word boundary');
}

console.log(`Highlight coverage: ${auto} auto, ${explicit} explicit, ${excluded} approved mismatches; 2,217 links, offsets, overlap and non-S1 integrity PASS`);
