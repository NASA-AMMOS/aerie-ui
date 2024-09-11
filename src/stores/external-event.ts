import { keyBy } from 'lodash-es';
import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventId, ExternalEventPkey, ExternalEventType } from '../types/external-event';
import gql from '../utilities/gql';
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
export const externalEventsMap = derived(externalEventsDB, $externalEventsDB => {
  return keyBy($externalEventsDB, getRowIdExternalEventWhole);
});

export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventsMap],
  ([$selectedExternalEventId, $externalEventsMap]) => {
    if ($selectedExternalEventId !== null) {
      return $externalEventsMap[$selectedExternalEventId] || null;
    }
    return null;
  },
);

/** Helper functions. */
export function resetExternalEventStores() {
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

// Row/Hash Functions
export function getRowIdExternalEventWhole(externalEvent: ExternalEventDB): ExternalEventId {
  return (
    externalEvent.pkey.derivation_group_name +
    externalEvent.pkey.source_key +
    externalEvent.pkey.event_type_name +
    externalEvent.pkey.key
  );
}

export function getRowIdExternalEvent(externalEventPkey: ExternalEventPkey): ExternalEventId {
  return (
    externalEventPkey.derivation_group_name +
    externalEventPkey.source_key +
    externalEventPkey.event_type_name +
    externalEventPkey.key
  );
}

export function getRowIdExternalEventType(externalEventType: ExternalEventType): string {
  return externalEventType.name;
}
