"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {context:c,phrases,dialogues}=require('../tools/audit-dialogue-highlight.cjs');
const fixture=require('./fixtures/friends-s2-dialogue-draft-compatibility.json'),plain=x=>JSON.parse(JSON.stringify(x));
const hints=plain(vm.runInContext('DIALOGUE_EXPLICIT_MATCH_HINTS',c)),key='d208|p2229';
assert.deepEqual(hints[key],{dialogueId:'d208',phraseId:'p2229',candidateLineIndex:9,highlightRanges:[{matchText:'pass along your message'}],overrideMatcher:true});
for(const stale of ['d56|p119','d56|p101','d203|p1289','d6|p102','d6|p95','d8|p43','d54|p55','d54|p126','d54|p118'])assert.ok(!hints[stale],'approved obsolete hint removed '+stale);
for(const added of ['d182|p1163','d185|p2642','d186|p2432','d190|p433','d198|p1112','d198|p1928','d200|p3088','d201|p2291','d203|p1112'])assert.ok(hints[added]?.overrideMatcher,'density technical hint '+added);
assert.ok(!Object.keys(hints).some(k=>k.startsWith('S2-SEED-')),'no temporary runtime identity');
let total=0,auto=0,existing=0,added=0;
for(const original of fixture.drafts){
 const d=original.id==='S2-SEED-004'?{...original,id:'d208'}:original;
 const linked=d.phraseLinks.map(id=>phrases.find(p=>p.id===id));assert.ok(linked.every(Boolean));
 const matches=c.dialoguePhraseMatchResults(d,linked),selected=d.lines.flatMap((_,i)=>c.selectedDialogueMatches(matches.filter(m=>m.lineIndex===i)));
 for(const r of d.realizations.filter(realization=>!['p2229','p189'].includes(realization.phraseId))){
  const ranges=selected.filter(m=>m.phraseId===r.phraseId&&m.lineIndex===r.turn-1);assert.ok(ranges.length,d.id+'/'+r.phraseId);
  ranges.forEach(m=>{const text=d.lines[m.lineIndex][1];assert.equal(text.slice(m.start,m.end),m.text);assert.ok(m.start>=0&&m.end<=text.length);assert.ok(!(/[A-Za-z]/.test(text[m.end-1]||'')&&/[A-Za-z]/.test(text[m.end]||'')),'no truncated token '+r.phraseId);});
  total++;if(ranges[0].source==='matcher')auto++;else if(r.phraseId==='p2229')added++;else existing++;
 }
}
assert.equal(fixture.drafts.length,17);assert.deepEqual({total,auto,existing,added},{total:43,auto:43,existing:0,added:0});
const productionD208=dialogues.find(dialogue=>dialogue.id==='d208'),productionP2229=phrases.find(phrase=>phrase.id==='p2229');
assert.deepEqual(plain(c.dialoguePhraseMatchResults(productionD208,[productionP2229])).map(range=>range.text),['pass along your message'],'rebased production override');
const productionD15=dialogues.find(dialogue=>dialogue.id==='d15'),productionP189=phrases.find(phrase=>phrase.id==='p189');
assert.deepEqual(plain(c.dialoguePhraseMatchResults(productionD15,[productionP189])).map(range=>range.text),['sold them out'],'rebased production override');
function segments(id,text){const d={id:'unrelated',phraseLinks:[id],lines:[['A',text]]};return plain(c.dialoguePhraseMatchResults(d,[phrases.find(p=>p.id===id)])).map(m=>text.slice(m.index,m.end));}
for(const [subject,verb] of [['I','am'],['you','are'],['he','is'],['she','is'],['we','are'],['they','are'],['I','was'],['they','were']])for(const [id,predicate,object] of [['p1485','allergic to','peanuts'],['p1700','sold out of','the small ones']]){const text=`${subject} ${verb} ${predicate} ${object}.`;assert.ok(segments(id,text).some(s=>s.startsWith(`${verb} ${predicate}`)),'existing legacy or template range');assert.deepEqual(plain(c.allDialoguePhraseMatches(text,phrases.find(p=>p.id===id))).map(r=>text.slice(r.index,r.index+r.length)),[`${verb} ${predicate}`],'template fixed anchors');}
for(const subject of ["I'm","you're","he's","she's","we're","they're"]){assert.deepEqual(segments('p1485',`${subject} allergic to peanuts.`),[`${subject} allergic to`]);assert.deepEqual(segments('p1700',`${subject} sold out of the small ones.`),[`${subject} sold out of`]);}
for(const form of ['clobber','clobbers','clobbered','clobbering'])assert.deepEqual(segments('p199',`They ${form}.`),[form]);
for(const form of ['clobberred','clobberring','clobberish','unclobbered','clobberation'])assert.deepEqual(segments('p199',form),[]);
assert.deepEqual(segments('p199',"I'm going to get clobbered."),['clobbered']);
assert.deepEqual(segments('p2229',"I'll pass along your message."),[],'override must not leak to another dialogue');
for(const [headline,text] of [['pass along a message','pass along your message'],['have a point','have your point'],['make a scene','make your scene'],['take a chance','take your chance']])assert.equal(c.allDialoguePhraseMatches(text,{phrase:headline,type:'phrase'}).length,0,'no general determiner replacement');
for(const [id,text] of [['p1485',"I'm allergic. To peanuts."],['p1700',"We're sold out. Of those."],['p1485',"I'm allergic to. Peanuts."],['p1700',"We're sold out of. Those."]])assert.deepEqual(segments(id,text),[],'no sentence-boundary slot');
assert.equal(dialogues.length,326);
console.log('S2 Draft compatibility: 43 unchanged legacy realizations plus 2 rebased production overrides; full tokens, boundaries and isolation PASS');
