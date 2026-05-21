import { EMPTY_PROGRESS, type ProgressState } from './types';

const STORAGE_KEY = 'aplus-prep:progress:v1';

export function loadProgress(): ProgressState {
  if (typeof localStorage === 'undefined') return EMPTY_PROGRESS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (parsed?.version !== 1 || !parsed.objectives) return EMPTY_PROGRESS;
    return { version: 1, objectives: parsed.objectives };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent: storage full or denied. Progress is non-critical.
  }
}
