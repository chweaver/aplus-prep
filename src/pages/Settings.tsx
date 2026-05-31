import { useRef, useState } from 'react';
import { useProgress } from '../progress/ProgressContext';
import { useSrs } from '../srs/SrsContext';
import { useQuiz } from '../quiz/QuizContext';
import {
  applyBundle,
  buildBundle,
  downloadBundle,
  parseBundle,
} from '../data/exportImport';

type ImportStatus =
  | { phase: 'idle' }
  | { phase: 'success'; date: string }
  | { phase: 'error'; message: string };

export default function Settings() {
  const { state: progress } = useProgress();
  const { state: srs } = useSrs();
  const { state: quiz } = useQuiz();

  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ phase: 'idle' });

  function handleExport() {
    const bundle = buildBundle(progress, srs, quiz);
    downloadBundle(bundle);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus({ phase: 'idle' });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result;
      if (typeof raw !== 'string') {
        setImportStatus({ phase: 'error', message: 'Could not read file.' });
        return;
      }
      const result = parseBundle(raw);
      if (!result.ok) {
        setImportStatus({ phase: 'error', message: result.error });
        return;
      }
      applyBundle(result.bundle);
      const date = new Date(result.bundle.exportedAt).toLocaleDateString();
      setImportStatus({ phase: 'success', date });
      // Reload so all contexts re-hydrate from the new localStorage data.
      setTimeout(() => window.location.reload(), 1200);
    };
    reader.onerror = () =>
      setImportStatus({ phase: 'error', message: 'File read failed.' });
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  const progressCount = Object.keys(progress.objectives).length;
  const srsCount = Object.keys(srs.cards).length;
  const quizCount = Object.keys(quiz.results).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Data</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Export your progress to a file you can back up or move to another device.
        Import overwrites all current data.
      </p>

      <div className="mt-6 space-y-4">
        {/* Export */}
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-medium">Export progress</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Downloads a JSON file containing all three stores.
          </p>
          <ul className="mt-3 space-y-0.5 text-xs text-[var(--color-muted)]">
            <li>{progressCount} objective status{progressCount !== 1 ? 'es' : ''} saved</li>
            <li>{srsCount} flashcard SRS record{srsCount !== 1 ? 's' : ''}</li>
            <li>{quizCount} question result{quizCount !== 1 ? 's' : ''}</li>
          </ul>
          <button
            type="button"
            onClick={handleExport}
            disabled={progressCount + srsCount + quizCount === 0}
            className="mt-4 rounded border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
          >
            Export
          </button>
          {progressCount + srsCount + quizCount === 0 && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Nothing to export yet - study some content first.
            </p>
          )}
        </section>

        {/* Import */}
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-medium">Import progress</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Select a previously exported JSON file. This replaces all current data
            and reloads the page.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 rounded border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm hover:bg-black/30"
          >
            Choose file...
          </button>

          {importStatus.phase === 'success' && (
            <p className="mt-3 text-sm text-emerald-400">
              Imported progress from {importStatus.date}. Reloading...
            </p>
          )}
          {importStatus.phase === 'error' && (
            <p className="mt-3 text-sm text-rose-400">{importStatus.message}</p>
          )}
        </section>

        {/* Reset */}
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-medium">Reset all data</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Permanently clears all progress, flashcard schedules, and question results.
          </p>
          <ResetButton />
        </section>
      </div>
    </div>
  );
}

function ResetButton() {
  const [confirming, setConfirming] = useState(false);

  function doReset() {
    localStorage.removeItem('aplus-prep:progress:v2');
    localStorage.removeItem('aplus-prep:srs:v2');
    localStorage.removeItem('aplus-prep:quiz:v2');
    window.location.reload();
  }

  if (confirming) {
    return (
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-rose-400">Are you sure? This cannot be undone.</span>
        <button
          type="button"
          onClick={doReset}
          className="rounded border border-rose-500 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20"
        >
          Yes, reset
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="mt-4 rounded border border-rose-800/60 bg-transparent px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
    >
      Reset all data
    </button>
  );
}
