export interface QuestionResult {
  correct: boolean;
  attemptedAt: number;
  objectiveId: string;
}

export interface QuizState {
  version: 1;
  // Stores the last attempt for each question id
  results: Record<string, QuestionResult>;
}

export const EMPTY_QUIZ: QuizState = {
  version: 1,
  results: {},
};
