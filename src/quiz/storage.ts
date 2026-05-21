import { EMPTY_QUIZ, type QuizState } from './types';

const STORAGE_KEY = 'aplus-prep:quiz:v1';

export function loadQuiz(): QuizState {
  if (typeof localStorage === 'undefined') return EMPTY_QUIZ;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_QUIZ;
  try {
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    if (parsed?.version !== 1 || !parsed.results) return EMPTY_QUIZ;
    return { version: 1, results: parsed.results };
  } catch {
    return EMPTY_QUIZ;
  }
}

export function saveQuiz(state: QuizState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent: storage full or denied.
  }
}
