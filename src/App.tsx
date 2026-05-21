const DOMAINS = [
  { num: 1, name: 'Operating Systems', pct: 28, objectives: 11 },
  { num: 2, name: 'Security', pct: 28, objectives: 11 },
  { num: 3, name: 'Software Troubleshooting', pct: 23, objectives: 4 },
  { num: 4, name: 'Operational Procedures', pct: 21, objectives: 10 },
];

export default function App() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          CompTIA A+ Core 2 (220-1202)
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Rapid prep site. Placeholder build. Content loads as transcripts are ingested.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-medium">Exam domains</h2>
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          {DOMAINS.map((d) => (
            <li key={d.num} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">
                  {d.num}.0 {d.name}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {d.objectives} objectives
                </div>
              </div>
              <div className="text-sm tabular-nums text-[var(--color-muted)]">
                {d.pct}%
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 text-xs text-[var(--color-muted)]">
        Build: placeholder. Domain percentages from official 220-1202 v4.0 objectives.
      </footer>
    </main>
  );
}
