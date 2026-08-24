"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js","app.js"),"utf8");
const styles=fs.readFileSync(path.join(root,"css","style.css"),"utf8");
const helpers=source.slice(source.indexOf("function activityStudiedDates"),source.indexOf("function recordStudy"));
const context={Date,localDate:date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`};
vm.createContext(context);
vm.runInContext(`${helpers};this.result=recentStudyDays({dates:{"2026-08-18":{items:["phrase:a"]},"2026-08-20":{items:[]},"2026-08-22":{items:["dialogue:b"]},"2026-08-24":{items:["phrase:c"]}}},new Date(2026,7,24,8));`,context);

assert.deepEqual(Array.from(context.result,day=>day.key),["2026-08-18","2026-08-19","2026-08-20","2026-08-21","2026-08-22","2026-08-23","2026-08-24"]);
assert.deepEqual(Array.from(context.result,day=>day.label),["Tue","Wed","Thu","Fri","Sat","Sun","Mon"]);
assert.deepEqual(Array.from(context.result,day=>day.studied),[true,false,false,false,true,false,true]);
assert.equal(context.result.filter(day=>day.today).length,1);
assert.equal(context.result.at(-1).today,true);
assert.match(source,/class="streak-week"/);
assert.match(source,/day\.studied\?'🔥':'·'/);
assert.match(styles,/\.streak-week\{[^}]*grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
assert.match(styles,/\.streak-week-day\.today/);
assert.doesNotMatch(styles,/streak-week[^}]*animation/);
assert.doesNotMatch(source,/streakStampPending/);
assert.match(source,/animateToday=Boolean\(recent\.at\(-1\)\?\.studied\)/);
assert.match(source,/day\.today&&animateToday\?'streak-fire-flicker':''/);
assert.match(styles,/\.streak-fire-flicker\{font-size:23px;animation:streak-fire-flicker 1\.1s ease-in-out infinite;transform-origin:bottom center\}/);
assert.match(styles,/@keyframes streak-fire-flicker\{[^}]*transform:rotate\(0deg\) scale\(1\)/);
assert.match(styles,/@media \(prefers-reduced-motion:reduce\)\{\.streak-fire-flicker\{animation:none\}\}/);
assert.doesNotMatch(styles,/streak-fire-stamp/);

console.log("streak week tests passed");
