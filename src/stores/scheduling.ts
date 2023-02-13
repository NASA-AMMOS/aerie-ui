import { derived, writable, type Writable } from 'svelte/store';
import { plan } from '../stores/plan';
import type {
  SchedulingCondition,
  SchedulingGoal,
  SchedulingSpecCondition,
  SchedulingSpecGoal,
} from '../types/scheduling';
import gql from '../utilities/gql';
import type { Status } from '../utilities/status';
import { gqlSubscribable } from './subscribable';

/* Writeable. */

export const schedulingColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingConditionsColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingGoalsColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingStatus: Writable<Status | null> = writable(null);

/* Derived. */

export const selectedSpecId = derived(plan, $plan => $plan?.scheduling_specifications[0]?.id ?? null);

/* Subscriptions. */

export const schedulingConditions = gqlSubscribable<SchedulingCondition[]>(gql.SUB_SCHEDULING_CONDITIONS, {}, []);

export const schedulingGoals = gqlSubscribable<SchedulingGoal[]>(gql.SUB_SCHEDULING_GOALS, {}, []);

export const schedulingSpecConditions = gqlSubscribable<SchedulingSpecCondition[]>(
  gql.SUB_SCHEDULING_SPEC_CONDITIONS,
  { specification_id: selectedSpecId },
  [],
);

export const schedulingSpecGoals = gqlSubscribable<SchedulingSpecGoal[]>(
  gql.SUB_SCHEDULING_SPEC_GOALS,
  { specification_id: selectedSpecId },
  [],
);

export const schedulingGoalCount = derived(schedulingSpecGoals, $schedulingSpecGoals => $schedulingSpecGoals.length);
export const satisfiedSchedulingGoalCount = derived(schedulingSpecGoals, $schedulingSpecGoals => {
  let count = 0;

  // Derive the number of satisfied scheduling goals from the last analysis
  $schedulingSpecGoals.forEach(schedulingSpecGoal => {
    // TODO how should we handle disabled goals? Enabling/disabling goals will trigger
    // a refresh of this data and we don't know if the last analysis included a goal
    // since it could have been disabled.
    if (schedulingSpecGoal.goal.analyses.length > 0) {
      const latestAnalysis = schedulingSpecGoal.goal.analyses[0];
      if (latestAnalysis.satisfied) {
        count++;
      }
    }
  });
  return count;
});

/* Helper Functions. */

export function resetSchedulingStores() {
  schedulingStatus.set(null);
}
