'use strict';
// Cross-season Dialogue links must resolve against the complete production DB,
// while older season-specific tests retain their original snapshot population.
const fs=require('node:fs'),path=require('node:path');
module.exports=new Set(Array.from({length:10},(_,i)=>
  JSON.parse(fs.readFileSync(path.join(__dirname,'../../data',`season${i+1}.json`),'utf8')).phrases
).flat().map(p=>p.id));
