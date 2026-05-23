import { Link } from 'react-router-dom';
import {
  DOMAIN_NAMES,
  DOMAIN_PERCENT,
  type Domain,
} from '../content/objectives';
import { useProgress } from '../progress/ProgressContext';
import { summarizeDomain } from '../progress/aggregate';

const DOMAINS: Domain[] = [1, 2, 3, 4];

export default function Home() {
  const { state } = useProgress();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        CompTIA A+ Core 2 (220-1202)
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Pick a domain to drill into objectives, flashcards, and practice questions.
      </p>

      <ul className="mt-8 divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        {DOMAINS.map((d) => {
          const summary = summarizeDomain(state, d);
          const denom = summary.total || 1;
          const solidPct = (summary.solid / denom) * 100;
          const shakyPct = (summary.shaky / denom) * 100;
          const reviewedPct = (summary.reviewed / denom) * 100;
          return (
            <li key={d}>
              <Link
                to={`/domain/${d}`}
                className="block px-4 py-3 hover:bg-black/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {d}.0 {DOMAIN_NAMES[d]}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {summary.total > 0 ? (
                        <>
                          {summary.solid} solid · {summary.shaky} shaky · {summary.reviewed} reviewed ·{' '}
                          {summary.unreviewed} untouched
                        </>
                      ) : (
                        <>No objectives available yet</>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums text-[var(--color-muted)]">
                    <div className="text-sm">{DOMAIN_PERCENT[d]}% of exam</div>
                    <div className="mt-0.5">
                      {summary.total} available / {summary.totalAll} total
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-sm bg-black/40">
                  <div className="h-full bg-emerald-500/70" style={{ width: `${solidPct}%` }} />
                  <div className="h-full bg-amber-500/70" style={{ width: `${shakyPct}%` }} />
                  <div className="h-full bg-sky-500/70" style={{ width: `${reviewedPct}%` }} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
