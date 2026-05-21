import { DAY_MS, type CardSrsState, type Grade } from './types';

const INITIAL_EF = 2.5;

export function newCardState(now: number): CardSrsState {
  return {
    efactor: INITIAL_EF,
    interval: 0,
    repetition: 0,
    dueAt: now,
    lapses: 0,
    reviewedAt: 0,
  };
}

export function review(prev: CardSrsState | undefined, grade: Grade, now: number): CardSrsState {
  const base = prev ?? newCardState(now);
  let { efactor, interval, repetition, lapses } = base;

  if (grade < 3) {
    repetition = 0;
    interval = 1;
    lapses += 1;
  } else {
    repetition += 1;
    if (repetition === 1) interval = 1;
    else if (repetition === 2) interval = 6;
    else interval = Math.max(1, Math.round(interval * efactor));
  }

  efactor = Math.max(
    1.3,
    efactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
  );

  return {
    efactor: round2(efactor),
    interval,
    repetition,
    dueAt: now + interval * DAY_MS,
    lapses,
    reviewedAt: now,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
