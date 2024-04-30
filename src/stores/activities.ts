import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type {
  ActivityDirective,
  ActivityDirectiveId,
  ActivityDirectiveValidationStatus,
  ActivityDirectivesMap,
  AnchorValidationStatus,
} from '../types/activity';
import type { ActivityMetadataDefinition } from '../types/activity-metadata';
import type { SpanId } from '../types/simulation';
import gql from '../utilities/gql';
import { getActivityDirectiveStartTimeMs } from '../utilities/time';
import { initialPlan, planId } from './plan';
import { selectedSpanId, spanUtilityMaps, spansMap } from './simulation';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

/* Subscriptions. */

export const activityDirectives = gqlSubscribable<ActivityDirective[]>(
  gql.SUB_ACTIVITY_DIRECTIVES,
  { planId },
  [],
  null,
);

export const anchorValidationStatuses = gqlSubscribable<AnchorValidationStatus[]>(
  gql.SUB_ANCHOR_VALIDATION_STATUS,
  { planId },
  [],
  null,
);

export const activityMetadataDefinitions = gqlSubscribable<ActivityMetadataDefinition[]>(
  gql.SUB_ACTIVITY_DIRECTIVE_METADATA_SCHEMAS,
  {},
  [],
  null,
);

export const activityDirectiveValidationStatuses = gqlSubscribable<ActivityDirectiveValidationStatus[]>(
  gql.SUB_ACTIVITY_DIRECTIVE_VALIDATIONS,
  { planId },
  [],
  null,
);

/* Writeable. */

export const activityDirectivesMap: Writable<ActivityDirectivesMap> = writable({});

export const selectedActivityDirectiveId: Writable<ActivityDirectiveId | null> = writable(null);

/* Derived. */

export const activityDirectivesList: Readable<ActivityDirective[]> = derived(
  [activityDirectivesMap, initialPlan, spansMap, spanUtilityMaps],
  ([$activityDirectivesMap, $initialPlan, $spansMap, $spanUtilityMaps]) => {
    const cachedStartTimes = {};
    return Object.values($activityDirectivesMap).map(directive => {
      if (!$initialPlan || !$initialPlan.start_time) {
        return directive;
      }
      const startTimeMs = getActivityDirectiveStartTimeMs(
        directive.id,
        $initialPlan.start_time,
        $initialPlan.end_time_doy,
        $activityDirectivesMap,
        $spansMap,
        $spanUtilityMaps,
        cachedStartTimes,
      );
      directive.start_time_ms = startTimeMs;
      return directive;
    });
  },
);

export const selectedActivityDirective = derived(
  [activityDirectivesMap, selectedActivityDirectiveId],
  ([$activityDirectivesMap, $selectedActivityDirectiveId]) => {
    if ($selectedActivityDirectiveId !== null) {
      return $activityDirectivesMap[$selectedActivityDirectiveId] || null;
    }
    return null;
  },
);

/* Helper Functions. */

export function selectActivity(
  activityDirectiveId: ActivityDirectiveId | null,
  spanId: SpanId | null,
  switchToTable = true,
  switchToPanel = false,
): void {
  if (activityDirectiveId !== null && spanId === null) {
    selectedSpanId.set(null);
    selectedActivityDirectiveId.set(activityDirectiveId);
    if (switchToTable) {
      viewUpdateGrid({ middleComponentBottom: 'ActivityDirectivesTablePanel' });
    }
    if (switchToPanel) {
      viewUpdateGrid({ rightComponentTop: 'ActivityFormPanel' });
    }
  } else if (activityDirectiveId === null && spanId !== null) {
    selectedSpanId.set(spanId);
    selectedActivityDirectiveId.set(null);
    if (switchToTable) {
      viewUpdateGrid({ middleComponentBottom: 'ActivitySpansTablePanel' });
    }
    if (switchToPanel) {
      viewUpdateGrid({ rightComponentTop: 'ActivityFormPanel' });
    }
  } else {
    selectedSpanId.set(null);
    selectedActivityDirectiveId.set(null);
  }
}

export function resetActivityStores() {
  activityMetadataDefinitions.updateValue(() => []);
  activityDirectivesMap.set({});
  selectedActivityDirectiveId.set(null);
  activityDirectives.updateValue(() => []);
  anchorValidationStatuses.updateValue(() => []);
  activityMetadataDefinitions.updateValue(() => []);
  activityDirectiveValidationStatuses.updateValue(() => []);
}
