# Content directory

Source of truth for all study material. One JSON file per objective per content type.

## Layout

```
content/
  objectives.ts            canonical 36-objective list (do not add objectives elsewhere)
  schemas.ts               TypeScript types; every JSON file must conform
  weak-spots.ts            closed enum of 12 featured weak-spot tags
  content-loader.ts        eager imports all JSON at build time
  topics/{objective}.json
  flashcards/{objective}.json
  questions/{objective}.json
```

## Filename rules

- Filename matches the objective ID exactly: `1.1.json`, `2.10.json`, `4.10.json`.
- The `objective` field inside the file must match the filename and exist in `objectives.ts`.
- The content loader will crash the build if these are out of sync.

## When a new transcript comes in

For each objective the transcript covers:

1. **Topics** (`topics/<id>.json`): append a subtopic with distilled notes. Set `needsReview: false` once content is solid.
2. **Flashcards** (`flashcards/<id>.json`): append cards with unique IDs.
3. **Questions** (`questions/<id>.json`): append questions of any of the five supported types.
4. Add the transcript ID to the topic's `sources` array, and to each card/question's `sourceTranscript`.

## Conventions

### `needsReview`
- `true` means: incomplete, unclear, or guessed. The UI surfaces a yellow flag.
- File-level (on `TopicFile`) means the whole objective needs work.
- Item-level (on a card/question) means just that item needs work.
- A file with empty `sources` and `needsReview: true` is a stub awaiting real content.

### Weak-spot tagging
Add a `weakSpotTags` array to any subtopic, card, or question. The Weak-Spot dashboard auto-aggregates every tagged item, so you do not duplicate content between an objective page and a weak-spot page.

The TypeScript type `WeakSpotTag` is a closed union, so unknown tags fail to compile.

### IDs
- Subtopic: `<objective>.<slug>` (e.g. `1.1.filesystems`)
- Flashcard: `<objective>.fc.<nnn>` (e.g. `1.1.fc.001`)
- Question: `<objective>.q.<nnn>` or `<objective>.q.<slug>` (e.g. `2.6.q.10-step-order`)

IDs are global keys used to track progress in localStorage. They must not change once shipped.

## Question types

Five variants, all sharing `id`, `stem`, `explanation`, optional `trap`, etc.

| Type | Purpose | Key fields |
|---|---|---|
| `multiple-choice` | Pick one | `choices[]`, `correct: string` |
| `multi-select` | Pick many | `choices[]`, `correct: string[]` |
| `ordering` | Drag to order (e.g. 10-step malware removal) | `items[]`, `correctOrder: string[]` |
| `matching` | Pair left to right | `pairs[]` (left/right with text) |
| `sorting` | Drag into buckets | `buckets[]`, `items[]` with `correctBucket` |

See `questions/1.1.json` for one working example of each type.

## Don't

- Don't put real content in template stubs (`needsReview: true`, empty sources). They exist only as schema examples.
- Don't invent facts not in transcripts. If a question needs context the transcript doesn't supply, set `needsReview: true` and flag it in commit message.
- Don't reuse IDs across files.
