// Build a single self-contained index.html with all questions inlined.
// Usage: node scripts/build-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { QUESTIONS } from "../data/questions.js";
import { FAMILIES } from "../data/families.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, "..", "index.html");

// Minimal family label map (key -> pretty name) for the end-screen table.
const familyMeta = {};
for (const f of FAMILIES) familyMeta[f.key] = { domain: f.domain, tier: f.tier };

const DATA = JSON.stringify({ questions: QUESTIONS, families: familyMeta });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#111318" />
<title>Security+ SY0-701 Twin-Term Drill</title>
<style>
  :root{
    --page:#111318; --card:#1b1e27; --option:#242836; --border:#2f3445;
    --text:#e8eaf1; --muted:#8a8fa3; --primary:#424cf7;
    --correct:#4ade80; --correct-bg:#173423; --wrong:#f87171; --wrong-bg:#3a1d1d;
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
    padding:12px 16px calc(12px + env(safe-area-inset-top)); padding-top:max(12px,env(safe-area-inset-top));
    display:flex; align-items:center; justify-content:space-between; gap:12px;
  }
  #tally .score{font-weight:700; font-size:15px; letter-spacing:.2px}
  #tally .pct{color:var(--muted); font-weight:600}
  #bar{height:4px; background:var(--option); border-radius:3px; overflow:hidden; flex:1; max-width:180px}
  #bar>div{height:100%; width:0; background:var(--primary); transition:width .25s ease}
  main{max-width:520px; margin:0 auto; padding:16px}
  .card{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:18px; margin-top:8px}
  .meta{color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px}
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
  }
  .end h1{font-size:22px; margin:4px 0 2px}
  .end .big{font-size:40px; font-weight:800; margin:6px 0}
  .end .sub{color:var(--muted); margin-bottom:16px}
  table{width:100%; border-collapse:collapse; font-size:14px}
  th,td{text-align:left; padding:8px 6px; border-bottom:1px solid var(--border)}
  th{color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.06em}
  td.num{text-align:right; font-variant-numeric:tabular-nums}
  .accbar{height:6px; border-radius:4px; background:var(--option); overflow:hidden; margin-top:4px}
  .accbar>div{height:100%}
  .link{color:var(--muted); text-decoration:underline; cursor:pointer; font-size:13px; background:none; border:none; padding:0}
  .foot{margin-top:22px; display:flex; justify-content:space-between; align-items:center}
  .hint{color:var(--muted); font-size:12px; margin-top:10px; text-align:center}
</style>
</head>
<body>
  <div id="tally">
    <span class="score" id="score">0/0</span>
    <div id="bar"><div></div></div>
    <span class="pct" id="pct">0%</span>
  </div>
  <main id="app"></main>

<script id="data" type="application/json">${DATA}</script>
<script>
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("data").textContent);
  var ALL = DATA.questions;
  var FAM = DATA.families;
  var LETTERS = ["A","B","C","D"];
  var STORE_KEY = "secplus-drill-stats-v1";

  function loadStats(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || {perQuestion:{},perFamily:{}}; }
    catch(e){ return {perQuestion:{},perFamily:{}}; }
  }
  function saveStats(s){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch(e){} }
  function recordStat(q, correct){
    var s = loadStats();
    var pq = s.perQuestion[q.id] || {attempts:0,correct:0};
    pq.attempts++; if(correct) pq.correct++; s.perQuestion[q.id]=pq;
    var pf = s.perFamily[q.family] || {attempts:0,correct:0};
    pf.attempts++; if(correct) pf.correct++; s.perFamily[q.family]=pf;
    saveStats(s);
  }

  function shuffle(a){
    a = a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  // session state
  var session=null;

  function buildSession(pool){
    var order = shuffle(pool);
    var items = order.map(function(q){
      var idxs = shuffle([0,1,2,3]);
      var opts = idxs.map(function(i){ return q.options[i]; });
      var correctDisplay = idxs.indexOf(q.correctIndex);
      return {q:q, opts:opts, correctDisplay:correctDisplay, answered:false, correct:null};
    });
    session = {items:items, pos:0, correctCount:0, answeredCount:0, missed:[]};
    render();
  }

  function updateTally(){
    var total = session.items.length;
    var answered = session.answeredCount;
    var pct = answered ? Math.round(session.correctCount/answered*100) : 0;
    document.getElementById("score").textContent = session.correctCount + "/" + answered + "  \\u00b7  " + total + " total";
    document.getElementById("pct").textContent = pct + "%";
    document.querySelector("#bar>div").style.width = (session.pos/total*100) + "%";
  }

  function familyLabel(key){ return key.replace(/-/g," "); }

  function render(){
    updateTally();
    if(session.pos >= session.items.length){ return renderEnd(); }
    var it = session.items[session.pos];
    var q = it.q;
    var app = document.getElementById("app");
    var html = '<div class="card">';
    html += '<div class="meta">'+q.domain+'  \\u00b7  '+familyLabel(q.family)+'  \\u00b7  Q'+(session.pos+1)+' of '+session.items.length+'</div>';
    html += '<p class="q"></p>';
    html += '<div class="opts">';
    for(var i=0;i<4;i++){
      html += '<button class="opt" data-i="'+i+'"><span class="k">'+LETTERS[i]+'</span><span class="t"></span></button>';
    }
    html += '</div><div id="feedback"></div></div>';
    app.innerHTML = html;
    // set text safely (avoid HTML injection from content)
    app.querySelector(".q").textContent = q.question;
    var btns = app.querySelectorAll(".opt");
    for(var j=0;j<4;j++){
      btns[j].querySelector(".t").textContent = it.opts[j];
      btns[j].addEventListener("click", onAnswer);
    }
    window.scrollTo(0,0);
  }

  function onAnswer(e){
    var it = session.items[session.pos];
    if(it.answered) return;
    var chosen = parseInt(e.currentTarget.getAttribute("data-i"),10);
    it.answered = true;
    it.correct = (chosen === it.correctDisplay);
    session.answeredCount++;
    if(it.correct) session.correctCount++; else session.missed.push(it.q.id);
    recordStat(it.q, it.correct);

    var btns = document.querySelectorAll(".opt");
    for(var i=0;i<btns.length;i++){
      var bi = parseInt(btns[i].getAttribute("data-i"),10);
      btns[i].setAttribute("disabled","");
      if(bi === it.correctDisplay) btns[i].classList.add("correct");
      else if(bi === chosen) btns[i].classList.add("wrong");
      else btns[i].classList.add("dim");
    }
    var fb = document.getElementById("feedback");
    var q = it.q;
    var expl = q.explanation;
    var tellIdx = expl.indexOf("The tell:");
    var main = tellIdx>=0 ? expl.slice(0,tellIdx).trim() : expl;
    var tell = tellIdx>=0 ? expl.slice(tellIdx) : "";
    var cls = it.correct ? "correct" : "wrong";
    var verdict = it.correct ? "Correct" : "Wrong";
    var wrap = document.createElement("div");
    wrap.className = "expl "+cls;
    var v = document.createElement("div"); v.className="verdict"; v.textContent=verdict;
    var m = document.createElement("div"); m.textContent=main;
    wrap.appendChild(v); wrap.appendChild(m);
    if(tell){ var t=document.createElement("span"); t.className="tell"; t.textContent=tell; wrap.appendChild(t); }
    fb.appendChild(wrap);
    var act = document.createElement("div"); act.className="actions";
    var next = document.createElement("button"); next.className="primary";
    next.textContent = (session.pos+1 >= session.items.length) ? "See results" : "Next";
    next.addEventListener("click", function(){ session.pos++; render(); });
    act.appendChild(next);
    fb.appendChild(act);
    updateTally();
    next.focus();
  }

  function renderEnd(){
    var app = document.getElementById("app");
    var total = session.items.length;
    var correct = session.correctCount;
    var pct = total ? Math.round(correct/total*100) : 0;
    // per-family accuracy for THIS session
    var byFam = {};
    session.items.forEach(function(it){
      var k = it.q.family;
      byFam[k] = byFam[k] || {n:0,c:0};
      byFam[k].n++; if(it.correct) byFam[k].c++;
    });
    var rows = Object.keys(byFam).map(function(k){
      var o=byFam[k]; return {key:k, n:o.n, c:o.c, acc:o.c/o.n};
    }).sort(function(a,b){ return a.acc-b.acc || b.n-a.n; });

    var html = '<div class="card end">';
    html += '<h1>Session complete</h1>';
    html += '<div class="big">'+correct+' / '+total+'</div>';
    html += '<div class="sub">'+pct+'% correct  \\u00b7  '+session.missed.length+' to review</div>';
    html += '<div class="actions">';
    html += '<button class="primary" id="retry"'+(session.missed.length?'':' disabled style="opacity:.5"')+'>Retry missed ('+session.missed.length+')</button>';
    html += '<button class="ghost" id="restart">Restart all</button>';
    html += '</div>';
    html += '<h1 style="font-size:16px;margin-top:22px">Weakest families first</h1>';
    html += '<table><thead><tr><th>Family</th><th class="num">Score</th><th class="num">Acc</th></tr></thead><tbody>';
    rows.forEach(function(r){
      var color = r.acc>=0.8?'var(--correct)':(r.acc>=0.5?'#f5c451':'var(--wrong)');
      html += '<tr><td>'+familyLabel(r.key)+'<div class="accbar"><div style="width:'+Math.round(r.acc*100)+'%;background:'+color+'"></div></div></td>';
      html += '<td class="num">'+r.c+'/'+r.n+'</td><td class="num" style="color:'+color+'">'+Math.round(r.acc*100)+'%</td></tr>';
    });
    html += '</tbody></table>';
    html += '<div class="foot"><span class="hint" style="margin:0;text-align:left">Lifetime stats saved on this device</span><button class="link" id="reset">reset stats</button></div>';
    html += '</div>';
    app.innerHTML = html;
    document.querySelector("#bar>div").style.width = "100%";

    var retry = document.getElementById("retry");
    if(session.missed.length){
      retry.addEventListener("click", function(){
        var ids = {}; session.missed.forEach(function(id){ ids[id]=1; });
        buildSession(ALL.filter(function(q){ return ids[q.id]; }));
      });
    }
    document.getElementById("restart").addEventListener("click", function(){ buildSession(ALL); });
    document.getElementById("reset").addEventListener("click", function(){
      if(confirm("Erase all saved stats on this device?")){ try{ localStorage.removeItem(STORE_KEY); }catch(e){} alert("Stats cleared."); }
    });
    window.scrollTo(0,0);
  }

  buildSession(ALL);
})();
</script>
</body>
</html>
`;

writeFileSync(outFile, html);
console.log(`Wrote index.html (${QUESTIONS.length} questions inlined, ${(html.length/1024).toFixed(0)} KB)`);
