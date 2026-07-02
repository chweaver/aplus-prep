// Build a single self-contained index.html: adaptive smart drill + practice
// exam mode (both driven by the same weakness-weighted selection algorithm),
// plus a per-family study reference parsed from data/generation-guide.md.
// Usage: node scripts/build-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { QUESTIONS } from "../data/questions.js";
import { FAMILIES } from "../data/families.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, "..", "index.html");

const familyMeta = {};
for (const f of FAMILIES) familyMeta[f.key] = { domain: f.domain, tier: f.tier };

// ---- parse the generation guide into a study reference ----
const guide = readFileSync(join(__dirname, "..", "data", "generation-guide.md"), "utf8");
const DOMAIN_TITLES = {
  "Domain 1": "D1 General Security Concepts",
  "Domain 2": "D2 Threats, Vulnerabilities, Mitigations",
  "Domain 3": "D3 Security Architecture",
  "Domain 4": "D4 Security Operations",
  "Domain 5": "D5 Program Management and Oversight",
};
const reference = [];
let curDomain = null;
for (const line of guide.split("\n")) {
  const dm = line.match(/^## (Domain \d)/);
  if (dm) { curDomain = DOMAIN_TITLES[dm[1]]; continue; }
  const fm = line.match(/^- \*\*([a-z0-9-]+)\*\*(?:\s*\((?:PRIORITY|HIGH)\))?:\s*(.*)$/);
  if (fm && curDomain) {
    const key = fm[1];
    if (!familyMeta[key]) continue;
    const rest = fm[2];
    const ti = rest.search(/Tell(?:\s*\(ORDER matters\))?:/);
    const siblings = (ti >= 0 ? rest.slice(0, ti) : rest).trim().replace(/[.;]\s*$/, "");
    const tell = ti >= 0 ? rest.slice(ti).trim() : "";
    reference.push({ key, domain: curDomain, tier: familyMeta[key].tier, siblings, tell });
  }
}
const missing = FAMILIES.filter((f) => !reference.some((r) => r.key === f.key)).map((f) => f.key);
if (missing.length) console.error("WARNING: families missing from reference:", missing.join(", "));

const DATA = JSON.stringify({ questions: QUESTIONS, families: familyMeta, reference });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#111318" />
<title>Security+ SY0-701 Prep</title>
<style>
  :root{
    --page:#111318; --card:#1b1e27; --option:#242836; --border:#2f3445;
    --text:#e8eaf1; --muted:#8a8fa3; --primary:#424cf7;
    --correct:#4ade80; --correct-bg:#173423; --wrong:#f87171; --wrong-bg:#3a1d1d;
    --amber:#f5c451;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    background:var(--page); color:var(--text);
    font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased; padding-bottom:env(safe-area-inset-bottom);
  }
  #tally{
    position:sticky; top:0; z-index:10; background:rgba(17,19,24,.96);
    backdrop-filter:blur(6px); border-bottom:1px solid var(--border);
    padding:12px 16px; padding-top:max(12px,env(safe-area-inset-top));
    display:flex; align-items:center; justify-content:space-between; gap:10px;
  }
  #hleft{font-weight:700; font-size:15px; letter-spacing:.2px; white-space:nowrap}
  #hleft.warn{color:var(--wrong)}
  #hright{color:var(--muted); font-weight:600; white-space:nowrap}
  #bar{height:4px; background:var(--option); border-radius:3px; overflow:hidden; flex:1}
  #bar>div{height:100%; width:0; background:var(--primary); transition:width .25s ease}
  .hbtn{
    background:transparent; color:var(--muted); border:1px solid var(--border);
    border-radius:8px; padding:6px 10px; font-size:13px; font-weight:600; cursor:pointer;
    -webkit-tap-highlight-color:transparent; flex:none;
  }
  main{max-width:520px; margin:0 auto; padding:16px}
  .card{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:18px; margin-top:8px}
  .meta{color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; display:flex; justify-content:space-between; gap:8px}
  .q{font-size:18px; font-weight:600; margin:0 0 16px}
  .opts{display:flex; flex-direction:column; gap:10px}
  .opt{
    -webkit-tap-highlight-color:transparent; text-align:left; width:100%;
    background:var(--option); color:var(--text); border:1px solid var(--border);
    border-radius:12px; padding:15px 16px; font-size:16px; cursor:pointer;
    display:flex; gap:12px; align-items:flex-start; min-height:52px; transition:border-color .12s,background .12s;
  }
  .opt .k{font-weight:700; color:var(--muted); flex:none; width:18px}
  .opt:active{border-color:var(--primary)}
  .opt.selected{border-color:var(--primary); background:#20264a}
  .opt.selected .k{color:#9aa1ff}
  .opt.correct{background:var(--correct-bg); border-color:var(--correct)}
  .opt.correct .k{color:var(--correct)}
  .opt.wrong{background:var(--wrong-bg); border-color:var(--wrong)}
  .opt.wrong .k{color:var(--wrong)}
  .opt.dim{opacity:.55}
  .opt[disabled]{cursor:default}
  .expl{margin-top:16px; padding:14px 16px; border-radius:12px; border:1px solid var(--border); background:#161922; font-size:15px}
  .expl.correct{border-color:var(--correct)}
  .expl.wrong{border-color:var(--wrong)}
  .expl .verdict{font-weight:700; margin-bottom:6px}
  .expl.correct .verdict{color:var(--correct)}
  .expl.wrong .verdict{color:var(--wrong)}
  .expl .tell{color:var(--muted); display:block; margin-top:6px}
  .actions{margin-top:16px; display:flex; gap:10px}
  button.primary{
    background:var(--primary); color:#fff; border:none; border-radius:12px;
    padding:15px 18px; font-size:16px; font-weight:700; cursor:pointer; flex:1; min-height:52px;
    -webkit-tap-highlight-color:transparent;
  }
  button.primary:active{filter:brightness(1.12)}
  button.ghost{
    background:transparent; color:var(--text); border:1px solid var(--border);
    border-radius:12px; padding:15px 18px; font-size:16px; font-weight:600; cursor:pointer; flex:1; min-height:52px;
    -webkit-tap-highlight-color:transparent;
  }
  button.ghost.flagged{border-color:var(--amber); color:var(--amber)}
  h1.big{font-size:22px; margin:4px 0 2px}
  .bignum{font-size:40px; font-weight:800; margin:6px 0}
  .sub{color:var(--muted); margin-bottom:16px}
  table{width:100%; border-collapse:collapse; font-size:14px}
  th,td{text-align:left; padding:8px 6px; border-bottom:1px solid var(--border)}
  th{color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.06em}
  td.num{text-align:right; font-variant-numeric:tabular-nums}
  .accbar{height:6px; border-radius:4px; background:var(--option); overflow:hidden; margin-top:4px}
  .accbar>div{height:100%}
  .link{color:var(--muted); text-decoration:underline; cursor:pointer; font-size:13px; background:none; border:none; padding:0}
  .foot{margin-top:22px; display:flex; justify-content:space-between; align-items:center}
  .hint{color:var(--muted); font-size:12px; margin-top:10px; text-align:center}
  /* home */
  .modebtn{display:flex; flex-direction:column; align-items:flex-start; gap:2px; width:100%;
    background:var(--option); color:var(--text); border:1px solid var(--border); border-radius:14px;
    padding:16px; font-size:17px; font-weight:700; cursor:pointer; margin-top:10px; text-align:left;
    -webkit-tap-highlight-color:transparent;}
  .modebtn small{color:var(--muted); font-weight:500; font-size:13px}
  .modebtn.exam{border-color:var(--primary)}
  .seglabel{color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; margin-top:16px; font-weight:700}
  .seg{display:flex; gap:8px; margin-top:8px}
  .seg button{flex:1; background:var(--option); color:var(--muted); border:1px solid var(--border);
    border-radius:10px; padding:11px 10px; font-size:14px; font-weight:700; cursor:pointer;
    -webkit-tap-highlight-color:transparent;}
  .seg button.on{border-color:var(--primary); color:var(--text); background:#20264a}
  .statline{color:var(--muted); font-size:13px; margin-top:14px}
  .exhist{margin-top:6px; font-size:13px; color:var(--muted)}
  .exhist b.pass{color:var(--correct)} .exhist b.fail{color:var(--wrong)}
  .badge{display:inline-block; padding:3px 10px; border-radius:999px; font-size:13px; font-weight:800; letter-spacing:.04em}
  .badge.pass{background:var(--correct-bg); color:var(--correct); border:1px solid var(--correct)}
  .badge.fail{background:var(--wrong-bg); color:var(--wrong); border:1px solid var(--wrong)}
  /* exam bottom nav + grid */
  #examnav{position:fixed; left:0; right:0; bottom:0; z-index:12;
    background:rgba(17,19,24,.97); border-top:1px solid var(--border);
    padding:10px 16px calc(10px + env(safe-area-inset-bottom));
    display:none; gap:10px; justify-content:space-between;}
  #examnav.show{display:flex}
  #examnav button{min-height:46px; padding:10px 14px; flex:1}
  #grid{position:fixed; inset:0; z-index:22; background:var(--page); display:none; overflow-y:auto}
  #grid.open{display:block}
  .gridbody{max-width:520px; margin:0 auto; padding:16px; padding-bottom:40px}
  .gridwrap{display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-top:14px}
  .gcell{aspect-ratio:1; border-radius:10px; border:1px solid var(--border); background:var(--option);
    color:var(--text); font-size:14px; font-weight:700; cursor:pointer; -webkit-tap-highlight-color:transparent;}
  .gcell.answered{background:#20264a; border-color:var(--primary)}
  .gcell.flagged{border-color:var(--amber); color:var(--amber)}
  .gcell.cur{outline:2px solid #fff}
  /* reference overlay */
  #ref{position:fixed; inset:0; z-index:20; background:var(--page); display:none; overflow-y:auto; -webkit-overflow-scrolling:touch;}
  #ref.open{display:block}
  .ovhead{position:sticky; top:0; background:rgba(17,19,24,.96); backdrop-filter:blur(6px);
    border-bottom:1px solid var(--border); padding:12px 16px; padding-top:max(12px,env(safe-area-inset-top));
    display:flex; justify-content:space-between; align-items:center; z-index:21; gap:12px;}
  .ovhead h1{font-size:16px; margin:0}
  .ovclose{background:var(--primary); color:#fff; border:none; border-radius:8px;
    padding:8px 14px; font-size:14px; font-weight:700; cursor:pointer; flex:none;
    -webkit-tap-highlight-color:transparent;}
  #ref .refbody{max-width:520px; margin:0 auto; padding:8px 16px 40px}
  #refsearch{width:100%; margin:10px 0 4px; padding:12px 14px; font-size:16px;
    background:var(--card); color:var(--text); border:1px solid var(--border); border-radius:10px;}
  .refdom{color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; margin:20px 0 6px; font-weight:700}
  .reffam{background:var(--card); border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-bottom:10px}
  .reffam h2{font-size:15px; margin:0 0 4px; display:flex; align-items:center; gap:6px; flex-wrap:wrap}
  .reffam .star{color:var(--amber); font-size:12px; font-weight:600}
  .reffam .sib{font-size:13px; color:var(--text); opacity:.92; margin-bottom:6px}
  .reffam .tell{font-size:13px; color:var(--muted)}
  .pad-bottom{padding-bottom:90px}
</style>
</head>
<body>
  <div id="tally">
    <button id="homebtn" class="hbtn" type="button" style="display:none">Home</button>
    <span id="hleft">SY0-701</span>
    <div id="bar"><div></div></div>
    <span id="hright"></span>
    <button id="refbtn" class="hbtn" type="button">Reference</button>
  </div>
  <main id="app"></main>

  <div id="examnav">
    <button class="ghost" id="exprev">Prev</button>
    <button class="ghost" id="exflag">Flag</button>
    <button class="ghost" id="exgrid">1/90</button>
    <button class="primary" id="exnext">Next</button>
  </div>

  <div id="grid">
    <div class="ovhead"><h1>Questions</h1><button class="ovclose" id="gridclose">Close</button></div>
    <div class="gridbody">
      <div class="hint" style="text-align:left">Blue = answered, amber = flagged. Tap to jump.</div>
      <div class="gridwrap" id="gridwrap"></div>
      <div class="actions"><button class="primary" id="gridsubmit">Submit exam</button></div>
    </div>
  </div>

  <div id="ref">
    <div class="ovhead"><h1>Twin-term reference</h1><button class="ovclose" id="refclose">Close</button></div>
    <div class="refbody">
      <input id="refsearch" type="search" placeholder="Filter families and terms" autocomplete="off" />
      <div id="reflist"></div>
    </div>
  </div>

<script id="data" type="application/json">${DATA}</script>
<script>
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("data").textContent);
  var ALL = DATA.questions;
  var REF = DATA.reference || [];
  var LETTERS = ["A","B","C","D"];
  var STORE_KEY = "secplus-drill-stats-v1";
  var DRILL_LEN = 25;
  var EXAM_QUOTA = {D1:11, D2:20, D3:16, D4:25, D5:18}; // official weights of 90
  var EXAM_MS = 90*60*1000;
  var PASS_SCALED = 750;

  // ---------- stats (v2 with v1 migration) ----------
  function loadStats(){
    var s;
    try{ s = JSON.parse(localStorage.getItem(STORE_KEY)); }catch(e){ s=null; }
    if(!s) s = {v:2, seq:0, perQuestion:{}, perFamily:{}, exams:[]};
    if(!s.v){ // migrate v1 {perQuestion:{id:{attempts,correct}}, perFamily}
      var pq={}, k;
      for(k in s.perQuestion||{}){ var o=s.perQuestion[k]; pq[k]={a:o.attempts||0,c:o.correct||0,s:0,last:0}; }
      var pf={};
      for(k in s.perFamily||{}){ var f=s.perFamily[k]; pf[k]={a:f.attempts||0,c:f.correct||0}; }
      s = {v:2, seq:0, perQuestion:pq, perFamily:pf, exams:[]};
    }
    s.exams = s.exams||[];
    return s;
  }
  function saveStats(s){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch(e){} }
  function getPref(){ var s=loadStats(); return (s.pref&&s.pref.feedback)||"instant"; }
  function setPref(v){ var s=loadStats(); s.pref=s.pref||{}; s.pref.feedback=v; saveStats(s); }
  function recordStat(q, correct){
    var s = loadStats();
    s.seq = (s.seq||0)+1;
    var pq = s.perQuestion[q.id] || {a:0,c:0,s:0,last:0};
    pq.a++; if(correct){ pq.c++; pq.s=(pq.s||0)+1; } else { pq.s=0; }
    pq.last=s.seq; s.perQuestion[q.id]=pq;
    var pf = s.perFamily[q.family] || {a:0,c:0};
    pf.a++; if(correct) pf.c++; s.perFamily[q.family]=pf;
    saveStats(s);
  }

  // ---------- adaptive selection ----------
  // Weight = how much this question deserves to be served next.
  // missed last time > never seen > shaky > solid > mastered; boosted for weak families,
  // damped if seen very recently.
  function weightFor(q, stats){
    var pq = stats.perQuestion[q.id];
    var w;
    if(!pq || pq.a===0) w=3;        // unseen
    else if(pq.s===0)   w=4;        // missed most recently
    else if(pq.s===1)   w=2;        // answered right once since last miss
    else if(pq.s===2)   w=1;        // getting solid
    else                w=0.4;      // mastered: keep a small maintenance chance
    var pf = stats.perFamily[q.family];
    if(pf && pf.a>=2){
      var acc = pf.c/pf.a;
      if(acc<0.5) w*=2; else if(acc<0.8) w*=1.4;
    }
    if(pq && (stats.seq - pq.last) < 40) w*=0.5;  // just saw it; back off
    return w;
  }
  // Weighted sample without replacement. familyDamp<1 spreads picks across families
  // so one family cannot hog the quota (thoroughness).
  function adaptivePick(pool, n, familyDamp){
    var stats = loadStats();
    var items = pool.slice(), picked=[], mult={};
    while(picked.length<n && items.length){
      var total=0, ws=new Array(items.length), i;
      for(i=0;i<items.length;i++){
        var w = weightFor(items[i], stats) * (mult[items[i].family]||1);
        ws[i]=w; total+=w;
      }
      var r=Math.random()*total, idx=items.length-1;
      for(i=0;i<items.length;i++){ r-=ws[i]; if(r<=0){ idx=i; break; } }
      var q=items.splice(idx,1)[0];
      picked.push(q);
      if(familyDamp) mult[q.family]=(mult[q.family]||1)*familyDamp;
    }
    return picked;
  }
  function buildExamSet(){
    var byDom={D1:[],D2:[],D3:[],D4:[],D5:[]};
    ALL.forEach(function(q){ if(byDom[q.domain]) byDom[q.domain].push(q); });
    var set=[];
    for(var d in EXAM_QUOTA) set=set.concat(adaptivePick(byDom[d], EXAM_QUOTA[d], 0.6));
    return shuffle(set);
  }

  function shuffle(a){
    a=a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function mkItem(q){
    var idxs=shuffle([0,1,2,3]);
    return {q:q, opts:idxs.map(function(i){return q.options[i];}), correctDisplay:idxs.indexOf(q.correctIndex),
            answered:false, correct:null, chosen:-1, flagged:false};
  }
  function familyLabel(key){ return key.replace(/-/g," "); }

  // ---------- header ----------
  var elL=document.getElementById("hleft"), elR=document.getElementById("hright"),
      elBar=document.querySelector("#bar>div"), elHome=document.getElementById("homebtn"),
      examNav=document.getElementById("examnav");
  function header(left, right, frac, warn){
    elL.textContent=left; elL.className=warn?"warn":"";
    elR.textContent=right; elBar.style.width=(100*(frac||0))+"%";
  }

  // ---------- state ----------
  var mode="home", session=null, exam=null, timerId=null;

  function go(m){
    mode=m;
    elHome.style.display = m==="home" ? "none":"";
    var deferredExam = m==="exam" && exam && !exam.instant;
    examNav.classList.toggle("show", deferredExam);
    document.body.classList.toggle("pad-bottom", deferredExam);
    if(m!=="exam" && timerId){ clearInterval(timerId); timerId=null; }
  }
  elHome.addEventListener("click", function(){
    if(mode==="exam" && !exam.submitted){
      if(!confirm("Abandon this exam? Nothing will be scored.")) return;
    }
    showHome();
  });

  // ---------- home ----------
  function showHome(){
    go("home");
    var s=loadStats();
    var seen=0, mastered=0;
    ALL.forEach(function(q){ var pq=s.perQuestion[q.id]; if(pq&&pq.a>0){ seen++; if(pq.s>=3) mastered++; } });
    header("SY0-701","",0);
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<h1 class="big">Security+ SY0-701 Prep</h1>';
    h+='<div class="sub">Adaptive twin-term training. The engine serves what you miss.</div>';
    var fb=getPref();
    var fbTxt = fb==="instant" ? "instant feedback" : "feedback at the end";
    h+='<button class="modebtn exam" id="m-exam">Practice exam<small>90 questions \\u00b7 90 minutes \\u00b7 real domain weights \\u00b7 adaptive selection \\u00b7 scored vs 750 \\u00b7 '+fbTxt+'</small></button>';
    h+='<button class="modebtn" id="m-drill">Smart drill<small>'+DRILL_LEN+' questions the algorithm thinks you need most \\u00b7 '+fbTxt+'</small></button>';
    h+='<button class="modebtn" id="m-stream">Full stream<small>All '+ALL.length+' questions, shuffled \\u00b7 '+fbTxt+'</small></button>';
    h+='<div class="seglabel">Question feedback</div>';
    h+='<div class="seg">';
    h+='<button id="fb-instant" class="'+(fb==="instant"?"on":"")+'">Instant</button>';
    h+='<button id="fb-end" class="'+(fb==="end"?"on":"")+'">At the end</button>';
    h+='</div>';
    h+='<div class="hint" style="text-align:left;margin-top:6px">Applies everywhere. Instant grades each answer as you tap it; at the end waits until the round or exam is submitted (realistic exam simulation).</div>';
    h+='<div class="statline">Progress: '+seen+'/'+ALL.length+' seen \\u00b7 '+mastered+' mastered (3+ streak)</div>';
    if(s.exams.length){
      h+='<div class="exhist">Exams: ';
      h+=s.exams.slice(-5).map(function(e){
        return '<b class="'+(e.scaled>=PASS_SCALED?"pass":"fail")+'">'+e.scaled+'</b>';
      }).join(" \\u00b7 ");
      h+=' <span style="opacity:.7">(pass '+PASS_SCALED+')</span></div>';
    }
    h+='<div class="foot"><span class="hint" style="margin:0;text-align:left">Stats saved on this device</span><button class="link" id="reset">reset stats</button></div>';
    h+='</div>';
    app.innerHTML=h;
    document.getElementById("m-exam").addEventListener("click", startExam);
    document.getElementById("m-drill").addEventListener("click", function(){ startDrill(adaptivePick(ALL, DRILL_LEN, 0.75), "Smart drill"); });
    document.getElementById("m-stream").addEventListener("click", function(){ startDrill(shuffle(ALL), "Full stream"); });
    document.getElementById("fb-instant").addEventListener("click", function(){ setPref("instant"); showHome(); });
    document.getElementById("fb-end").addEventListener("click", function(){ setPref("end"); showHome(); });
    document.getElementById("reset").addEventListener("click", function(){
      if(confirm("Erase all saved stats on this device?")){ try{ localStorage.removeItem(STORE_KEY); }catch(e){} showHome(); }
    });
    window.scrollTo(0,0);
  }

  // ---------- drill (instant or end-of-round feedback per preference) ----------
  function startDrill(pool, label){
    go("drill");
    session={label:label, deferred:getPref()==="end", items:pool.map(mkItem), pos:0, correctCount:0, answeredCount:0, missed:[]};
    if(session.deferred) renderDeferredQ(); else renderDrill();
  }
  // deferred variant: select an answer, no verdict until the round is done
  function renderDeferredQ(){
    header(session.label, session.pos+"/"+session.items.length+" answered", session.pos/session.items.length);
    if(session.pos>=session.items.length) return finishDeferred();
    var it=session.items[session.pos], q=it.q;
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<div class="meta"><span>'+q.domain+' \\u00b7 '+familyLabel(q.family)+'</span><span>Q'+(session.pos+1)+' of '+session.items.length+'</span></div>';
    h+='<p class="q"></p><div class="opts">';
    for(var i=0;i<4;i++) h+='<button class="opt'+(it.chosen===i?" selected":"")+'" data-i="'+i+'"><span class="k">'+LETTERS[i]+'</span><span class="t"></span></button>';
    h+='</div><div class="actions"><button class="primary" id="dnext"'+(it.chosen>=0?'':' disabled style="opacity:.5"')+'>'+(session.pos+1>=session.items.length?"Finish round":"Next")+'</button></div></div>';
    app.innerHTML=h;
    app.querySelector(".q").textContent=q.question;
    var btns=app.querySelectorAll(".opt");
    for(var j=0;j<4;j++){
      btns[j].querySelector(".t").textContent=it.opts[j];
      btns[j].addEventListener("click", function(e){
        it.chosen=parseInt(e.currentTarget.getAttribute("data-i"),10);
        var bs=document.querySelectorAll(".opt");
        for(var k=0;k<bs.length;k++) bs[k].classList.toggle("selected", parseInt(bs[k].getAttribute("data-i"),10)===it.chosen);
        var nx=document.getElementById("dnext");
        nx.removeAttribute("disabled"); nx.style.opacity="";
      });
    }
    document.getElementById("dnext").addEventListener("click", function(){
      if(it.chosen<0) return;
      session.pos++; renderDeferredQ();
    });
    window.scrollTo(0,0);
  }
  function finishDeferred(){
    session.items.forEach(function(it){
      it.answered=true; it.correct=(it.chosen===it.correctDisplay);
      session.answeredCount++;
      if(it.correct) session.correctCount++; else session.missed.push(it.q.id);
      recordStat(it.q, it.correct);
    });
    renderDrillEnd();
  }
  function drillHeader(){
    var t=session.items.length, a=session.answeredCount;
    var pct=a?Math.round(session.correctCount/a*100):0;
    header(session.correctCount+"/"+a+" \\u00b7 "+t+" total", pct+"%", session.pos/t);
  }
  function renderDrill(){
    drillHeader();
    if(session.pos>=session.items.length) return renderDrillEnd();
    var it=session.items[session.pos], q=it.q;
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<div class="meta"><span>'+q.domain+' \\u00b7 '+familyLabel(q.family)+'</span><span>Q'+(session.pos+1)+' of '+session.items.length+'</span></div>';
    h+='<p class="q"></p><div class="opts">';
    for(var i=0;i<4;i++) h+='<button class="opt" data-i="'+i+'"><span class="k">'+LETTERS[i]+'</span><span class="t"></span></button>';
    h+='</div><div id="feedback"></div></div>';
    app.innerHTML=h;
    app.querySelector(".q").textContent=q.question;
    var btns=app.querySelectorAll(".opt");
    for(var j=0;j<4;j++){ btns[j].querySelector(".t").textContent=it.opts[j]; btns[j].addEventListener("click", onDrillAnswer); }
    window.scrollTo(0,0);
  }
  function onDrillAnswer(e){
    var it=session.items[session.pos];
    if(it.answered) return;
    var chosen=parseInt(e.currentTarget.getAttribute("data-i"),10);
    it.answered=true; it.correct=(chosen===it.correctDisplay);
    session.answeredCount++;
    if(it.correct) session.correctCount++; else session.missed.push(it.q.id);
    recordStat(it.q, it.correct);
    var btns=document.querySelectorAll(".opt");
    for(var i=0;i<btns.length;i++){
      var bi=parseInt(btns[i].getAttribute("data-i"),10);
      btns[i].setAttribute("disabled","");
      if(bi===it.correctDisplay) btns[i].classList.add("correct");
      else if(bi===chosen) btns[i].classList.add("wrong");
      else btns[i].classList.add("dim");
    }
    var fb=document.getElementById("feedback");
    fb.appendChild(explBlock(it.q, it.correct));
    var act=document.createElement("div"); act.className="actions";
    var next=document.createElement("button"); next.className="primary";
    next.textContent=(session.pos+1>=session.items.length)?"See results":"Next";
    next.addEventListener("click", function(){ session.pos++; renderDrill(); });
    act.appendChild(next); fb.appendChild(act);
    drillHeader(); next.focus();
  }
  function explBlock(q, wasCorrect){
    var expl=q.explanation, ti=expl.indexOf("The tell:");
    var main=ti>=0?expl.slice(0,ti).trim():expl, tell=ti>=0?expl.slice(ti):"";
    var wrap=document.createElement("div");
    wrap.className="expl "+(wasCorrect===null?"":(wasCorrect?"correct":"wrong"));
    if(wasCorrect!==null){ var v=document.createElement("div"); v.className="verdict"; v.textContent=wasCorrect?"Correct":"Wrong"; wrap.appendChild(v); }
    var m=document.createElement("div"); m.textContent=main; wrap.appendChild(m);
    if(tell){ var t=document.createElement("span"); t.className="tell"; t.textContent=tell; wrap.appendChild(t); }
    return wrap;
  }
  function renderDrillEnd(){
    var app=document.getElementById("app");
    var total=session.items.length, correct=session.correctCount;
    var pct=total?Math.round(correct/total*100):0;
    var byFam={};
    session.items.forEach(function(it){
      var k=it.q.family; byFam[k]=byFam[k]||{n:0,c:0}; byFam[k].n++; if(it.correct) byFam[k].c++;
    });
    var rows=Object.keys(byFam).map(function(k){ var o=byFam[k]; return {key:k,n:o.n,c:o.c,acc:o.c/o.n}; })
      .sort(function(a,b){ return a.acc-b.acc||b.n-a.n; });
    var h='<div class="card">';
    h+='<h1 class="big">'+session.label+' complete</h1>';
    h+='<div class="bignum">'+correct+' / '+total+'</div>';
    h+='<div class="sub">'+pct+'% correct \\u00b7 '+session.missed.length+' to review</div>';
    h+='<div class="actions">';
    h+='<button class="primary" id="again">New smart drill</button>';
    h+='<button class="ghost" id="retry"'+(session.missed.length?'':' disabled style="opacity:.5"')+'>Retry missed ('+session.missed.length+')</button>';
    h+='</div>';
    if(session.deferred && session.missed.length){
      h+='<div class="actions"><button class="ghost" id="rvwdrill">Review missed answers ('+session.missed.length+')</button></div>';
    }
    h+='<h1 style="font-size:16px;margin-top:22px">Weakest families first</h1>';
    h+='<table><thead><tr><th>Family</th><th class="num">Score</th><th class="num">Acc</th></tr></thead><tbody>';
    rows.forEach(function(r){
      var color=r.acc>=0.8?'var(--correct)':(r.acc>=0.5?'var(--amber)':'var(--wrong)');
      h+='<tr><td>'+familyLabel(r.key)+'<div class="accbar"><div style="width:'+Math.round(r.acc*100)+'%;background:'+color+'"></div></div></td>';
      h+='<td class="num">'+r.c+'/'+r.n+'</td><td class="num" style="color:'+color+'">'+Math.round(r.acc*100)+'%</td></tr>';
    });
    h+='</tbody></table></div>';
    app.innerHTML=h;
    elBar.style.width="100%";
    document.getElementById("again").addEventListener("click", function(){ startDrill(adaptivePick(ALL, DRILL_LEN, 0.75), "Smart drill"); });
    if(session.missed.length){
      var ids={}; session.missed.forEach(function(id){ ids[id]=1; });
      document.getElementById("retry").addEventListener("click", function(){
        startDrill(shuffle(ALL.filter(function(q){ return ids[q.id]; })), "Missed review");
      });
      if(session.deferred){
        var missedItems=session.items.filter(function(it){ return !it.correct; });
        document.getElementById("rvwdrill").addEventListener("click", function(){
          renderReviewList(missedItems, 0, renderDrillEnd);
        });
      }
    }
    window.scrollTo(0,0);
  }

  // ---------- practice exam ----------
  function startExam(){
    exam={items:buildExamSet().map(mkItem), idx:0, endsAt:Date.now()+EXAM_MS, submitted:false, instant:getPref()==="instant"};
    go("exam");
    timerId=setInterval(examTick, 1000);
    if(exam.instant) renderInstantExamQ(); else renderExamQ();
  }
  function fmtLeft(ms){
    if(ms<0) ms=0;
    var s=Math.floor(ms/1000), m=Math.floor(s/60); s=s%60;
    return m+":"+(s<10?"0":"")+s;
  }
  function examTick(){
    if(!exam||exam.submitted) return;
    var left=exam.endsAt-Date.now();
    var answered=exam.items.filter(function(i){return i.chosen>=0;}).length;
    header(fmtLeft(left), answered+"/"+exam.items.length+" answered", answered/exam.items.length, left<5*60*1000);
    if(left<=0) submitExam(true);
  }
  function renderExamQ(){
    examTick();
    var it=exam.items[exam.idx], q=it.q;
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<div class="meta"><span>'+q.domain+'</span><span>Q'+(exam.idx+1)+' of '+exam.items.length+'</span></div>';
    h+='<p class="q"></p><div class="opts">';
    for(var i=0;i<4;i++) h+='<button class="opt'+(it.chosen===i?" selected":"")+'" data-i="'+i+'"><span class="k">'+LETTERS[i]+'</span><span class="t"></span></button>';
    h+='</div></div>';
    app.innerHTML=h;
    app.querySelector(".q").textContent=q.question;
    var btns=app.querySelectorAll(".opt");
    for(var j=0;j<4;j++){
      btns[j].querySelector(".t").textContent=it.opts[j];
      btns[j].addEventListener("click", function(e){
        var pick=parseInt(e.currentTarget.getAttribute("data-i"),10);
        it.chosen = (it.chosen===pick) ? -1 : pick;
        var bs=document.querySelectorAll(".opt");
        for(var k=0;k<bs.length;k++) bs[k].classList.toggle("selected", parseInt(bs[k].getAttribute("data-i"),10)===it.chosen);
        examTick();
      });
    }
    document.getElementById("exflag").classList.toggle("flagged", it.flagged);
    document.getElementById("exflag").textContent = it.flagged?"Flagged":"Flag";
    document.getElementById("exgrid").textContent=(exam.idx+1)+"/"+exam.items.length;
    document.getElementById("exnext").textContent = exam.idx===exam.items.length-1 ? "Finish" : "Next";
    window.scrollTo(0,0);
  }
  // instant-feedback exam: same set, same timer, same scoring - but each
  // answer grades right after you lock it in (select, confirm, feedback)
  function renderInstantExamQ(){
    examTick();
    var it=exam.items[exam.idx], q=it.q;
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<div class="meta"><span>'+q.domain+' \\u00b7 '+familyLabel(q.family)+'</span><span>Q'+(exam.idx+1)+' of '+exam.items.length+'</span></div>';
    h+='<p class="q"></p><div class="opts">';
    for(var i=0;i<4;i++) h+='<button class="opt" data-i="'+i+'"><span class="k">'+LETTERS[i]+'</span><span class="t"></span></button>';
    h+='</div>';
    h+='<div class="actions"><button class="primary" id="lockbtn" disabled style="opacity:.5">Lock in answer</button></div>';
    h+='<div id="feedback"></div></div>';
    app.innerHTML=h;
    app.querySelector(".q").textContent=q.question;
    var btns=app.querySelectorAll(".opt");
    for(var j=0;j<4;j++){
      btns[j].querySelector(".t").textContent=it.opts[j];
      btns[j].addEventListener("click", function(e){
        if(it.answered) return;
        var pick=parseInt(e.currentTarget.getAttribute("data-i"),10);
        it.chosen = (it.chosen===pick) ? -1 : pick;
        var bs=document.querySelectorAll(".opt");
        for(var k=0;k<bs.length;k++) bs[k].classList.toggle("selected", parseInt(bs[k].getAttribute("data-i"),10)===it.chosen);
        var lb=document.getElementById("lockbtn");
        if(it.chosen>=0){ lb.removeAttribute("disabled"); lb.style.opacity=""; }
        else { lb.setAttribute("disabled",""); lb.style.opacity=".5"; }
      });
    }
    document.getElementById("lockbtn").addEventListener("click", lockInstantExamAnswer);
    window.scrollTo(0,0);
  }
  function lockInstantExamAnswer(){
    var it=exam.items[exam.idx];
    if(it.answered || it.chosen<0) return;
    it.answered=true;
    var ok = it.chosen===it.correctDisplay;
    var btns=document.querySelectorAll(".opt");
    for(var i=0;i<btns.length;i++){
      var bi=parseInt(btns[i].getAttribute("data-i"),10);
      btns[i].setAttribute("disabled","");
      btns[i].classList.remove("selected");
      if(bi===it.correctDisplay) btns[i].classList.add("correct");
      else if(bi===it.chosen) btns[i].classList.add("wrong");
      else btns[i].classList.add("dim");
    }
    document.getElementById("lockbtn").parentNode.remove();
    var fb=document.getElementById("feedback");
    fb.appendChild(explBlock(it.q, ok));
    var act=document.createElement("div"); act.className="actions";
    var next=document.createElement("button"); next.className="primary";
    next.textContent=(exam.idx+1>=exam.items.length)?"See results":"Next";
    next.addEventListener("click", function(){
      if(exam.idx+1>=exam.items.length) return submitExam(false);
      exam.idx++; renderInstantExamQ();
    });
    act.appendChild(next); fb.appendChild(act);
    examTick(); next.focus();
  }
  document.getElementById("exprev").addEventListener("click", function(){
    if(mode!=="exam") return;
    exam.idx=(exam.idx-1+exam.items.length)%exam.items.length; renderExamQ();
  });
  document.getElementById("exnext").addEventListener("click", function(){
    if(mode!=="exam") return;
    if(exam.idx===exam.items.length-1) return maybeSubmit();
    exam.idx++; renderExamQ();
  });
  document.getElementById("exflag").addEventListener("click", function(){
    if(mode!=="exam") return;
    var it=exam.items[exam.idx]; it.flagged=!it.flagged; renderExamQ();
  });
  var gridEl=document.getElementById("grid");
  document.getElementById("exgrid").addEventListener("click", function(){
    if(mode!=="exam") return;
    var wrap=document.getElementById("gridwrap"); wrap.textContent="";
    exam.items.forEach(function(it,i){
      var b=document.createElement("button");
      b.className="gcell"+(it.chosen>=0?" answered":"")+(it.flagged?" flagged":"")+(i===exam.idx?" cur":"");
      b.textContent=i+1;
      b.addEventListener("click", function(){ exam.idx=i; gridEl.classList.remove("open"); renderExamQ(); });
      wrap.appendChild(b);
    });
    gridEl.classList.add("open");
  });
  document.getElementById("gridclose").addEventListener("click", function(){ gridEl.classList.remove("open"); });
  document.getElementById("gridsubmit").addEventListener("click", function(){ gridEl.classList.remove("open"); maybeSubmit(); });
  function maybeSubmit(){
    var un=exam.items.filter(function(i){return i.chosen<0;}).length;
    if(un>0 && !confirm(un+" question"+(un===1?"":"s")+" unanswered. Submit anyway?")) return;
    submitExam(false);
  }
  function submitExam(timedOut){
    if(exam.submitted) return;
    exam.submitted=true;
    if(timerId){ clearInterval(timerId); timerId=null; }
    var correct=0, perDom={};
    exam.items.forEach(function(it){
      var ok = it.chosen===it.correctDisplay;
      it.correct=ok; if(ok) correct++;
      var d=it.q.domain; perDom[d]=perDom[d]||{c:0,n:0}; perDom[d].n++; if(ok) perDom[d].c++;
      recordStat(it.q, ok);   // exams feed the adaptive engine too
    });
    var scaled=Math.round(100+(correct/exam.items.length)*800);
    var s=loadStats();
    s.exams.push({t:Date.now(), correct:correct, total:exam.items.length, scaled:scaled});
    if(s.exams.length>20) s.exams=s.exams.slice(-20);
    saveStats(s);
    exam.report={correct:correct, scaled:scaled, perDom:perDom, timedOut:timedOut};
    renderReport();
  }
  function renderReport(){
    go("report");
    var r=exam.report, total=exam.items.length;
    var pct=Math.round(r.correct/total*100);
    var pass=r.scaled>=PASS_SCALED;
    header("Exam result","",1);
    var missed=exam.items.filter(function(it){ return !it.correct; });
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<h1 class="big">Practice exam '+(r.timedOut?"(time expired)":"complete")+'</h1>';
    h+='<div class="bignum">'+r.scaled+' <span class="badge '+(pass?"pass":"fail")+'">'+(pass?"PASS":"FAIL")+'</span></div>';
    h+='<div class="sub">'+r.correct+'/'+total+' correct ('+pct+'%) \\u00b7 passing score '+PASS_SCALED+' \\u00b7 scale 100-900</div>';
    h+='<table><thead><tr><th>Domain</th><th class="num">Score</th><th class="num">Acc</th></tr></thead><tbody>';
    ["D1","D2","D3","D4","D5"].forEach(function(d){
      var o=exam.report.perDom[d]||{c:0,n:0};
      var acc=o.n?o.c/o.n:0;
      var color=acc>=0.8?'var(--correct)':(acc>=0.6?'var(--amber)':'var(--wrong)');
      h+='<tr><td>'+d+'<div class="accbar"><div style="width:'+Math.round(acc*100)+'%;background:'+color+'"></div></div></td>';
      h+='<td class="num">'+o.c+'/'+o.n+'</td><td class="num" style="color:'+color+'">'+Math.round(acc*100)+'%</td></tr>';
    });
    h+='</tbody></table>';
    h+='<div class="actions">';
    h+='<button class="primary" id="rvw"'+(missed.length?'':' disabled style="opacity:.5"')+'>Review missed ('+missed.length+')</button>';
    h+='<button class="ghost" id="drillmiss"'+(missed.length?'':' disabled style="opacity:.5"')+'>Drill my misses</button>';
    h+='</div>';
    h+='<div class="actions"><button class="ghost" id="homego">Back to home</button></div>';
    h+='</div>';
    app.innerHTML=h;
    if(missed.length){
      document.getElementById("rvw").addEventListener("click", function(){ renderReviewList(missed, 0, renderReport); });
      document.getElementById("drillmiss").addEventListener("click", function(){
        startDrill(shuffle(missed.map(function(it){return it.q;})), "Exam-miss drill");
      });
    }
    document.getElementById("homego").addEventListener("click", showHome);
    window.scrollTo(0,0);
  }
  // Walk through a list of answered items (your pick vs the key + the tell),
  // then hand control back to backFn. Shared by exam report and deferred drills.
  function renderReviewList(list, i, backFn){
    go("review");
    if(i>=list.length) return backFn();
    var it=list[i], q=it.q;
    header("Review "+(i+1)+"/"+list.length,"",(i+1)/list.length);
    var app=document.getElementById("app");
    var h='<div class="card">';
    h+='<div class="meta"><span>'+q.domain+' \\u00b7 '+familyLabel(q.family)+'</span><span>missed</span></div>';
    h+='<p class="q"></p><div class="opts">';
    for(var k=0;k<4;k++){
      var cls="opt dim";
      if(k===it.correctDisplay) cls="opt correct";
      else if(k===it.chosen) cls="opt wrong";
      h+='<button class="'+cls+'" disabled><span class="k">'+LETTERS[k]+'</span><span class="t"></span></button>';
    }
    h+='</div><div id="feedback"></div>';
    h+='<div class="actions"><button class="primary" id="nx">'+(i+1>=list.length?"Done":"Next miss")+'</button></div>';
    h+='</div>';
    app.innerHTML=h;
    app.querySelector(".q").textContent=q.question;
    var ts=app.querySelectorAll(".opt .t");
    for(var m=0;m<4;m++) ts[m].textContent=it.opts[m];
    document.getElementById("feedback").appendChild(explBlock(q, null));
    document.getElementById("nx").addEventListener("click", function(){ renderReviewList(list, i+1, backFn); });
    window.scrollTo(0,0);
  }

  // ---------- reference overlay ----------
  function renderRef(filter){
    var list=document.getElementById("reflist");
    var f=(filter||"").toLowerCase();
    var shown=REF.filter(function(r){
      var hay=(r.key.replace(/-/g," ")+" "+r.siblings+" "+r.tell).toLowerCase();
      return !f||hay.indexOf(f)>=0;
    });
    list.textContent="";
    if(!shown.length){ var none=document.createElement("div"); none.className="hint"; none.textContent="No matches."; list.appendChild(none); return; }
    var curDom="";
    shown.forEach(function(r){
      if(r.domain!==curDom){ curDom=r.domain; var d=document.createElement("div"); d.className="refdom"; d.textContent=curDom; list.appendChild(d); }
      var card=document.createElement("div"); card.className="reffam";
      var h2=document.createElement("h2"); h2.textContent=familyLabel(r.key);
      if(r.tier==="priority"){ var st=document.createElement("span"); st.className="star"; st.textContent="\\u2605 priority"; h2.appendChild(document.createTextNode(" ")); h2.appendChild(st); }
      var sib=document.createElement("div"); sib.className="sib"; sib.textContent=r.siblings;
      var tl=document.createElement("div"); tl.className="tell"; tl.textContent=r.tell;
      card.appendChild(h2); card.appendChild(sib); card.appendChild(tl);
      list.appendChild(card);
    });
  }
  var refEl=document.getElementById("ref");
  document.getElementById("refbtn").addEventListener("click", function(){
    renderRef(document.getElementById("refsearch").value); refEl.classList.add("open");
  });
  document.getElementById("refclose").addEventListener("click", function(){ refEl.classList.remove("open"); });
  document.getElementById("refsearch").addEventListener("input", function(e){ renderRef(e.target.value); });

  showHome();
})();
</script>
</body>
</html>
`;

writeFileSync(outFile, html);
console.log(`Wrote index.html (${QUESTIONS.length} questions + ${reference.length} reference families, ${(html.length/1024).toFixed(0)} KB)`);
