import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OBJECTIVES_BY_ID, isObjectiveId, type ObjectiveId } from '../content/objectives';
import { loadContent } from '../content/content-loader';
import type { Question } from '../content/schemas';
import QuestionRenderer from '../questions/QuestionRenderer';
import { isCorrect } from '../questions/grading';
import type { Answer } from '../questions/types';

interface SessionState {
  index: number;
  answers: Record<string, Answer | null>;
  submitted: Record<string, boolean>;
  results: Record<string, boolean>;
  done: boolean;
}

export default function Questions() {
  const { objectiveId } = useParams();

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
  const qFile = loadContent().questions.get(objectiveId);
  const questions = qFile?.questions ?? [];

  if (questions.length === 0) {
    return (
      <div>
        <Link
          to={`/objective/${objectiveId}`}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          ← {meta.id} {meta.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Practice Questions</h1>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          No questions yet for this objective.
        </p>
      </div>
    );
  }

  return <LearnSession key={objectiveId} questions={questions} objectiveId={objectiveId} />;
}

function LearnSession({
  questions,
  objectiveId,
}: {
  questions: Question[];
  objectiveId: ObjectiveId;
}) {
  const meta = OBJECTIVES_BY_ID[objectiveId];

  const [session, setSession] = useState<SessionState>({
    index: 0,
    answers: {},
    submitted: {},
    results: {},
    done: false,
  });

  const q = questions[session.index];
  const currentAnswer = session.answers[q?.id] ?? null;
  const isSubmitted = q ? (session.submitted[q.id] ?? false) : false;
  const correct = q ? (session.results[q.id] ?? false) : false;

  const canSubmit = (() => {
    if (!q || isSubmitted) return false;
    if (!currentAnswer) return false;
    if (currentAnswer.type === 'multi-select') return currentAnswer.choiceIds.length > 0;
    if (currentAnswer.type === 'ordering') return currentAnswer.itemIds.length > 0;
    if (currentAnswer.type === 'matching') {
      const q2 = q as import('../content/schemas').MatchingQuestion;
      return q2.pairs.every((p) => (currentAnswer as import('../questions/types').MatchingAnswer).pairs[p.leftId]);
    }
    if (currentAnswer.type === 'sorting') {
      const q2 = q as import('../content/schemas').SortingQuestion;
      return q2.items.every((item) => (currentAnswer as import('../questions/types').SortingAnswer).assignments[item.id]);
    }
    return true;
  })();

  function handleChange(answer: Answer) {
    if (isSubmitted) return;
    setSession((s) => ({ ...s, answers: { ...s.answers, [q.id]: answer } }));
  }

  function handleSubmit() {
    const result = isCorrect(q, currentAnswer);
    setSession((s) => ({
      ...s,
      submitted: { ...s.submitted, [q.id]: true },
      results: { ...s.results, [q.id]: result },
    }));
  }

  function handleNext() {
    const nextIndex = session.index + 1;
    if (nextIndex >= questions.length) {
      setSession((s) => ({ ...s, done: true }));
    } else {
      setSession((s) => ({ ...s, index: nextIndex }));
    }
  }

  if (session.done) {
    const total = Object.keys(session.results).length;
    const numCorrect = Object.values(session.results).filter(Boolean).length;
    return (
      <SessionDone
        objectiveId={objectiveId}
        total={total}
        correct={numCorrect}
        onRestart={() =>
          setSession({ index: 0, answers: {}, submitted: {}, results: {}, done: false })
        }
      />
    );
  }

  const typeLabel: Record<string, string> = {
    'multiple-choice': 'Multiple choice',
    'multi-select': 'Select all that apply',
    ordering: 'Put in order',
    matching: 'Match items',
    sorting: 'Sort into categories',
  };

  return (
    <div>
      <Link
        to={`/objective/${objectiveId}`}
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        ← {meta.id} {meta.title}
      </Link>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Practice Questions</h1>
        <span className="text-xs tabular-nums text-[var(--color-muted)]">
          {session.index + 1} / {questions.length}
        </span>
      </div>

      <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {typeLabel[q.type] ?? q.type}
          </span>
          {isSubmitted && (
            <span
              className={`text-xs font-medium ${correct ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {correct ? 'Correct' : 'Incorrect'}
            </span>
          )}
        </div>

        <p className="mt-3 text-base leading-relaxed">{q.stem}</p>

        <QuestionRenderer
          question={q}
          answer={currentAnswer}
          submitted={isSubmitted}
          onChange={handleChange}
        />

        {isSubmitted && (
          <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-[var(--color-text)]">
              <span className="font-medium">Explanation: </span>
              {q.explanation}
            </p>
            {q.trap && (
              <p className="text-sm text-amber-300">
                <span className="font-medium">Common trap: </span>
                {q.trap}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!isSubmitted && (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="rounded border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)] disabled:opacity-40"
          >
            Submit
          </button>
        )}
        {isSubmitted && (
          <button
            type="button"
            onClick={handleNext}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-black/30"
          >
            {session.index + 1 < questions.length ? 'Next question →' : 'See results'}
          </button>
        )}
        {!isSubmitted && session.index + 1 < questions.length && (
          <button
            type="button"
            onClick={handleNext}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function SessionDone({
  objectiveId,
  total,
  correct,
  onRestart,
}: {
  objectiveId: ObjectiveId;
  total: number;
  correct: number;
  onRestart: () => void;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const meta = OBJECTIVES_BY_ID[objectiveId];
  return (
    <div>
      <Link
        to={`/objective/${objectiveId}`}
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        ← {meta.id} {meta.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Results</h1>
      <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="text-4xl font-semibold tabular-nums">
          {pct}%
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {correct} of {total} correct
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm hover:bg-black/30"
          >
            Retry all questions
          </button>
          <Link
            to={`/objective/${objectiveId}`}
            className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm hover:bg-black/30"
          >
            Back to objective
          </Link>
        </div>
      </div>
    </div>
  );
}
