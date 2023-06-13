import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { plan } from '../stores/plan';
import type {
  SchedulingCondition,
  SchedulingGoal,
  SchedulingGoalAnalysis,
  SchedulingSpecCondition,
  SchedulingSpecGoal,
} from '../types/scheduling';
import gql from '../utilities/gql';
import type { Status } from '../utilities/status';
import { gqlSubscribable } from './subscribable';

/* Writeable. */

export const schedulingColumns: Writable<string> = writable('2fr 3px 1fr');
export const schedulingFormColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingConditionsColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingGoalsColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingStatus: Writable<Status | null> = writable(null);

/* Derived. */

export const selectedSpecId = derived(plan, $plan => $plan?.scheduling_specifications[0]?.id ?? null);

/* Subscriptions. */

export const schedulingConditions = gqlSubscribable<SchedulingCondition[]>(gql.SUB_SCHEDULING_CONDITIONS, {}, [], null);

export const schedulingGoals = gqlSubscribable<SchedulingGoal[]>(gql.SUB_SCHEDULING_GOALS, {}, [], null);

export const schedulingSpecConditions = gqlSubscribable<SchedulingSpecCondition[]>(
  gql.SUB_SCHEDULING_SPEC_CONDITIONS,
  { specification_id: selectedSpecId },
  [],
  null,
);

export const schedulingSpecGoals = gqlSubscribable<SchedulingSpecGoal[]>(
  gql.SUB_SCHEDULING_SPEC_GOALS,
  { specification_id: selectedSpecId },
  [],
  null,
);

export const latestAnalyses = derived(schedulingSpecGoals, $schedulingSpecGoals => {
  const analysisIdToSpecGoalMap: Record<number, SchedulingGoalAnalysis[]> = {};
  let latestAnalysisId = -1;

  $schedulingSpecGoals.forEach(schedulingSpecGoal => {
    schedulingSpecGoal.goal.analyses.forEach(analysis => {
      if (!analysisIdToSpecGoalMap[analysis.analysis_id]) {
        analysisIdToSpecGoalMap[analysis.analysis_id] = [];
      }
      analysisIdToSpecGoalMap[analysis.analysis_id].push(analysis);
      if (analysis.analysis_id > latestAnalysisId) {
        latestAnalysisId = analysis.analysis_id;
      }
    });
  });

  return analysisIdToSpecGoalMap[latestAnalysisId] || [];
});

export const schedulingGoalCount = derived(latestAnalyses, $latestAnalyses => Object.keys($latestAnalyses).length);
export const satisfiedSchedulingGoalCount = derived(
  latestAnalyses,
  $latestAnalyses => Object.values($latestAnalyses).filter(analysis => analysis.satisfied).length,
);

export const enableScheduling: Readable<boolean> = derived([schedulingSpecGoals], ([$schedulingSpecGoals]) => {
  return $schedulingSpecGoals.filter(schedulingSpecGoal => schedulingSpecGoal.enabled).length > 0;
});

/* Helper Functions. */

export function resetSchedulingStores() {
  schedulingStatus.set(null);
}
