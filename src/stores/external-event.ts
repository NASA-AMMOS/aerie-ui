import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventType } from '../types/external-event';
import gql from '../utilities/gql';
import { getRowIdExternalEvent } from '../utilities/hash';
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
export const selectedExternalEventId: Writable<number | null> = writable(null);

/* Derived. */
export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventsDB],
  ([$selectedExternalEventId, $externalEventsDB]) => {
    const selected = $externalEventsDB.find(ee => getRowIdExternalEvent(ee.pkey) === $selectedExternalEventId);
    return selected !== undefined ? selected : null;
  },
);

/** Helper functions. */
export function resetModelStores() {
  createExternalEventTypeError.set(null);
}

export function selectExternalEvent(externalEventId: number | null, switchToTable = true, switchToPanel = false): void {
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
      .flatMap(ee => ee.external_event)
      .forEach(ee => {
        completeExternalEventDB.push({
          duration: ee.duration,
          pkey: {
            derivation_group_name: ee.derivation_group_name,
            event_type_name: ee.event_type_name,
            key: ee.key,
            source_key: ee.source_key,
          },
          properties: ee.properties,
          start_time: ee.start_time,
        });
      });
  }
  return completeExternalEventDB;
}
