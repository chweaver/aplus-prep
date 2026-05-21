import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ObjectiveId } from '../content/objectives';
import { loadProgress, saveProgress } from './storage';
import {
  EMPTY_PROGRESS,
  type ObjectiveStatus,
  type ProgressState,
} from './types';

interface ProgressContextValue {
  state: ProgressState;
  getStatus: (id: ObjectiveId) => ObjectiveStatus;
  setStatus: (id: ObjectiveId, status: ObjectiveStatus) => void;
}

const Ctx = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY_PROGRESS);

  useEffect(() => {
    setState(loadProgress());
  }, []);

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  const getStatus = useCallback(
    (id: ObjectiveId): ObjectiveStatus => state.objectives[id]?.status ?? 'unreviewed',
    [state],
  );

  const setStatus = useCallback((id: ObjectiveId, status: ObjectiveStatus) => {
    setState((prev) => {
      const nextObjectives = { ...prev.objectives };
      if (status === 'unreviewed') {
        delete nextObjectives[id];
      } else {
        nextObjectives[id] = { status, updatedAt: Date.now() };
      }
      return { ...prev, objectives: nextObjectives };
    });
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({ state, getStatus, setStatus }),
    [state, getStatus, setStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useProgress must be used within ProgressProvider');
  return value;
}
