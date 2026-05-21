import type { ObjectiveId } from '../content/objectives';
import { useProgress } from '../progress/ProgressContext';
import { STATUS_LABEL } from '../progress/types';

const OPTIONS = ['reviewed', 'shaky', 'solid'] as const;

const ACTIVE_CLASS: Record<(typeof OPTIONS)[number], string> = {
  reviewed: 'border-sky-500 bg-sky-500/15 text-sky-200',
  shaky: 'border-amber-500 bg-amber-500/15 text-amber-200',
  solid: 'border-emerald-500 bg-emerald-500/15 text-emerald-200',
};

export default function StatusPicker({ objectiveId }: { objectiveId: ObjectiveId }) {
  const { getStatus, setStatus } = useProgress();
  const current = getStatus(objectiveId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Status</span>
      <div className="flex gap-1.5">
        {OPTIONS.map((option) => {
          const active = current === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(objectiveId, active ? 'unreviewed' : option)}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? ACTIVE_CLASS[option]
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              aria-pressed={active}
            >
              {STATUS_LABEL[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
