import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]"
          >
            A+ Core 2 (220-1202) Prep
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/weak-spots"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Weak spots
            </Link>
            <Link
              to="/exam"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Exam mode
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
