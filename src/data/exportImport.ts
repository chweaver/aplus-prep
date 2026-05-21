import type { ProgressState } from '../progress/types';
import type { SrsState } from '../srs/types';
import type { QuizState } from '../quiz/types';

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  progress: ProgressState;
  srs: SrsState;
  quiz: QuizState;
}

// ── Export ─────────────────────────────────────────────────────

export function buildBundle(
  progress: ProgressState,
  srs: SrsState,
  quiz: QuizState,
): ExportBundle {
  return { version: 1, exportedAt: Date.now(), progress, srs, quiz };
}

export function downloadBundle(bundle: ExportBundle): void {
  const date = new Date(bundle.exportedAt).toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aplus-prep-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ─────────────────────────────────────────────────────

type ImportResult =
  | { ok: true; bundle: ExportBundle }
  | { ok: false; error: string };

export function parseBundle(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Unexpected file format.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj['version'] !== 1) {
    return { ok: false, error: `Unknown export version: ${obj['version']}` };
  }
  if (typeof obj['exportedAt'] !== 'number') {
    return { ok: false, error: 'Missing exportedAt field.' };
  }
  if (!obj['progress'] || typeof obj['progress'] !== 'object') {
    return { ok: false, error: 'Missing or invalid progress data.' };
  }
  if (!obj['srs'] || typeof obj['srs'] !== 'object') {
    return { ok: false, error: 'Missing or invalid SRS data.' };
  }
  if (!obj['quiz'] || typeof obj['quiz'] !== 'object') {
    return { ok: false, error: 'Missing or invalid quiz data.' };
  }

  return { ok: true, bundle: obj as unknown as ExportBundle };
}

export function applyBundle(bundle: ExportBundle): void {
  localStorage.setItem('aplus-prep:progress:v1', JSON.stringify(bundle.progress));
  localStorage.setItem('aplus-prep:srs:v1', JSON.stringify(bundle.srs));
  localStorage.setItem('aplus-prep:quiz:v1', JSON.stringify(bundle.quiz));
}
