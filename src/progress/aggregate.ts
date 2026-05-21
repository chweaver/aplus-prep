import {
  OBJECTIVES_BY_DOMAIN,
  type Domain,
  type ObjectiveId,
} from '../content/objectives';
import type { ObjectiveStatus, ProgressState } from './types';

export interface DomainSummary {
  total: number;
  reviewed: number;
  shaky: number;
  solid: number;
  unreviewed: number;
}

function statusOf(state: ProgressState, id: ObjectiveId): ObjectiveStatus {
  return state.objectives[id]?.status ?? 'unreviewed';
}

export function summarizeDomain(state: ProgressState, domain: Domain): DomainSummary {
  const objectives = OBJECTIVES_BY_DOMAIN[domain];
  const summary: DomainSummary = {
    total: objectives.length,
    reviewed: 0,
    shaky: 0,
    solid: 0,
    unreviewed: 0,
  };
  for (const o of objectives) {
    summary[statusOf(state, o.id)] += 1;
  }
  return summary;
}
