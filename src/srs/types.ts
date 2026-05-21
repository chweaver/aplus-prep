export type Grade = 0 | 3 | 4 | 5;

export const GRADE_LABEL: Record<Grade, string> = {
  0: 'Again',
  3: 'Hard',
  4: 'Good',
  5: 'Easy',
};

export interface CardSrsState {
  efactor: number;
  interval: number;
  repetition: number;
  dueAt: number;
  lapses: number;
  reviewedAt: number;
}

export interface SrsState {
  version: 1;
  cards: Record<string, CardSrsState>;
}

export const EMPTY_SRS: SrsState = {
  version: 1,
  cards: {},
};

export const DAY_MS = 24 * 60 * 60 * 1000;
