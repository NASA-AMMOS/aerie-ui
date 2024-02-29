import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { Status } from '../enums/status';
import { plan, planId, planRevision } from '../stores/plan';
import type {
  SchedulingConditionDefinition,
  SchedulingConditionMetadata,
  SchedulingConditionMetadataResponse,
  SchedulingGoalAnalysis,
  SchedulingGoalDefinition,
  SchedulingGoalMetadata,
  SchedulingGoalMetadataResponse,
  SchedulingRequest,
  SchedulingSpec,
  SchedulingSpecCondition,
  SchedulingSpecGoal,
} from '../types/scheduling';
import gql from '../utilities/gql';
import { convertResponseToMetadata } from '../utilities/scheduling';
import { simulationDatasetsPlan } from './simulation';
import { gqlSubscribable } from './subscribable';
import { tags } from './tags';

/* Writeable. */

export const schedulingConditionMetadataId: Writable<number> = writable(-1);
export const schedulingGoalMetadataId: Writable<number> = writable(-1);

export const schedulingColumns: Writable<string> = writable('2fr 3px 1fr');
export const schedulingFormColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingConditionsFormColumns: Writable<string> = writable('1fr 3px 2fr');
export const schedulingGoalsColumns: Writable<string> = writable('1fr 3px 2fr');

/* Derived. */

export const selectedSpecId = derived(plan, $plan => $plan?.scheduling_specification?.id ?? null);

/* Subscriptions. */

export const schedulingSpec = gqlSubscribable<SchedulingSpec | null>(
  gql.SUB_SCHEDULING_SPEC,
  { planId },
  null,
  null,
  (specs: SchedulingSpec[]) => {
    if (specs && specs.length > 0) {
      return specs[0];
    }
    return null;
  },
);

export const schedulingRequests = gqlSubscribable<SchedulingRequest[]>(
  gql.SUB_SCHEDULING_REQUESTS,
  { specId: selectedSpecId },
  [],
  null,
);

export const schedulingConditionResponses = gqlSubscribable<SchedulingConditionMetadataResponse[]>(
  gql.SUB_SCHEDULING_CONDITIONS,
  {},
  [],
  null,
);

export const schedulingGoalResponses = gqlSubscribable<SchedulingGoalMetadataResponse[]>(
  gql.SUB_SCHEDULING_GOALS,
  {},
  [],
  null,
);

export const schedulingConditionResponse = gqlSubscribable<SchedulingConditionMetadataResponse | null>(
  gql.SUB_SCHEDULING_CONDITION,
  { id: schedulingConditionMetadataId },
  null,
  null,
);

export const schedulingGoalResponse = gqlSubscribable<SchedulingGoalMetadataResponse | null>(
  gql.SUB_SCHEDULING_GOAL,
  { id: schedulingGoalMetadataId },
  null,
  null,
);

export const schedulingSpecConditionsAll = gqlSubscribable<SchedulingSpecCondition[]>(
  gql.SUB_SCHEDULING_SPEC_CONDITIONS,
  { specification_id: selectedSpecId },
  [],
  null,
);

export const schedulingSpecGoalsAll = gqlSubscribable<SchedulingSpecGoal[]>(
  gql.SUB_SCHEDULING_SPEC_GOALS,
  { specification_id: selectedSpecId },
  [],
  null,
);

/* Derived. */
export const schedulingConditions = derived(
  [schedulingConditionResponses, tags],
  ([$schedulingConditionResponses, $tags]) => {
    return $schedulingConditionResponses.map(schedulingConditionResponse =>
      convertResponseToMetadata<SchedulingConditionMetadata, SchedulingConditionDefinition>(
        schedulingConditionResponse,
        $tags,
      ),
    );
  },
);

export const schedulingGoals = derived([schedulingGoalResponses, tags], ([$schedulingGoalResponses, $tags]) => {
  return $schedulingGoalResponses.map(schedulingGoalResponse =>
    convertResponseToMetadata<SchedulingGoalMetadata, SchedulingGoalDefinition>(schedulingGoalResponse, $tags),
  );
});

export const schedulingConditionMetadata = derived(
  [schedulingConditionResponse, tags],
  ([$schedulingConditionResponse, $tags]) => {
    if ($schedulingConditionResponse) {
      return convertResponseToMetadata<SchedulingConditionMetadata, SchedulingConditionDefinition>(
        $schedulingConditionResponse,
        $tags,
      );
    }
    return null;
  },
);

export const schedulingGoalMetadata = derived([schedulingGoalResponse, tags], ([$schedulingGoalResponse, $tags]) => {
  if ($schedulingGoalResponse) {
    return convertResponseToMetadata<SchedulingGoalMetadata, SchedulingGoalDefinition>($schedulingGoalResponse, $tags);
  }
  return null;
});

export const schedulingGoalsSpecification = derived(
  [selectedSpecId, schedulingGoalResponses],
  ([$selectedSpecId, $schedulingGoalsAll]) => {
    return $schedulingGoalsAll
      .filter(goal => goal.scheduling_specification_goal?.specification_id === $selectedSpecId)
      .map(goal => {
        return {
          ...goal,
          analyses: goal.analyses.filter(analysis => analysis.request.specification_id === $selectedSpecId),
        };
      });
  },
);

export const schedulingConditionsSpecification = derived(
  [selectedSpecId, schedulingConditionResponses],
  ([$selectedSpecId, $schedulingConditionsAll]) => {
    return $schedulingConditionsAll.map(schedulingSpecCondition => {
      return {
        ...schedulingSpecCondition,
        scheduling_specification_conditions: schedulingSpecCondition.scheduling_specification_conditions.filter(
          condition => condition.specification_id === $selectedSpecId,
        ),
      };
    });
  },
);

export const schedulingSpecConditions = derived(
  [selectedSpecId, schedulingSpecConditionsAll],
  ([$selectedSpecId, $schedulingSpecConditionsAll]) => {
    return $schedulingSpecConditionsAll
      .filter(schedulingSpecCondition => schedulingSpecCondition.specification_id === $selectedSpecId)
      .map(schedulingSpecCondition => {
        return {
          ...schedulingSpecCondition,
          condition: {
            ...schedulingSpecCondition.condition,
            scheduling_specification_conditions:
              schedulingSpecCondition.condition.scheduling_specification_conditions.filter(
                condition => condition.specification_id === $selectedSpecId,
              ),
          },
        };
      });
  },
);

export const schedulingSpecGoals = derived(
  [selectedSpecId, schedulingSpecGoalsAll],
  ([$selectedSpecId, $schedulingSpecGoalsAll]) => {
    return $schedulingSpecGoalsAll
      .filter(schedulingSpecGoal => schedulingSpecGoal.specification_id === $selectedSpecId)
      .map(specGoal => {
        return {
          ...specGoal,
          goal: {
            ...specGoal.goal,
            analyses: specGoal.goal.analyses.filter(analysis => analysis.request.specification_id === $selectedSpecId),
          },
        };
      });
  },
);

export const latestSchedulingGoalAnalyses = derived(
  [selectedSpecId, schedulingSpecGoals],
  ([$selectedSpecId, $schedulingSpecGoals]) => {
    const analysisIdToSpecGoalMap: Record<number, SchedulingGoalAnalysis[]> = {};
    let latestAnalysisId = -1;
    $schedulingSpecGoals.forEach(schedulingSpecGoal => {
      schedulingSpecGoal.goal.analyses.forEach(analysis => {
        if (analysis.request.specification_id !== $selectedSpecId) {
          return;
        }
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
  },
);

export const latestSchedulingRequest = derived([schedulingRequests], ([$schedulingRequests]) => {
  return $schedulingRequests[0] || null;
});

export const schedulingGoalCount = derived(
  latestSchedulingGoalAnalyses,
  $latestSchedulingGoalAnalyses => Object.keys($latestSchedulingGoalAnalyses).length,
);
export const satisfiedSchedulingGoalCount = derived(
  latestSchedulingGoalAnalyses,
  $latestSchedulingGoalAnalyses =>
    Object.values($latestSchedulingGoalAnalyses).filter(analysis => analysis.satisfied).length,
);

export const schedulingAnalysisStatus = derived(
  [
    latestSchedulingRequest,
    latestSchedulingGoalAnalyses,
    schedulingSpec,
    planRevision,
    schedulingGoalCount,
    schedulingGoals,
    satisfiedSchedulingGoalCount,
    simulationDatasetsPlan,
  ],
  ([
    $latestSchedulingRequest,
    $latestSchedulingGoalAnalyses,
    $schedulingSpec,
    $planRevision,
    $schedulingGoalCount,
    $schedulingGoals,
    $satisfiedSchedulingGoalCount,
    $simulationDatasetsPlan,
  ]) => {
    // No status if there are no requests
    if (!$latestSchedulingRequest || $schedulingGoals.length < 1) {
      return null;
    } else if ($latestSchedulingRequest.canceled) {
      return Status.Canceled;
    } else if ($latestSchedulingRequest.status === 'incomplete') {
      return Status.Incomplete;
    } else if ($latestSchedulingRequest.status === 'pending' && !$latestSchedulingRequest.canceled) {
      return Status.Pending;
    } else {
      let matchingSimDataset;
      if (typeof $latestSchedulingRequest.dataset_id === 'number') {
        matchingSimDataset = $simulationDatasetsPlan.find(d => d.dataset_id === $latestSchedulingRequest.dataset_id);
      }

      /*
        Stale if:
        - the latest scheduling request specifies a dataset id and the matching sim dataset's plan revision does not match the current plan revision
        - the latest scheduling request does not specify a dataset id and the scheduling spec's plan revision does not match the current plan revision
        - the scheduling spec revision does not match latest scheduling request revision
      */
      let schedulingPlanRevOutdated = false;
      if (matchingSimDataset) {
        schedulingPlanRevOutdated = !!matchingSimDataset && matchingSimDataset.plan_revision !== $planRevision;
      } else {
        schedulingPlanRevOutdated = !!$schedulingSpec && $schedulingSpec?.plan_revision !== $planRevision;
      }

      if (
        schedulingPlanRevOutdated ||
        ($schedulingSpec && $schedulingSpec.revision !== $latestSchedulingRequest.specification_revision)
      ) {
        return Status.Modified;
      } else if ($latestSchedulingRequest.status === 'failed') {
        return Status.Failed;
      } else if ($latestSchedulingRequest.status === 'success' && $latestSchedulingGoalAnalyses) {
        // If not all activities were satisfied, mark the status as failed
        if ($schedulingGoalCount !== $satisfiedSchedulingGoalCount) {
          return Status.Failed;
        } else {
          return Status.Complete;
        }
      }
    }
    return Status.Pending;
  },
);

export const enableScheduling: Readable<boolean> = derived([schedulingSpecGoals], ([$schedulingSpecGoals]) => {
  return $schedulingSpecGoals.filter(schedulingSpecGoal => schedulingSpecGoal.enabled).length > 0;
});
