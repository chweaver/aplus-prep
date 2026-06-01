const fs = require("fs");
const root = __dirname + "/src/content";
const qd = root + "/questions";

const ts = fs.readFileSync(root + "/tags.ts", "utf8");
const canon = new Set([...ts.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]));
const ws = fs.readFileSync(root + "/weak-spots.ts", "utf8");
const wsTags = new Set([...ws.matchAll(/'([a-z0-9-]+)':\s*\{/g)].map((m) => m[1]));

const re = /^\d+\.\d+\.q\.\d{3}$/;
const prefix = process.argv[2] || "";
let total = 0;
const bad = [], dupes = [], seen = new Set(), mism = [], badTag = [], badWs = [], badCorrect = [], dupChoiceText = [], notMC = [];
const dist = {};

const files = fs.readdirSync(qd).filter((x) => x.endsWith(".json") && x.startsWith(prefix));
files.sort((a, b) => {
  const pa = a.replace(".json", "").split(".").map(Number);
  const pb = b.replace(".json", "").split(".").map(Number);
  return pa[0] - pb[0] || pa[1] - pb[1];
});

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(qd + "/" + f, "utf8"));
  const obj = f.replace(".json", "");
  if (d.objective !== obj) mism.push(f + " objective=" + d.objective);
  const counts = { a: 0, b: 0, c: 0, d: 0 };
  for (const q of d.questions) {
    total++;
    if (q.type !== "multiple-choice") notMC.push(f + ":" + q.id + " type=" + q.type);
    if (!re.test(q.id)) bad.push(f + ":" + q.id);
    if (!q.id.startsWith(obj + ".q.")) mism.push(f + ":" + q.id);
    if (seen.has(q.id)) dupes.push(q.id); else seen.add(q.id);
    const ids = new Set(q.choices.map((c) => c.id));
    if (!ids.has(q.correct)) badCorrect.push(f + ":" + q.id);
    const texts = q.choices.map((c) => c.text);
    if (new Set(texts).size !== texts.length) dupChoiceText.push(f + ":" + q.id);
    counts[q.correct] = (counts[q.correct] || 0) + 1;
    for (const t of q.tags || []) if (!canon.has(t)) badTag.push(f + " " + q.id + ' "' + t + '"');
    for (const t of q.weakSpotTags || []) if (!wsTags.has(t)) badWs.push(f + " " + q.id + ' "' + t + '"');
  }
  dist[obj] = { n: d.questions.length, ...counts };
}

console.log("files:", files.length, "| total questions:", total);
console.log("malformed id:", bad.length, bad.join(";"));
console.log("dupes:", dupes.length, dupes.join(";"));
console.log("obj mismatch:", mism.length, mism.join(";"));
console.log("non-MC questions:", notMC.length, notMC.join(";"));
console.log("bad correct->choice:", badCorrect.length, badCorrect.join(";"));
console.log("duplicate choice text in a Q:", dupChoiceText.length, dupChoiceText.join(";"));
console.log("tags NOT in tags.ts:", badTag.length, badTag.join(";"));
console.log("weakSpotTags NOT in weak-spots.ts:", badWs.length, badWs.join(";"));
console.log("--- distribution ---");
for (const [o, c] of Object.entries(dist)) console.log(`${o}  n=${c.n}  a:${c.a} b:${c.b} c:${c.c} d:${c.d}`);
