const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8'),context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('js/dialogue-match-hints.js','utf8'),context);
vm.runInContext(fs.readFileSync('js/dialogue-highlight-matcher.js','utf8'),context);
vm.runInContext(source.split(/\r?\n/).filter(l=>/^const DIALOGUE_(INFLECTION|IRREGULAR|OPTIONAL)/.test(l)||/^function (dialoguePhrase|dialogueVerb|dialogueIrregular|dialoguePronoun|allDialogue|firstDialogue|dialogueExplicit|explicitDialogue|selectedDialogue)/.test(l)).join('\n'),context);
const sets=Array.from({length:9},(_,i)=>JSON.parse(fs.readFileSync(`data/season${i+1}.json`))),phrases=sets.flatMap(s=>s.phrases),dialogues=sets.flatMap(s=>s.dialogues),byId=new Map(phrases.map(p=>[p.id,p]));
const rows=dialogues.flatMap(d=>d.phraseLinks.map(id=>{const p=byId.get(id),ranges=context.dialoguePhraseMatchResults(d,[p]);return{dialogueId:d.id,phraseId:id,headline:p.phrase,ranges,explicit:!!context.dialogueExplicitMatchHint(d,p),lines:d.lines.map(l=>l[1])};}));
if(require.main===module){console.log(JSON.stringify({total:rows.length,hints:vm.runInContext('Object.keys(DIALOGUE_EXPLICIT_MATCH_HINTS).length',context),overrides:vm.runInContext('Object.values(DIALOGUE_EXPLICIT_MATCH_HINTS).filter(x=>x.overrideMatcher).length',context),misses:rows.filter(r=>!r.ranges.length)},null,2));}
module.exports={context,rows,phrases,dialogues};
