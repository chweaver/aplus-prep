import { useEffect, useMemo } from 'react';
import type {
  MatchingQuestion,
  MultipleChoiceQuestion,
  MultiSelectQuestion,
  OrderingQuestion,
  Question,
  SortingQuestion,
} from '../content/schemas';
import { seededShuffle } from './grading';
import type { Answer } from './types';

interface Props {
  question: Question;
  answer: Answer | null;
  submitted: boolean;
  onChange: (a: Answer) => void;
}

export default function QuestionRenderer(props: Props) {
  const { question } = props;
  switch (question.type) {
    case 'multiple-choice': return <MultipleChoice {...props} question={question} />;
    case 'multi-select':    return <MultiSelect    {...props} question={question} />;
    case 'ordering':        return <Ordering       {...props} question={question} />;
    case 'matching':        return <Matching       {...props} question={question} />;
    case 'sorting':         return <Sorting        {...props} question={question} />;
  }
}

// ── Multiple choice ────────────────────────────────────────────

function MultipleChoice({
  question,
  answer,
  submitted,
  onChange,
}: Props & { question: MultipleChoiceQuestion }) {
  const chosen = answer?.type === 'multiple-choice' ? answer.choiceId : null;

  function rowStyle(id: string) {
    if (!submitted) return chosen === id ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--color-border)]';
    if (id === question.correct) return 'border-emerald-500 bg-emerald-500/10';
    if (id === chosen) return 'border-rose-500 bg-rose-500/10';
    return 'border-[var(--color-border)] opacity-50';
  }

  return (
    <ul className="mt-4 space-y-2">
      {question.choices.map((c) => (
        <li key={c.id}>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded border p-3 text-sm transition-colors ${rowStyle(c.id)}`}
          >
            <input
              type="radio"
              className="mt-0.5 shrink-0 accent-[var(--color-accent)]"
              name={question.id}
              value={c.id}
              checked={chosen === c.id}
              disabled={submitted}
              onChange={() => onChange({ type: 'multiple-choice', choiceId: c.id })}
            />
            <span>{c.text}</span>
            {submitted && c.id === question.correct && (
              <span className="ml-auto shrink-0 text-emerald-400">Correct</span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}

// ── Multi-select ───────────────────────────────────────────────

function MultiSelect({
  question,
  answer,
  submitted,
  onChange,
}: Props & { question: MultiSelectQuestion }) {
  const chosen = answer?.type === 'multi-select' ? answer.choiceIds : [];

  function toggle(id: string) {
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
    onChange({ type: 'multi-select', choiceIds: next });
  }

  function rowStyle(id: string) {
    if (!submitted) return chosen.includes(id) ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--color-border)]';
    const shouldBeSelected = question.correct.includes(id);
    const wasSelected = chosen.includes(id);
    if (shouldBeSelected) return 'border-emerald-500 bg-emerald-500/10';
    if (wasSelected) return 'border-rose-500 bg-rose-500/10';
    return 'border-[var(--color-border)] opacity-50';
  }

  return (
    <ul className="mt-4 space-y-2">
      {question.choices.map((c) => (
        <li key={c.id}>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded border p-3 text-sm transition-colors ${rowStyle(c.id)}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 shrink-0 accent-[var(--color-accent)]"
              checked={chosen.includes(c.id)}
              disabled={submitted}
              onChange={() => toggle(c.id)}
            />
            <span>{c.text}</span>
            {submitted && question.correct.includes(c.id) && (
              <span className="ml-auto shrink-0 text-emerald-400">Correct</span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}

// ── Ordering ───────────────────────────────────────────────────

function Ordering({
  question,
  answer,
  submitted,
  onChange,
}: Props & { question: OrderingQuestion }) {
  const shuffled = useMemo(
    () => seededShuffle(question.items, question.id).map((i) => i.id),
    [question.id, question.items],
  );

  const order = answer?.type === 'ordering' ? answer.itemIds : shuffled;

  useEffect(() => {
    if (!answer) onChange({ type: 'ordering', itemIds: shuffled });
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const other = idx + dir;
    [next[idx], next[other]] = [next[other], next[idx]];
    onChange({ type: 'ordering', itemIds: next });
  }

  function itemStyle(itemId: string, idx: number) {
    if (!submitted) return 'border-[var(--color-border)]';
    const correctIdx = question.correctOrder.indexOf(itemId);
    return correctIdx === idx ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10';
  }

  const itemMap = Object.fromEntries(question.items.map((i) => [i.id, i.text]));

  return (
    <ol className="mt-4 space-y-2">
      {order.map((itemId, idx) => (
        <li
          key={itemId}
          className={`flex items-center gap-3 rounded border p-3 text-sm ${itemStyle(itemId, idx)}`}
        >
          <span className="w-5 shrink-0 text-center font-mono text-xs text-[var(--color-muted)]">
            {idx + 1}
          </span>
          <span className="flex-1">{itemMap[itemId]}</span>
          {!submitted && (
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
                className="rounded px-1.5 py-0.5 text-xs text-[var(--color-muted)] hover:bg-black/40 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={idx === order.length - 1}
                onClick={() => move(idx, 1)}
                className="rounded px-1.5 py-0.5 text-xs text-[var(--color-muted)] hover:bg-black/40 disabled:opacity-30"
              >
                ↓
              </button>
            </span>
          )}
          {submitted && (
            <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
              →{question.correctOrder.indexOf(itemId) + 1}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

// ── Matching ───────────────────────────────────────────────────

function Matching({
  question,
  answer,
  submitted,
  onChange,
}: Props & { question: MatchingQuestion }) {
  const pairs = answer?.type === 'matching' ? answer.pairs : {};

  function select(leftId: string, rightId: string) {
    onChange({ type: 'matching', pairs: { ...pairs, [leftId]: rightId } });
  }

  const rightOptions = question.pairs.map((p) => ({ id: p.rightId, text: p.rightText }));

  function rowStyle(leftId: string) {
    if (!submitted) return 'border-[var(--color-border)]';
    const correct = question.pairs.find((p) => p.leftId === leftId)?.rightId;
    return pairs[leftId] === correct ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10';
  }

  return (
    <ul className="mt-4 space-y-2">
      {question.pairs.map((p) => {
        const correctRight = question.pairs.find((q) => q.leftId === p.leftId)!.rightText;
        return (
          <li key={p.leftId} className={`flex flex-col gap-2 rounded border p-3 text-sm sm:flex-row sm:items-center ${rowStyle(p.leftId)}`}>
            <span className="min-w-0 flex-1 font-medium">{p.leftText}</span>
            {submitted ? (
              <span className="text-sm text-[var(--color-muted)]">{correctRight}</span>
            ) : (
              <select
                value={pairs[p.leftId] ?? ''}
                disabled={submitted}
                onChange={(e) => select(p.leftId, e.target.value)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm sm:w-64"
              >
                <option value="" disabled>Select...</option>
                {rightOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.text}</option>
                ))}
              </select>
            )}
            {submitted && pairs[p.leftId] && pairs[p.leftId] !== question.pairs.find(q => q.leftId === p.leftId)?.rightId && (
              <span className="text-xs text-rose-400">
                Your answer: {rightOptions.find(r => r.id === pairs[p.leftId])?.text}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Sorting ────────────────────────────────────────────────────

function Sorting({
  question,
  answer,
  submitted,
  onChange,
}: Props & { question: SortingQuestion }) {
  const assignments = answer?.type === 'sorting' ? answer.assignments : {};

  function assign(itemId: string, bucketId: string) {
    const current = assignments[itemId];
    onChange({
      type: 'sorting',
      assignments: { ...assignments, [itemId]: current === bucketId ? '' : bucketId },
    });
  }

  function itemStyle(itemId: string) {
    if (!submitted) return 'border-[var(--color-border)]';
    const item = question.items.find((i) => i.id === itemId)!;
    return assignments[itemId] === item.correctBucket
      ? 'border-emerald-500 bg-emerald-500/10'
      : 'border-rose-500 bg-rose-500/10';
  }

  return (
    <ul className="mt-4 space-y-3">
      {question.items.map((item) => (
        <li key={item.id} className={`rounded border p-3 text-sm ${itemStyle(item.id)}`}>
          <div className="mb-2">{item.text}</div>
          <div className="flex flex-wrap gap-2">
            {question.buckets.map((b) => {
              const chosen = assignments[item.id] === b.id;
              const correct = submitted && item.correctBucket === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => assign(item.id, b.id)}
                  className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                    correct
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                      : chosen
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
          {submitted && (
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              Correct: {question.buckets.find((b) => b.id === item.correctBucket)?.label}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
