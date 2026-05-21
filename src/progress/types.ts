import type { ObjectiveId } from '../content/objectives';

export type ObjectiveStatus = 'unreviewed' | 'reviewed' | 'shaky' | 'solid';

export interface ObjectiveProgress {
  status: ObjectiveStatus;
  updatedAt: number;
}

export interface ProgressState {
  version: 1;
  objectives: Partial<Record<ObjectiveId, ObjectiveProgress>>;
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  objectives: {},
};

export const STATUS_LABEL: Record<ObjectiveStatus, string> = {
  unreviewed: 'Unreviewed',
  reviewed: 'Reviewed',
  shaky: 'Shaky',
  solid: 'Solid',
};
