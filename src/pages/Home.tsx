import { Link } from 'react-router-dom';
import {
  DOMAIN_NAMES,
  DOMAIN_PERCENT,
  OBJECTIVES_BY_DOMAIN,
  type Domain,
} from '../content/objectives';

const DOMAINS: Domain[] = [1, 2, 3, 4];

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        CompTIA A+ Core 2 (220-1202)
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Pick a domain to drill into objectives. Content fills in as transcripts are ingested.
      </p>

      <ul className="mt-8 divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        {DOMAINS.map((d) => (
          <li key={d}>
            <Link
              to={`/domain/${d}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-black/30"
            >
              <div>
                <div className="font-medium">
                  {d}.0 {DOMAIN_NAMES[d]}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {OBJECTIVES_BY_DOMAIN[d].length} objectives
                </div>
              </div>
              <div className="text-sm tabular-nums text-[var(--color-muted)]">
                {DOMAIN_PERCENT[d]}%
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
