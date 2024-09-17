import type { Dictionary } from 'lodash';
import { keyBy } from 'lodash-es';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { ExternalEvent, ExternalEventDB, ExternalEventId, ExternalEventType } from '../types/external-event';
import { getRowIdExternalEventWhole } from '../utilities/externalEvents';
import gql from '../utilities/gql';
import { convertDurationToMs, convertUTCtoMs } from '../utilities/time';
import { selectedPlanDerivationGroupNames } from './external-source';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

/* Writeable. */
export const creatingExternalEventType: Writable<boolean> = writable(false);
export const createExternalEventTypeError: Writable<string | null> = writable(null);

/* Subscriptions. */
export const externalEventsDB = gqlSubscribable<ExternalEventDB[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS_DERIVATION_GROUP,
  { derivation_group_names: selectedPlanDerivationGroupNames },
  [],
  null,
);
export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

// use to track which event is selected in the plan view, as this information is shared across several sibling panels
export const selectedExternalEventId: Writable<ExternalEventId | null> = writable(null);

/* Derived. */
export const externalEvents: Readable<ExternalEvent[]> = derived(externalEventsDB, $externalEventsDB => {
  return $externalEventsDB.map(externalEvent => {
    return {
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
    };
  });
});

export const externalEventsMap: Readable<Dictionary<ExternalEvent>> = derived(externalEvents, $externalEventsDB => {
  return keyBy($externalEventsDB, getRowIdExternalEventWhole);
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
