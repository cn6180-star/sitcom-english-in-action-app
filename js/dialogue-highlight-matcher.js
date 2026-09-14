/* Conservative, offset-preserving template fallback. No semantic/synonym inference.
 * Legacy matches and reviewed explicit ranges retain precedence in app.js.
 */
const DialogueHighlightMatcher = (() => {
  const normalize = s => String(s).replace(/[’‘]/g, "'").toLowerCase();
  const contractions = {"can't":['can','not'],"cannot":['can','not'],"won't":['will','not'],"shan't":['shall','not']};
  function tokens(text) {
    const result = [];
    for (const m of String(text).matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g)) {
      const value = normalize(m[0]);
      let words = contractions[value];
      if (!words && /n't$/.test(value)) words = [value.slice(0,-3), 'not'];
      if (!words && /^(i|you|he|she|it|we|they|that|what|there)'(m|re|s|ve|ll|d)$/.test(value)) {
        const [subject, suffix] = value.split("'");
        words = [subject, {m:'am',re:'are',s:'is',ve:'have',ll:'will',d:'would'}[suffix]];
      }
      for (const word of words || [value]) result.push({word,start:m.index,end:m.index+m[0].length});
    }
    return result;
  }
  const verbs = {
    be:['am','is','are','was','were','been','being'], have:['has','had','having'],
    get:['gets','got','gotten','getting'], beat:['beats','beat','beaten','beating'],
    fit:['fits','fit','fitted','fitting'], hone:['hones','honed','honing'],
    take:['takes','took','taken','taking'], fall:['falls','fell','fallen','falling'],
    write:['writes','wrote','written','writing'], give:['gives','gave','given','giving'],
    put:['puts','put','putting'], turn:['turns','turned','turning'],
    pick:['picks','picked','picking'], keep:['keeps','kept','keeping'],
    stand:['stands','stood','standing'], show:['shows','showed','shown','showing'],
    pool:['pools','pooled','pooling'], push:['pushes','pushed','pushing'],
    spare:['spares','spared','sparing'], cross:['crosses','crossed','crossing'],
    wander:['wanders','wandered','wandering'], clobber:['clobbers','clobbered','clobbering'],
    snap:['snaps','snapped','snapping'], handle:['handles','handled','handling'],
    pull:['pulls','pulled','pulling'], bamboozle:['bamboozles','bamboozled','bamboozling'],
    call:['calls','called','calling']
  };
  const nouns = {sycophant:['sycophants'],brat:['brats']};
  const possessives = new Set(['my','your','his','her','our','their']);
  const reflexives = new Set(['myself','yourself','himself','herself','ourselves','yourselves','themselves']);
  // Modifier positions are grammatical anchors, not arbitrary insertions between words.
  const modifiers = {bent:['so'],hard:['so','too'],out:['way','somehow'],on:['already'],caught:['not'],credit:['some'],not:['just'],skill:['presentation']};
  function variants(headline) {
    let list = [normalize(headline)];
    for (let n=0;n<5 && list.some(x=>/\([^()]*\)/.test(x));n++) list = list.flatMap(x=> {
      const m=x.match(/\([^()]*\)/); return m ? [x.replace(m[0],m[0].slice(1,-1)),x.replace(m[0],' ')] : [x];
    });
    return list.flatMap(x=>x.split(/\s+\/\s+/)).flatMap(x=> {
      const m=x.match(/\b[a-z]+(?:\/[a-z]+)+\b/);
      return m ? m[0].split('/').map(v=>x.replace(m[0],v)) : [x];
    });
  }
  function templates(phrase) {
    const headline = typeof phrase === 'string' ? phrase : phrase.phrase;
    // Quoted-word-as-verb frames require evidence, not an arbitrary verb slot.
    if (/[“”"].*~/.test(headline)) return [];
    return variants(headline).flatMap(v=> {
      const raw = v.replace(/\.\.\.|…/g,' ~ ').replace(/\+\s*noun/g,' ~ ').match(/~|[a-z]+(?:'[a-z]+)?(?:-[a-z]+)*/g) || [];
      const literalSomething = /^did i miss something/.test(v) || /something of an item/.test(v);
      const pairSlots = /between a and b/.test(v);
      let parts = raw.flatMap((w,i)=> {
        if(w==='~' || pairSlots && (w==='b'||w==='a'&&i>0))return [{slot:'any'}];
        if(["one's","someone's","somebody's"].includes(w))return [{slot:'possessive'}];
        if(w==='oneself')return [{slot:'reflexive'}];
        if(['someone','somebody'].includes(w))return [{slot:'person'}];
        if(w==='something'&&!literalSomething)return [{slot:'any'}];
        return tokens(w).map(t=>({word:t.word}));
      });
      if(parts.filter(p=>p.word).length<2 && !(parts.length===1&&verbs[parts[0]?.word]))return [];
      const result=[parts];
      // Explicit particle + noun order only when the record itself demonstrates it.
      if(parts.length>3 && ['off','up','down'].includes(parts[1]?.word) &&
          [phrase.example1,phrase.example2,phrase.note].filter(Boolean).some(x=>normalize(x).includes(parts[0].word+' '+parts.slice(2).map(p=>p.word).join(' ')+' '+parts[1].word))) {
        result.push([parts[0],...parts.slice(2),parts[1]]);
      }
      return result;
    });
  }
  function wordMatches(expected,actual,index,parts) {
    if(expected===actual)return true;
    if(verbs[expected] && (index===0 || expected==='wander'))return verbs[expected].includes(actual);
    if(expected==='skill' && actual==='skills')return true;
    if(expected==='a' && actual==='an')return true;
    if(expected==='a' && parts[index+1]?.word==='skill' && possessives.has(actual))return true;
    if(expected==='a' && parts[index+1]?.word==='piece' && parts[index+2]?.word==='of' && parts[index+3]?.word==='cake' && actual==='no')return true;
    if(expected==='it' && index===0 && parts[1]?.word==='sucks' && ['this','that'].includes(actual))return true;
    // Subject number agreement in a negative frame; does not remove negation.
    return expected==='does' && actual==='do' && parts[index+1]?.word==='not';
  }
  function allowed(text, phrase, range) {
    const h=normalize(typeof phrase==='string'?phrase:phrase.phrase).trim();
    // A standalone refusal is not the introductory clause "can't say I'm surprised".
    if(/^i (?:can't|cannot|can not) say[.!?]?$/.test(h)) {
      return !/[A-Za-z]/.test(String(text).slice(range.index+range.length).split(/[.!?;\n]/)[0]);
    }
    return true;
  }
  function match(text,phrase) {
    const ts=tokens(text), output=[];
    const boundary=(a,b)=>a>0&&b<ts.length&&/[.!?;:\n]/.test(text.slice(ts[a-1].end,ts[b].start));
    for(const parts of templates(phrase)) {
      function walk(pi,ti,chosen,depth=0) {
        if(depth>100)return null;
        if(pi===parts.length)return {end:ti,chosen};
        if(ti>=ts.length)return null;
        const part=parts[pi];
        if(part.slot) {
          const last=pi===parts.length-1;
          const limit=['possessive','reflexive'].includes(part.slot)?1:6;
          for(let size=1;size<=limit&&ti+size<=ts.length;size++) {
            if(size>1 && boundary(ti+size-1,ti+size-1))break;
            const word=ts[ti].word;
            if(part.slot==='possessive'&&!possessives.has(word))break;
            if(part.slot==='reflexive'&&!reflexives.has(word))break;
            if(part.slot==='person') {
              const pronoun=/^(i|we|they|he|she|me|you|him|her|us|them|myself|yourself|himself|herself|ourselves|yourselves|themselves|someone|somebody)$/.test(word);
              const named=/^[A-Z]/.test(text.slice(ts[ti].start,ts[ti].end));
              const determiner=/^(a|an|the|my|your|his|her|our|their)$/.test(word);
              if(!(size===1&&(pronoun||named)||size>=2&&size<=3&&determiner))continue;
            }
            if(last)return {end:ti+size,chosen}; // Validate presence, never consume an entire sentence.
            const found=walk(pi+1,ti+size,chosen,depth+1);if(found)return found;
          }
          return null;
        }
        if(wordMatches(part.word,ts[ti].word,pi,parts)) {
          const variableArticle=part.word==='a'&&possessives.has(ts[ti].word);
          const found=walk(pi+1,ti+1,variableArticle?chosen:[...chosen,ts[ti]],depth+1);if(found)return found;
        }
        // At a known fixed position allow one audited modifier (not arbitrary adverbs).
        if(modifiers[part.word]?.includes(ts[ti].word)&&ts[ti+1]&&!boundary(ti+1,ti+1)) {
          if(wordMatches(part.word,ts[ti+1].word,pi,parts)) {
            // Negation is part of the answer; other modifiers remain visible.
            const extra=ts[ti].word==='not'?[ts[ti],ts[ti+1]]:[ts[ti+1]];
            const found=walk(pi+1,ti+2,[...chosen,...extra],depth+1);if(found)return found;
          }
        }
        // Be-fronted questions: "are you comfortable ...". Only subject pronouns.
        if(pi===1&&parts[0]?.word==='be'&&/^(i|you|he|she|it|we|they)$/.test(ts[ti].word))return walk(pi,ti+1,chosen,depth+1);
        return null;
      }
      for(let start=0;start<ts.length;start++) {
        const found=walk(0,start,[]);if(!found||!found.chosen.length)continue;
        // Reject matches whose fixed path crosses sentences (semicolon allowed only if present in headline).
        const h=typeof phrase==='string'?phrase:phrase.phrase;
        const whole=text.slice(ts[start].start,ts[found.end-1].end);
        if(/[.!?\n]/.test(whole)||(!h.includes(';')&&whole.includes(';')))continue;
        const ranges=[];
        for(const token of found.chosen) {
          const prev=ranges.at(-1);
          if(prev && token.start<=prev.end)prev.end=Math.max(prev.end,token.end);
          else if(prev && /^\s*$/.test(text.slice(prev.end,token.start)))prev.end=token.end;
          else ranges.push({start:token.start,end:token.end});
        }
        for(const r of ranges) {
          const candidate={index:r.start,length:r.end-r.start};
          if(allowed(text,phrase,candidate)&&!output.some(x=>x.index===candidate.index&&x.length===candidate.length))output.push(candidate);
        }
        start=found.end-1;
      }
      if(output.length)break; // First complete template, not a union of speculative alternatives.
    }
    return output;
  }
  // A legacy substring must not leave a suffix outside a word blank.
  // Expand only audited dictionary forms; reject unknown word-family prefixes.
  function completeWordRange(text,phrase,range) {
    if(/^-/.test(normalize(phrase?.phrase||'')))return range; // Intentional learning suffix, e.g. -wise.
    const token=Array.from(String(text).matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g)).find(m=>m.index<=range.index&&m.index+m[0].length>=range.index+range.length);
    if(!token)return range;
    const tokenValue=normalize(token[0]),headline=normalize(phrase?.phrase||''),headlineForms=[...(verbs[headline]||[]),...(nouns[headline]||[])];
    if(token.index===range.index&&token[0].length===range.length){
      if(phrase?.type==='word'&&headlineForms.length&&![headline,...headlineForms].includes(tokenValue))return null;
      return range;
    }
    const matched=normalize(String(text).slice(range.index,range.index+range.length));
    const allowed=[...(verbs[matched]||[]),...(nouns[matched]||[])];
    if(!allowed.includes(tokenValue))return null;
    return {index:token.index,length:token[0].length};
  }
  return Object.freeze({match,allowed,completeWordRange});
})();
