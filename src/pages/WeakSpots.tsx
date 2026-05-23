import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSrs } from '../srs/SrsContext';
import { useQuiz } from '../quiz/QuizContext';
import {
  aggregateWeakSpots,
  hasAvailableContent,
  sortByWeakest,
  type TagSummary,
  type TagStrength,
} from '../weakspots/aggregate';
import { hasFlashcards, hasQuestions, isObjectiveAvailable } from '../content/content-loader';
import { isObjectiveId } from '../content/objectives';

const STRENGTH_META: Record<TagStrength, { label: string; bar: string; text: string }> = {
  'needs-work':    { label: 'Needs work',    bar: 'bg-rose-500',    text: 'text-rose-400' },
  'getting-there': { label: 'Getting there', bar: 'bg-amber-500',   text: 'text-amber-400' },
  'solid':         { label: 'Solid',         bar: 'bg-emerald-500', text: 'text-emerald-400' },
  'no-data':       { label: 'Not started',   bar: 'bg-zinc-600',    text: 'text-zinc-500' },
};

export default function WeakSpots() {
  const { state: srs } = useSrs();
  const { state: quiz } = useQuiz();

  const summaries = useMemo(
    () => sortByWeakest(aggregateWeakSpots(srs, quiz).filter(hasAvailableContent)),
    [srs, quiz],
  );

  const hasAnyData = summaries.some((s) => s.strength !== 'no-data');

  return (
    <div>
      <h1 className="text-2xl font-semibold">Weak-spot Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Tracks the 12 high-value topics CompTIA tests most aggressively.
        Sorted weakest first. Improves as you study flashcards and answer questions.
      </p>

      {!hasAnyData && (
        <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
          No study data yet. Answer questions or study flashcards to see your weak spots.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {summaries.map((s) => (
          <TagCard key={s.tag} summary={s} />
        ))}
      </ul>
    </div>
  );
}

function TagCard({ summary: s }: { summary: TagSummary }) {
  const sm = STRENGTH_META[s.strength];

  const studyLinks = useMemo(() => {
    const links: Array<{ label: string; to: string }> = [];
    for (const objId of s.relatedObjectives) {
      if (!isObjectiveId(objId)) continue;
      if (!isObjectiveAvailable(objId)) continue;
      if (hasFlashcards(objId)) {
        links.push({ label: `${objId} cards`, to: `/objective/${objId}/flashcards` });
      }
      if (hasQuestions(objId)) {
        links.push({ label: `${objId} questions`, to: `/objective/${objId}/questions` });
      }
    }
    return links;
  }, [s.relatedObjectives]);

  const barWidth = s.strength === 'no-data' ? 4 : Math.max(4, s.score);

  return (
    <li className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{s.label}</span>
            <span className={`text-xs ${sm.text}`}>{sm.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{s.blurb}</p>
        </div>
        {s.strength !== 'no-data' && (
          <span className={`shrink-0 font-mono text-sm tabular-nums ${sm.text}`}>
            {s.score}%
          </span>
        )}
      </div>

      {/* Strength bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-black/40">
        <div
          className={`h-full rounded-sm transition-all ${sm.bar} opacity-80`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
        {s.cardTotal > 0 && (
          <span>
            Cards: {s.cardSeen}/{s.cardTotal} seen
            {s.cardSeen > 0 && (
              <> · {s.cardStrong} strong · {s.cardWeak} weak</>
            )}
          </span>
        )}
        {s.questionTotal > 0 && (
          <span>
            Questions: {s.questionAttempted > 0
              ? `${s.questionCorrect}/${s.questionAttempted} correct`
              : `${s.questionTotal} available`}
          </span>
        )}
        {s.cardTotal === 0 && s.questionTotal === 0 && (
          <span>No tagged content available yet</span>
        )}
      </div>

      {/* Study links */}
      {studyLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {studyLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)]/30"
            >
              {l.label} →
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}
