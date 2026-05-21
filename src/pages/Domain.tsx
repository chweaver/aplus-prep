import { Link, useParams } from 'react-router-dom';
import {
  DOMAIN_NAMES,
  DOMAIN_PERCENT,
  OBJECTIVES_BY_DOMAIN,
  type Domain as DomainNum,
} from '../content/objectives';
import { loadContent } from '../content/content-loader';
import { useProgress } from '../progress/ProgressContext';
import { STATUS_LABEL, type ObjectiveStatus } from '../progress/types';

const STATUS_CLASS: Record<Exclude<ObjectiveStatus, 'unreviewed'>, string> = {
  reviewed: 'bg-sky-500/15 text-sky-300',
  shaky: 'bg-amber-500/15 text-amber-300',
  solid: 'bg-emerald-500/15 text-emerald-300',
};

function parseDomain(value: string | undefined): DomainNum | null {
  if (!value) return null;
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? (n as DomainNum) : null;
}

export default function Domain() {
  const { domainNum } = useParams();
  const domain = parseDomain(domainNum);

  if (!domain) {
    return (
      <div>
        <p className="text-sm text-[var(--color-muted)]">Unknown domain.</p>
        <Link to="/" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const objectives = OBJECTIVES_BY_DOMAIN[domain];
  const content = loadContent();
  const { getStatus } = useProgress();
  const totalMinutes = objectives.reduce((sum, o) => {
    const topic = content.topics.get(o.id);
    return sum + (topic?.estimatedMinutes ?? o.estimatedMinutes);
  }, 0);

  return (
    <div>
      <Link to="/" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]">
        ← All domains
      </Link>
      <div className="mt-2 flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">
          {domain}.0 {DOMAIN_NAMES[domain]}
        </h1>
        <span className="text-xs text-[var(--color-muted)]">{DOMAIN_PERCENT[domain]}% of exam</span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {objectives.length} objectives · ~{totalMinutes} min total
      </p>

      <ul className="mt-6 divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        {objectives.map((o) => {
          const topic = content.topics.get(o.id);
          const hasContent = !!topic;
          const isStub = topic?.needsReview ?? false;
          const status = getStatus(o.id);
          return (
            <li key={o.id}>
              <Link
                to={`/objective/${o.id}`}
                className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-black/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--color-muted)]">{o.id}</span>
                    {!hasContent && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                        empty
                      </span>
                    )}
                    {hasContent && isStub && (
                      <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-xs text-amber-300">
                        stub
                      </span>
                    )}
                    {status !== 'unreviewed' && (
                      <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_CLASS[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm leading-snug">{o.title}</div>
                </div>
                <div className="shrink-0 pt-0.5 text-xs tabular-nums text-[var(--color-muted)]">
                  ~{o.estimatedMinutes} min
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
