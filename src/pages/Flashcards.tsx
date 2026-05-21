import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OBJECTIVES_BY_ID, isObjectiveId, type ObjectiveId } from '../content/objectives';
import { loadContent } from '../content/content-loader';
import type { Flashcard } from '../content/schemas';
import { useSrs } from '../srs/SrsContext';
import { DAY_MS, GRADE_LABEL, type Grade } from '../srs/types';

type Mode = 'due' | 'all';

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

const EMPTY_STATS: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

const GRADE_OPTIONS: { grade: Grade; key: string; tone: string }[] = [
  { grade: 0, key: '1', tone: 'border-rose-500 text-rose-200 hover:bg-rose-500/15' },
  { grade: 3, key: '2', tone: 'border-amber-500 text-amber-200 hover:bg-amber-500/15' },
  { grade: 4, key: '3', tone: 'border-sky-500 text-sky-200 hover:bg-sky-500/15' },
  { grade: 5, key: '4', tone: 'border-emerald-500 text-emerald-200 hover:bg-emerald-500/15' },
];

function buildQueue(
  cards: Flashcard[],
  srsState: ReturnType<typeof useSrs>['state'],
  mode: Mode,
  now: number,
): Flashcard[] {
  if (mode === 'all') {
    return [...cards];
  }
  const due: Array<{ card: Flashcard; overdueBy: number }> = [];
  const fresh: Flashcard[] = [];
  for (const card of cards) {
    const state = srsState.cards[card.id];
    if (!state) {
      fresh.push(card);
    } else if (state.dueAt <= now) {
      due.push({ card, overdueBy: now - state.dueAt });
    }
  }
  due.sort((a, b) => b.overdueBy - a.overdueBy);
  return [...due.map((d) => d.card), ...fresh];
}

export default function Flashcards() {
  const { objectiveId } = useParams();
  const srs = useSrs();

  if (!objectiveId || !isObjectiveId(objectiveId)) {
    return (
      <div>
        <p className="text-sm text-[var(--color-muted)]">Unknown objective.</p>
        <Link to="/" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const meta = OBJECTIVES_BY_ID[objectiveId];
  const allCards = loadContent().flashcards.get(objectiveId)?.cards ?? [];

  if (allCards.length === 0) {
    return (
      <div>
        <Link
          to={`/objective/${objectiveId}`}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          ← {meta.id} {meta.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Flashcards</h1>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          No flashcards yet for this objective.
        </p>
      </div>
    );
  }

  return <FlashcardsSession key={objectiveId} cards={allCards} objectiveId={objectiveId} srs={srs} />;
}

interface SessionProps {
  cards: Flashcard[];
  objectiveId: ObjectiveId;
  srs: ReturnType<typeof useSrs>;
}

function FlashcardsSession({ cards, objectiveId, srs }: SessionProps) {
  const meta = OBJECTIVES_BY_ID[objectiveId];

  // Snapshot the SRS state at session start so the queue is stable.
  const initialQueue = useMemo(
    () => buildQueue(cards, srs.state, 'due', Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards],
  );
  const [queue, setQueue] = useState<Flashcard[]>(initialQueue);
  const [showBack, setShowBack] = useState(false);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [studied, setStudied] = useState(0);

  const current = queue[0];

  const restart = useCallback(
    (mode: Mode) => {
      setQueue(buildQueue(cards, srs.state, mode, Date.now()));
      setShowBack(false);
      setStats(EMPTY_STATS);
      setStudied(0);
    },
    [cards, srs.state],
  );

  const grade = useCallback(
    (g: Grade) => {
      if (!current) return;
      srs.recordReview(current.id, g);
      setStats((s) => {
        if (g === 0) return { ...s, again: s.again + 1 };
        if (g === 3) return { ...s, hard: s.hard + 1 };
        if (g === 4) return { ...s, good: s.good + 1 };
        return { ...s, easy: s.easy + 1 };
      });
      setStudied((n) => n + 1);
      setQueue((q) => {
        const [, ...rest] = q;
        return g === 0 ? [...rest, current] : rest;
      });
      setShowBack(false);
    },
    [current, srs],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!current) return;
      if (!showBack) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setShowBack(true);
        }
        return;
      }
      const key = e.key;
      const map: Record<string, Grade> = { '1': 0, '2': 3, '3': 4, '4': 5 };
      if (map[key] !== undefined) {
        e.preventDefault();
        grade(map[key]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, showBack, grade]);

  return (
    <div>
      <Link
        to={`/objective/${objectiveId}`}
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        ← {meta.id} {meta.title}
      </Link>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Flashcards</h1>
        <div className="text-xs tabular-nums text-[var(--color-muted)]">
          {queue.length} remaining · {studied} done
        </div>
      </div>

      {!current && <SessionDone cards={cards} stats={stats} studied={studied} onRestart={restart} />}

      {current && (
        <div className="mt-6">
          <article className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Question</div>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{current.front}</p>

            {showBack && (
              <>
                <div className="my-5 border-t border-dashed border-[var(--color-border)]" />
                <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Answer</div>
                <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{current.back}</p>
              </>
            )}
          </article>

          {!showBack && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowBack(true)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-black/30"
              >
                Show answer
              </button>
              <span className="text-xs text-[var(--color-muted)]">Space to reveal</span>
            </div>
          )}

          {showBack && (
            <div className="mt-4">
              <div className="grid grid-cols-4 gap-2">
                {GRADE_OPTIONS.map(({ grade: g, key, tone }) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => grade(g)}
                    className={`rounded border bg-[var(--color-surface)] px-2 py-3 text-sm transition-colors ${tone}`}
                  >
                    <div>{GRADE_LABEL[g]}</div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">{key}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Again returns this card later in the session. Hard/Good/Easy schedule it forward.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionDone({
  cards,
  stats,
  studied,
  onRestart,
}: {
  cards: Flashcard[];
  stats: SessionStats;
  studied: number;
  onRestart: (mode: Mode) => void;
}) {
  const { state } = useSrs();
  const now = Date.now();

  const nextDueAt = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    for (const card of cards) {
      const s = state.cards[card.id];
      if (s && s.dueAt > now) min = Math.min(min, s.dueAt);
    }
    return Number.isFinite(min) ? min : null;
  }, [cards, state, now]);

  const nextLabel = nextDueAt ? formatRelativeDays(nextDueAt - now) : null;

  return (
    <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      {studied === 0 ? (
        <>
          <h2 className="text-lg font-medium">No cards due right now</h2>
          {nextLabel && (
            <p className="mt-2 text-sm text-[var(--color-muted)]">Next card due {nextLabel}.</p>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-medium">Session complete</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {studied} reviews · Again {stats.again} · Hard {stats.hard} · Good {stats.good} · Easy {stats.easy}
          </p>
          {nextLabel && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">Next card due {nextLabel}.</p>
          )}
        </>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onRestart('all')}
          className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm hover:bg-black/30"
        >
          Study all {cards.length} cards
        </button>
        <button
          type="button"
          onClick={() => onRestart('due')}
          className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm hover:bg-black/30"
        >
          Re-check due
        </button>
      </div>
    </div>
  );
}

function formatRelativeDays(ms: number): string {
  const days = ms / DAY_MS;
  if (days < 1) {
    const hours = Math.max(1, Math.round(ms / (60 * 60 * 1000)));
    return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const rounded = Math.round(days);
  return `in ${rounded} day${rounded === 1 ? '' : 's'}`;
}
