import {
  OBJECTIVES_BY_DOMAIN,
  type Domain,
  type ObjectiveId,
} from '../content/objectives';
import { isObjectiveAvailable } from '../content/content-loader';
import type { ObjectiveStatus, ProgressState } from './types';

export interface DomainSummary {
  // Denominator for progress: count of available objectives only.
  total: number;
  // Full objective count regardless of availability, for "X available / Y total" displays.
  totalAll: number;
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
  const available = objectives.filter((o) => isObjectiveAvailable(o.id));
  const summary: DomainSummary = {
    total: available.length,
    totalAll: objectives.length,
    reviewed: 0,
    shaky: 0,
    solid: 0,
    unreviewed: 0,
  };
  for (const o of available) {
    summary[statusOf(state, o.id)] += 1;
  }
  return summary;
}
