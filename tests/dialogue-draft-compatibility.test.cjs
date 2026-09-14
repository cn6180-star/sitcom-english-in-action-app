"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const fixture=require('./fixtures/friends-s2-dialogue-draft-compatibility.json'),plain=x=>JSON.parse(JSON.stringify(x));
const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c)),key='d208|p2229';
assert.equal(crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(hints).filter(([k])=>k!==key)))).digest('hex'),fixture.existingHintsSha256,'all 185 existing hints unchanged');
assert.deepEqual(hints[key],{dialogueId:'d208',phraseId:'p2229',candidateLineIndex:5,highlightRanges:[{matchText:'pass along your message'}],overrideMatcher:true});
assert.ok(!Object.keys(hints).some(k=>k.startsWith('S2-SEED-')),'no temporary runtime identity');
let total=0,auto=0,existing=0,added=0;
for(const original of fixture.drafts){
 const d=original.id==='S2-SEED-004'?{...original,id:'d208'}:original;
 const linked=d.phraseLinks.map(id=>phrases.find(p=>p.id===id));assert.ok(linked.every(Boolean));
 const matches=c.dialoguePhraseMatchResults(d,linked),selected=d.lines.flatMap((_,i)=>c.selectedDialogueMatches(matches.filter(m=>m.lineIndex===i)));
 for(const r of d.realizations){
  const ranges=selected.filter(m=>m.phraseId===r.phraseId&&m.lineIndex===r.turn-1);assert.ok(ranges.length,d.id+'/'+r.phraseId);
  ranges.forEach(m=>{const text=d.lines[m.lineIndex][1];assert.equal(text.slice(m.start,m.end),m.text);assert.ok(m.start>=0&&m.end<=text.length);assert.ok(!(/[A-Za-z]/.test(text[m.end-1]||'')&&/[A-Za-z]/.test(text[m.end]||'')),'no truncated token '+r.phraseId);});
  total++;if(ranges[0].source==='matcher')auto++;else if(r.phraseId==='p2229')added++;else existing++;
 }
}
assert.equal(fixture.drafts.length,17);assert.deepEqual({total,auto,existing,added},{total:45,auto:42,existing:2,added:1});
function segments(id,text){const d={id:'unrelated',phraseLinks:[id],lines:[['A',text]]};return plain(c.dialoguePhraseMatchResults(d,[phrases.find(p=>p.id===id)])).map(m=>text.slice(m.index,m.end));}
for(const [subject,verb] of [['I','am'],['you','are'],['he','is'],['she','is'],['we','are'],['they','are'],['I','was'],['they','were']])for(const [id,predicate,object] of [['p1485','allergic to','peanuts'],['p1700','sold out of','the small ones']]){const text=`${subject} ${verb} ${predicate} ${object}.`;assert.ok(segments(id,text).some(s=>s.startsWith(`${verb} ${predicate}`)),'existing legacy or template range');assert.deepEqual(plain(c.allDialoguePhraseMatches(text,phrases.find(p=>p.id===id))).map(r=>text.slice(r.index,r.index+r.length)),[`${verb} ${predicate}`],'template fixed anchors');}
for(const subject of ["I'm","you're","he's","she's","we're","they're"]){assert.deepEqual(segments('p1485',`${subject} allergic to peanuts.`),[`${subject} allergic to`]);assert.deepEqual(segments('p1700',`${subject} sold out of the small ones.`),[`${subject} sold out of`]);}
for(const form of ['clobber','clobbers','clobbered','clobbering'])assert.deepEqual(segments('p199',`They ${form}.`),[form]);
for(const form of ['clobberred','clobberring','clobberish','unclobbered','clobberation'])assert.deepEqual(segments('p199',form),[]);
assert.deepEqual(segments('p199',"I'm going to get clobbered."),['clobbered']);
assert.deepEqual(segments('p2229',"I'll pass along your message."),[],'override must not leak to another dialogue');
for(const [headline,text] of [['pass along a message','pass along your message'],['have a point','have your point'],['make a scene','make your scene'],['take a chance','take your chance']])assert.equal(c.allDialoguePhraseMatches(text,{phrase:headline,type:'phrase'}).length,0,'no general determiner replacement');
for(const [id,text] of [['p1485',"I'm allergic. To peanuts."],['p1700',"We're sold out. Of those."],['p1485',"I'm allergic to. Peanuts."],['p1700',"We're sold out of. Those."]])assert.deepEqual(segments(id,text),[],'no sentence-boundary slot');
assert.equal(dialogues.length,208);
console.log('S2 Draft compatibility: 17 drafts / 45 links = 42 auto + 2 existing overrides + 1 new; full tokens, boundaries and isolation PASS');
