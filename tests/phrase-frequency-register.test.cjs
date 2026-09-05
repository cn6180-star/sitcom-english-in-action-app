"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const phrases=[];
for(let season=1;season<=9;season++){
  const data=JSON.parse(fs.readFileSync(path.join(root,"data",`season${season}.json`),"utf8"));
  phrases.push(...data.phrases);
}

assert.equal(phrases.length,1056);
assert.equal(new Set(phrases.map(phrase=>phrase.id)).size,1056);

const frequencies=new Set(["frequent","general","limited"]);
const registers=new Set(["casual","neutral","polite","formal","slang"]);
const usages=new Set(["日常的","知っておきたい","やや古め"]);
for(const phrase of phrases){
  assert.ok(frequencies.has(phrase.frequency),`${phrase.id} has invalid frequency`);
  assert.ok(registers.has(phrase.register),`${phrase.id} has invalid register`);
  assert.ok(usages.has(phrase.usage),`${phrase.id} has invalid usage`);
  const fields=Object.keys(phrase),usageIndex=fields.indexOf("usage");
  assert.deepEqual(fields.slice(usageIndex,usageIndex+3),["usage","frequency","register"],`${phrase.id} field order mismatch`);
}

const expected={
  p32:["limited","casual"],p104:["general","formal"],p169:["general","slang"],p323:["general","slang"],
  p443:["limited","casual"],p446:["general","slang"],p473:["limited","slang"],p481:["general","slang"],
  p504:["general","casual"],p582:["limited","casual"],p620:["limited","neutral"],p665:["general","slang"],
  p692:["limited","casual"],p696:["general","casual"],p747:["general","casual"],p815:["limited","casual"],
  p916:["limited","casual"],p933:["general","slang"],p941:["limited","casual"],p1018:["general","slang"]
};
const byId=new Map(phrases.map(phrase=>[phrase.id,phrase]));
for(const [id,[frequency,register]] of Object.entries(expected)){
  assert.equal(byId.get(id)?.frequency,frequency,`${id} frequency mismatch`);
  assert.equal(byId.get(id)?.register,register,`${id} register mismatch`);
}

console.log("phrase frequency and register tests passed");
