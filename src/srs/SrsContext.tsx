import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadSrs, saveSrs } from './storage';
import { review } from './sm2';
import { EMPTY_SRS, type CardSrsState, type Grade, type SrsState } from './types';

interface SrsContextValue {
  state: SrsState;
  getCardState: (cardId: string) => CardSrsState | undefined;
  recordReview: (cardId: string, grade: Grade) => void;
}

const Ctx = createContext<SrsContextValue | null>(null);

export function SrsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SrsState>(EMPTY_SRS);

  useEffect(() => {
    setState(loadSrs());
  }, []);

  useEffect(() => {
    saveSrs(state);
  }, [state]);

  const getCardState = useCallback(
    (cardId: string): CardSrsState | undefined => state.cards[cardId],
    [state],
  );

  const recordReview = useCallback((cardId: string, grade: Grade) => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: review(prev.cards[cardId], grade, now) },
    }));
  }, []);

  const value = useMemo<SrsContextValue>(
    () => ({ state, getCardState, recordReview }),
    [state, getCardState, recordReview],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSrs(): SrsContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useSrs must be used within SrsProvider');
  return value;
}
