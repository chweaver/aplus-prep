import { EMPTY_SRS, type SrsState } from './types';

const STORAGE_KEY = 'aplus-prep:srs:v1';

export function loadSrs(): SrsState {
  if (typeof localStorage === 'undefined') return EMPTY_SRS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_SRS;
  try {
    const parsed = JSON.parse(raw) as Partial<SrsState>;
    if (parsed?.version !== 1 || !parsed.cards) return EMPTY_SRS;
    return { version: 1, cards: parsed.cards };
  } catch {
    return EMPTY_SRS;
  }
}

export function saveSrs(state: SrsState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent: storage full or denied.
  }
}
