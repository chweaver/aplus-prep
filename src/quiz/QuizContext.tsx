import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadQuiz, saveQuiz } from './storage';
import { type QuestionResult, type QuizState } from './types';

interface QuizContextValue {
  state: QuizState;
  getResult: (questionId: string) => QuestionResult | undefined;
  recordResult: (questionId: string, correct: boolean, objectiveId: string) => void;
}

const Ctx = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(loadQuiz);

  useEffect(() => {
    saveQuiz(state);
  }, [state]);

  const getResult = useCallback(
    (questionId: string): QuestionResult | undefined => state.results[questionId],
    [state],
  );

  const recordResult = useCallback(
    (questionId: string, correct: boolean, objectiveId: string) => {
      setState((prev) => ({
        ...prev,
        results: {
          ...prev.results,
          [questionId]: { correct, attemptedAt: Date.now(), objectiveId },
        },
      }));
    },
    [],
  );

  const value = useMemo<QuizContextValue>(
    () => ({ state, getResult, recordResult }),
    [state, getResult, recordResult],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQuiz(): QuizContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useQuiz must be used within QuizProvider');
  return value;
}
