# Security+ SY0-701 Twin-Term Drill

A single-file drill app that attacks one specific failure mode on the CompTIA
Security+ SY0-701 exam: confusing paired or sibling terms (CVE vs CVSS, SPF vs
DMARC, MOU vs SLA, hot vs cold site, snapshots vs journaling, and about a
hundred more). No lessons, no menus - one continuous shuffled stream of
multiple-choice reps with instant feedback.

## Use it

Open `index.html` in any browser - it is fully self-contained (no network, no
dependencies). On merge to `main` it also deploys to GitHub Pages.

Three modes, all driven by the same adaptive engine:

- **Practice exam**: 90 questions / 90 minutes, sampled to the official domain
  weights (12/22/18/28/20). Which questions fill each domain's quota is chosen
  by the algorithm - your misses first, then unseen material, weighted toward
  weak families, with a spread factor so one family cannot hog a domain. No
  feedback until submit; flag questions and jump around via the grid. Scored
  on the 100-900 scale against the 750 pass line with a per-domain breakdown,
  then review each miss or convert them straight into a drill.
- **Smart drill**: 25-question rounds picked by the algorithm. Every
  explanation ends with "The tell:" - a one-phrase discriminator for each
  sibling term. The tell line is the studying.
- **Full stream**: all questions shuffled.

A **feedback setting** on the home screen applies to every mode: "Instant"
grades each answer as you tap it and shows the explanation before you move
on; "At the end" holds all feedback until the round or exam is submitted,
then walks you through your misses. With instant feedback the practice exam
keeps its timer, adaptive selection, and scaled scoring, but answers lock as
you go (no flags or revisiting); with end-of-round feedback it is a full
simulation with flagging, a question grid, and changeable answers.

The adaptive engine weights each question by history: missed-last-time (4x) >
never-seen (3x) > shaky (2x) > solid (1x) > mastered (0.4x), multiplied up for
families under 80% accuracy and damped for questions seen very recently. Exam
answers feed the same stats, so drills target what exams expose. Lifetime
stats persist in localStorage; the home screen shows seen/mastered progress
and your recent exam scores. The "Reference" button opens a searchable
per-family cheat sheet of all sibling terms and their tells.

## What is in the bank

333 questions across 102 confusion families covering every sibling set in the
official SY0-701 V7 objectives (`SY0-701-objectives.pdf`, the source of truth):

| Domain | Questions |
|---|---|
| D1 General Security Concepts | 45 |
| D2 Threats, Vulnerabilities, Mitigations | 53 |
| D3 Security Architecture | 69 |
| D4 Security Operations | 93 |
| D5 Program Management and Oversight | 73 |

Seven priority families get 10 questions each (they were the misses on a cold
diagnostic): crypto key handling (TPM/HSM/escrow), sites (hot/warm/cold),
backups (snapshots/replication/journaling), CVE/CVSS, email security
(SPF/DKIM/DMARC), risk strategies (accept/transfer/avoid/mitigate), and
agreements (MOU/SLA/MSA/SOW).

Scope rules: SY0-701 vocabulary only. Retired SY0-601 terms (DMZ, MITM,
white/black/gray box, whitelist/blacklist, mantrap, whaling, etc.) appear
nowhere. Ambiguous acronyms (RBAC, MAC, SAN) are always spelled out or avoided.

## Repo layout

- `index.html` - the app, with all questions and the reference sheet inlined
- `data/questions.js` - the merged bank (generated; do not edit by hand)
- `data/gen/chunk*.json` - the per-domain source chunks (edit these)
- `data/families.js` - the family registry: tiers and per-family minimums
- `data/generation-guide.md` - the writing rules and the full family-by-family
  sibling inventory with canonical tells (also feeds the in-app reference)
- `scripts/merge.mjs` - merges chunks into `data/questions.js`
- `scripts/validate.mjs` - integrity checks (see below)
- `scripts/build-html.mjs` - inlines the bank + reference into `index.html`

## Editing questions

1. Edit the relevant `data/gen/chunk*.json`
2. `node scripts/merge.mjs`
3. `node scripts/validate.mjs`
4. `node scripts/build-html.mjs`

The validator asserts: sequential unique ids, no duplicate stems, exactly 4
unique options with a valid correctIndex, balanced correctIndex distribution,
every family at or above its minimum (priority families at 8+), zero banned
terms, no em dashes, and "The tell:" present in every explanation. CI runs it
on every deploy.

## Quality process

Beyond the mechanical validator, the bank went through:
- A per-chunk editorial polish pass (accuracy, single-defensible-answer,
  tell consistency) against the official objectives PDF.
- A blind-solve audit: independent solvers answered every question with the
  key hidden; disagreements and ambiguity flags were fixed at the source.
- Hand-verified risk-math: every SLE/ALE/ARO calculation recomputed.
