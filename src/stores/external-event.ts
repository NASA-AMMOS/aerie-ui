import type { Dictionary } from 'lodash';
import { keyBy } from 'lodash-es';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { ExternalEvent, ExternalEventDB, ExternalEventId, ExternalEventType } from '../types/external-event';
import { getRowIdExternalEventWhole } from '../utilities/externalEvents';
import gql from '../utilities/gql';
import { convertDoyToYmd, convertDurationToMs, convertUTCtoMs } from '../utilities/time';
import { selectedPlanDerivationGroupNames } from './external-source';
import { plan } from './plan';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

/* Writeable. */
export const creatingExternalEventType: Writable<boolean> = writable(false);
export const createExternalEventTypeError: Writable<string | null> = writable(null);

/* Subscriptions. */
export const externalEventsRaw = gqlSubscribable<{ external_event: ExternalEventDB }[] | null | undefined>(
  gql.SUB_PLAN_EXTERNAL_EVENTS_DERIVATION_GROUP,
  { derivation_group_names: selectedPlanDerivationGroupNames },
  [],
  null,
);
export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

// use to track which event is selected in the plan view, as this information is shared across several sibling panels
export const selectedExternalEventId: Writable<ExternalEventId | null> = writable(null);

/* Derived. */
export const externalEvents: Readable<ExternalEvent[]> = derived(
  [externalEventsRaw, plan],
  ([$externalEventsRaw, $plan]) => {
    const completeExternalEvents: ExternalEvent[] = [];
    if ($externalEventsRaw !== null && $externalEventsRaw !== undefined) {
      // get plan bounds in an easily comparable format. The explicit strings are extreme bounds in case of a null plan.
      const planStartTime = convertUTCtoMs(
        convertDoyToYmd($plan?.start_time_doy ?? '1970-001T00:00:00Z') ?? '1970-01-01T00:00:00Z',
      );
      const planEndTime = convertUTCtoMs(
        convertDoyToYmd($plan?.end_time_doy ?? '2100-001T00:00:00Z') ?? '2100-01-01T00:00:00Z',
      );

      $externalEventsRaw.forEach(e => {
        // stored in this fashion as a byproduct of the GQL subscription query.
        const externalEvent = e.external_event;

        // check event is in plan bounds
        const externalEventStartTime = convertUTCtoMs(externalEvent.start_time);
        const externalEventEndTime = externalEventStartTime + convertDurationToMs(externalEvent.duration);

        if (
          (externalEventStartTime >= planStartTime && externalEventStartTime <= planEndTime) ||
          (externalEventEndTime <= planEndTime && externalEventEndTime >= planStartTime)
        ) {
          completeExternalEvents.push({
            duration: externalEvent.duration,
            duration_ms: convertDurationToMs(externalEvent.duration),
            pkey: {
              derivation_group_name: externalEvent.derivation_group_name,
              event_type_name: externalEvent.event_type_name,
              key: externalEvent.key,
              source_key: externalEvent.source_key,
            },
            properties: externalEvent.properties,
            start_ms: convertUTCtoMs(externalEvent.start_time),
            start_time: externalEvent.start_time,
          });
        }
      });
    }
    return completeExternalEvents;
  },
);

export const externalEventsMap: Readable<Dictionary<ExternalEvent>> = derived(externalEvents, $externalEvents => {
  return keyBy($externalEvents, getRowIdExternalEventWhole);
});

export const selectedExternalEvent: Readable<ExternalEvent | null> = derived(
  [selectedExternalEventId, externalEventsMap],
  ([$selectedExternalEventId, $externalEventsMap]) => {
    if ($selectedExternalEventId !== null) {
      return $externalEventsMap[$selectedExternalEventId] || null;
    }
    return null;
  },
);

/** Helper functions. */
export function resetExternalEventStores(): void {
  createExternalEventTypeError.set(null);
}

export function selectExternalEvent(
  externalEventId: ExternalEventId | null,
  switchToTable = true,
  switchToPanel = false,
): void {
  if (externalEventId !== null) {
    selectedExternalEventId.set(externalEventId);
    if (switchToTable) {
      viewUpdateGrid({ middleComponentBottom: 'ExternalEventsTablePanel' });
    }
    if (switchToPanel) {
      viewUpdateGrid({ rightComponentTop: 'ExternalEventFormPanel' });
    }
  } else {
    selectedExternalEventId.set(null);
  }
}
