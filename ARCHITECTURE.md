# A+ Prep — Architecture & Content Overview

A client-side study app for the **CompTIA A+ Core 2** exam. This document explains
how the site is structured, built, and how its study content (questions,
flashcards, topic notes) is authored — enough for someone to understand the
codebase and plan a restructure.

> **TL;DR:** React 19 + Vite + TypeScript single-page app. No backend, no
> database, no API. All study content is hand-authored JSON bundled at build
> time; all user progress lives in `localStorage`. Deploys to GitHub Pages.

---

## 1. Tech stack & build

| Concern | Choice |
|---|---|
| UI framework | **React 19** |
| Routing | **React Router 7**, `HashRouter` (URLs like `/#/exam`) |
| Language | **TypeScript 5.7** (strict) |
| Bundler | **Vite 6** |
| Styling | **Tailwind CSS 4** via `@tailwindcss/vite` + CSS variables |
| Hosting | **GitHub Pages** (Actions workflow) |

`HashRouter` is used so the app works on static hosting without server-side
rewrite rules.

### Scripts (`package.json`)
- `dev` — Vite dev server (HMR)
- `build` — `tsc -b && vite build` (typecheck, then bundle)
- `preview` — serve the production build locally
- `typecheck` — `tsc -b --noEmit`

### Deployment (`.github/workflows/deploy.yml`)
On push to `main`: `npm ci` → `npm run build` (with `VITE_BASE_PATH=/aplus-prep/`)
→ publish `./dist` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.
The base path is env-configurable in `vite.config.ts` (`VITE_BASE_PATH`, default
`/aplus-prep/`), so it can be re-hosted elsewhere by changing one variable.

### Theme
Dark mode is hardcoded: `<html class="dark">` in `index.html` plus CSS custom
properties in `src/index.css`. There is no light-mode toggle.

---

## 2. Directory layout

```
src/
  main.tsx / App.tsx          # mount + router; wraps app in 3 context providers
  index.css                   # Tailwind import + dark-theme CSS variables
  pages/                      # one component per route
    Home, Domain, Objective, Flashcards, Questions, Exam,
    WeakSpots, Settings, NotFound
  components/Layout.tsx        # top nav + <Outlet/>
  content/                    # ALL study content (data, schema, loader)
    topics/*.json             #   per-objective study notes
    flashcards/*.json         #   per-objective flashcard decks
    questions/*.json          #   per-objective quiz pools
    objectives.ts             #   exam objective list + domain weightings
    weak-spots.ts             #   curated cross-objective "high-value" topics
    schemas.ts                #   TS interfaces for all content
    content-loader.ts         #   eager glob loader + validation
  questions/                  # rendering + grading engine (decoupled from content)
    QuestionRenderer.tsx      #   polymorphic renderer (switch on question.type)
    grading.ts                #   isCorrect() + seededShuffle()
    types.ts                  #   Answer union type
  progress/  srs/  quiz/      # three React Context providers (localStorage-backed)
  weakspots/aggregate.ts      # combines srs + quiz state into per-topic scores
  data/exportImport.ts        # export / import / reset all progress as JSON
```

### Routes (`src/App.tsx`)
```
/                               Home (dashboard: domains + progress)
/domain/:domainNum              Domain (objectives in a domain)
/objective/:objectiveId         Objective (topic notes)
/objective/:objectiveId/flashcards   Flashcards (SM2 study session)
/objective/:objectiveId/questions    Questions (practice w/ feedback)
/exam                           Exam (timed 90-question mock)
/weak-spots                     WeakSpots (performance dashboard)
/settings                       Settings (export/import/reset)
/*                              NotFound
```

---

## 3. State & persistence

There is **no backend**. Three independent React Context providers hold state,
each persisted to its own `localStorage` key. Each loads from storage on mount
and auto-saves on change via `useEffect`.

| Context | File | Tracks | localStorage key |
|---|---|---|---|
| Progress | `progress/ProgressContext.tsx` | per-objective status: `unreviewed` / `reviewed` / `shaky` / `solid` | `aplus-prep:progress:v1` |
| SRS | `srs/SrsContext.tsx` | per-flashcard SM2 state (efactor, interval, repetition, dueAt, lapses) | `aplus-prep:srs:v1` |
| Quiz | `quiz/QuizContext.tsx` | per-question result (`correct`, `attemptedAt`, `objectiveId`) | `aplus-prep:quiz:v1` |

- **Spaced repetition** (`srs/sm2.ts`) implements the SM2 algorithm. Grades
  0/3/4/5 ("Again/Hard/Good/Easy") adjust efactor and schedule the next due date.
- **Weak-spot scoring** (`weakspots/aggregate.ts`) reads SRS + quiz state, matches
  it against `weakSpotTags`, and produces a 0–100 score per topic
  (≈60% flashcard strength + 40% quiz accuracy) bucketed into
  `no-data` / `needs-work` / `getting-there` / `solid`.
- **Export/import** (`data/exportImport.ts`) bundles all three stores into a
  versioned JSON file for download/restore. Settings page also offers a full reset.

---

## 4. Content & question system

### Authoring model
All content is **hand-authored JSON**. There is **no generator script, no AI
pipeline, and no API** — content is added by writing JSON files that match the
loader's glob pattern.

### Loading (`content/content-loader.ts`)
Uses Vite's `import.meta.glob('./<dir>/*.json', { eager: true })` to pull every
content file into the bundle at build time, validates that each references a known
objective ID (and that there are no duplicates), and caches the result into
`Map<ObjectiveId, ...>` lookups. **Adding content = adding a JSON file**; there is
no central registry to update.

### File organization
Content is grouped **by exam objective**, one file per objective per content type:

```
content/questions/1.1.json     content/flashcards/1.1.json     content/topics/1.1.json
content/questions/1.2.json     ...                             ...
```

Each questions file is shaped:
```json
{ "objective": "1.1", "questions": [ /* ... */ ] }
```

### Question schema (`content/schemas.ts`)
Every question shares a base shape:
```ts
{
  id: string;            // e.g. "1.1.q.001"
  stem: string;          // the prompt
  explanation: string;   // shown after submit
  trap?: string;         // common-wrong-answer note
  tags?: string[];
  weakSpotTags?: WeakSpotTag[];
  sourceTranscript: string;
  needsReview: boolean;
  type: QuestionType;
}
```

Five question types, each with its own answer fields and grading rule
(`questions/grading.ts`):

| `type` | Extra fields | Correct when |
|---|---|---|
| `multiple-choice` | `choices[]`, `correct: id` | selected id === `correct` |
| `multi-select` | `choices[]`, `correct: id[]` | selected set === `correct` set |
| `ordering` | `items[]`, `correctOrder: id[]` | sequence matches exactly |
| `matching` | `pairs[]` (left↔right) | every pair mapped correctly |
| `sorting` | `buckets[]`, `items[]` (`correctBucket`) | every item in correct bucket |

Example:
```json
{
  "id": "1.1.q.001",
  "type": "multiple-choice",
  "stem": "A 6 GB file must move from Windows to a Mac via USB drive. Which filesystem?",
  "choices": [
    { "id": "a", "text": "FAT32" },
    { "id": "b", "text": "NTFS" },
    { "id": "c", "text": "exFAT" },
    { "id": "d", "text": "APFS" }
  ],
  "correct": "c",
  "explanation": "exFAT is cross-platform and supports files larger than 4 GB.",
  "trap": "FAT32 is also cross-platform but caps individual files at 4 GB.",
  "tags": ["filesystems", "exfat", "fat32"],
  "sourceTranscript": "pm-1202-file-systems",
  "needsReview": false
}
```

### Rendering & grading flow
```
content/*.json
  → content-loader.ts (eager glob, validate, cache into Maps)
  → page (Questions.tsx / Exam.tsx) reads from the Map
  → QuestionRenderer.tsx (switch on question.type)
  → user answer (Answer union, questions/types.ts)
  → grading.isCorrect(question, answer)
  → QuizContext.recordResult(...)  → localStorage
```

### Two study modes
- **Practice** (`/objective/:id/questions`): one objective at a time; submit shows
  the explanation/trap immediately; records each result.
- **Exam** (`/exam`): `seededShuffle` selects 90 questions from the pool, 90-minute
  timer, no per-question feedback, full review at the end.

---

## 5. Current content state (important for restructuring)

The objective structure is **fully scaffolded but only partially authored**:

- `objectives.ts` declares **36 objectives across 4 domains** (Domain 1: 11,
  Domain 2: 11, Domain 3: 4, Domain 4: 10) with exam weightings (≈28% / 28% /
  23% / 21%).
- **Only Domain 1 (objectives 1.1–1.11) has content today** — 11 files each in
  `questions/`, `flashcards/`, and `topics/`.
- That amounts to **~96 questions total**. Domains 2–4 have no content files yet.
- The `sorting` question type is fully wired in the renderer and grader but has
  **zero authored questions**.

So there is a real gap between the *designed* structure (36 objectives) and the
*current* content (Domain 1 only).

---

## 6. Notes for restructuring

- **Clean content/render seam.** `content/` (data + schema + loader) is decoupled
  from `questions/` (renderer + grader). You can change how content is stored
  without touching the renderer, as long as you still produce the `Question` /
  `Answer` types in `schemas.ts` / `questions/types.ts`.
- **Build-time bundling.** Content is pulled in via `import.meta.glob(..., { eager: true })`.
  Moving to an API/CMS means replacing `content-loader.ts` with an async loader and
  having pages handle loading/error states (currently everything is synchronous).
- **IDs are load-bearing.** Progress is keyed by `objectiveId`, card id, and
  question id (e.g. `1.1.q.001`) across three separate `localStorage` stores.
  Changing any id format silently invalidates saved progress. Keys are `:v1`-suffixed
  and there's a versioned export bundle — plan a migration if you renumber.
- **Tags are free-form strings.** `tags` / `weakSpotTags` are scattered across
  question and flashcard JSON and referenced by `weak-spots.ts` and `aggregate.ts`,
  with no runtime enum enforcement. Centralizing/validating tags would reduce typos.
- **Author format first, then content.** Since Domains 2–4 are empty, decide on any
  schema/id changes *before* authoring them to avoid re-migrating later.
- **Light test/validation coverage.** Guardrails are limited to `content-loader.ts`
  ID validation and `tsc` typechecking; there are no unit tests. A schema validator
  (e.g. Zod) or content lint step would help as content scales.
