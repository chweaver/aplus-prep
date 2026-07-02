// Validator for the SY0-701 twin-term drill bank.
// Usage: node scripts/validate.mjs
// Loads data/questions.js + data/families.js and asserts the bank's integrity.
// Prints a family-by-family count table at the end. Exits non-zero on any failure.
import { QUESTIONS } from "../data/questions.js";
import { FAMILIES } from "../data/families.js";

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const N = QUESTIONS.length;
const familyByKey = new Map(FAMILIES.map((f) => [f.key, f]));
const validDomains = new Set(["D1", "D2", "D3", "D4", "D5"]);

// Banned SY0-601 leftover terms. Whole-word, case-insensitive.
const BANNED = [
  "DMZ", "man-in-the-middle", "MITM", "mantrap", "whaling", "pharming",
  "tailgating", "shoulder surfing", "dumpster diving", "SPIM",
  "whitelist", "blacklist", "white box", "black box", "gray box", "grey box",
];
const bannedRe = new RegExp("\\b(" + BANNED.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|") + ")\\b", "i");
// em dash / en dash / horizontal bar
const dashRe = /[–—―]/;

// ---- per-question checks ----
const idSeen = new Set();
const stemSeen = new Map();
const posCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
const familyCount = {};
const styleText = (q) => [q.question, ...q.options, q.explanation].join("  ");

QUESTIONS.forEach((q, idx) => {
  const where = `[${q.id || "#" + idx}]`;
  const expectedId = "q" + String(idx + 1).padStart(3, "0");
  if (q.id !== expectedId) fail(`${where} id should be ${expectedId}`);
  if (idSeen.has(q.id)) fail(`${where} duplicate id`);
  idSeen.add(q.id);

  if (!validDomains.has(q.domain)) fail(`${where} bad domain ${q.domain}`);
  if (!familyByKey.has(q.family)) fail(`${where} unknown family "${q.family}"`);
  familyCount[q.family] = (familyCount[q.family] || 0) + 1;

  if (!Array.isArray(q.options) || q.options.length !== 4)
    fail(`${where} must have exactly 4 options`);
  else {
    const uniq = new Set(q.options.map((o) => o.trim().toLowerCase()));
    if (uniq.size !== 4) fail(`${where} options not all unique`);
    for (const o of q.options) {
      if (/^rbac$/i.test(o.trim())) fail(`${where} bare "RBAC" option (spell it out)`);
      if (/^san$/i.test(o.trim())) fail(`${where} bare "SAN" option (collision)`);
    }
  }
  if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3)
    fail(`${where} correctIndex out of range`);
  else posCount[q.correctIndex]++;

  if (!q.explanation || !q.explanation.includes("The tell:"))
    fail(`${where} explanation missing "The tell:"`);

  const text = styleText(q);
  const bad = text.match(bannedRe);
  if (bad) fail(`${where} banned term "${bad[0]}"`);
  if (dashRe.test(text)) fail(`${where} contains em/en dash`);

  // duplicate stem (normalized)
  const norm = q.question.toLowerCase().replace(/\s+/g, " ").trim();
  if (stemSeen.has(norm)) fail(`${where} duplicate stem of ${stemSeen.get(norm)}`);
  else stemSeen.set(norm, q.id);
});

// ---- correctIndex distribution ----
// Each position should hold a healthy share (target 20-30%). Allow 15%-38% band.
const lo = Math.floor(N * 0.15);
const hi = Math.ceil(N * 0.38);
for (const p of [0, 1, 2, 3]) {
  if (posCount[p] < lo || posCount[p] > hi)
    fail(`correctIndex ${p} held ${posCount[p]} times, outside [${lo}, ${hi}]`);
}

// ---- family coverage + minimums ----
for (const f of FAMILIES) {
  const c = familyCount[f.key] || 0;
  if (c < f.min) fail(`family "${f.key}" has ${c}, below min ${f.min}`);
  if (f.tier === "priority" && c < 8)
    fail(`priority family "${f.key}" has ${c}, must be >= 8`);
}

// ---- report ----
const domTotals = {};
for (const f of FAMILIES) {
  const c = familyCount[f.key] || 0;
  domTotals[f.domain] = (domTotals[f.domain] || 0) + c;
}

console.log("=== SY0-701 Twin-Term Drill: validation ===");
console.log(`total questions: ${N}`);
console.log(`correctIndex distribution: 0=${posCount[0]} 1=${posCount[1]} 2=${posCount[2]} 3=${posCount[3]} (band ${lo}-${hi})`);
console.log("");
console.log("family-by-family counts:");
let cur = "";
for (const f of FAMILIES) {
  if (f.domain !== cur) {
    cur = f.domain;
    console.log(`  -- ${cur} (total ${domTotals[cur]}) --`);
  }
  const c = familyCount[f.key] || 0;
  const flag = c < f.min ? "  <-- BELOW MIN" : "";
  const tier = f.tier === "priority" ? "*" : f.tier === "high" ? "+" : " ";
  console.log(`    ${tier} ${f.key.padEnd(26)} ${String(c).padStart(3)} (min ${f.min})${flag}`);
}

if (warnings.length) {
  console.log("\nWARNINGS:");
  for (const w of warnings) console.log("  ! " + w);
}

if (errors.length) {
  console.log(`\nFAILED with ${errors.length} error(s):`);
  for (const e of errors.slice(0, 80)) console.log("  X " + e);
  if (errors.length > 80) console.log(`  ... and ${errors.length - 80} more`);
  process.exit(1);
}
console.log("\nOK: all checks passed.");
