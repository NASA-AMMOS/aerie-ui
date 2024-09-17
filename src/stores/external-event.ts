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
  gql.SUB_PLAN_EXTERNAL_EVENTS_DG,
  { derivation_group_names: selectedPlanDerivationGroupNames },
  [],
  null,
  transformExternalEvents,
);
export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

// use to track which event is selected in the plan view, as this information is shared across several sibling panels
export const selectedExternalEventId: Writable<ExternalEventId | null> = writable(null);

/* Derived. */
export const externalEventsMap: Readable<Dictionary<ExternalEventDB>> = derived(externalEventsDB, $externalEventsDB => {
  return keyBy($externalEventsDB, getRowIdExternalEventWhole);
});

export const selectedExternalEvent: Readable<ExternalEventDB | null> = derived(
  [selectedExternalEventId, externalEventsMap],
  ([$selectedExternalEventId, $externalEventsMap]) => {
    if ($selectedExternalEventId !== null) {
      return $externalEventsMap[$selectedExternalEventId] || null;
    }
    return null;
  },
);

export const externalEvents: Readable<ExternalEvent[]> = derived(externalEventsDB, $externalEventsDB => {
  return $externalEventsDB.map(externalEvent => {
    return {
      ...externalEvent,
      duration_ms: convertDurationToMs(externalEvent.duration),
      start_ms: convertUTCtoMs(externalEvent.start_time),
    };
  });
});

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

function transformExternalEvents(
  externalEventsDB: {
    external_event: {
      derivation_group_name: string;
      duration: string;
      event_type_name: string;
      key: string;
      properties: object;
      source_key: string;
      start_time: string;
    };
  }[],
): ExternalEventDB[] {
  const completeExternalEventDB: ExternalEventDB[] = [];
  if (externalEventsDB !== null && externalEventsDB !== undefined) {
    externalEventsDB
      .flatMap(externalEvent => externalEvent.external_event)
      .forEach(externalEvent => {
        completeExternalEventDB.push({
          duration: externalEvent.duration,
          pkey: {
            derivation_group_name: externalEvent.derivation_group_name,
            event_type_name: externalEvent.event_type_name,
            key: externalEvent.key,
            source_key: externalEvent.source_key,
          },
          properties: externalEvent.properties,
          start_time: externalEvent.start_time,
        });
      });
  }
  return completeExternalEventDB;
}
