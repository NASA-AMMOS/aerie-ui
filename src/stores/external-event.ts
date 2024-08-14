import { keyBy } from 'lodash-es';
import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventId, ExternalEventType } from '../types/external-event';
import gql from '../utilities/gql';
import { selectedPlanDerivationGroupIds } from './external-source';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

/* Writeable. */
export const creatingExternalEventType: Writable<boolean> = writable(false);
export const createExternalEventTypeError: Writable<string | null> = writable(null);

/* Subscriptions. */
export const externalEventsDB = gqlSubscribable<{ external_event: ExternalEventDB }[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS_DG,
  { derivation_group_ids: selectedPlanDerivationGroupIds },
  [],
  null,
);
export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

// use to track which event is selected in the plan view, as this information is shared across several sibling panels
export const selectedExternalEventId: Writable<ExternalEventId | null> = writable(null);

/* Derived. */
// just to prevent repeated lookups
export const externalEventsMap = derived([externalEventsDB], ([$externalEventsDB]) => keyBy($externalEventsDB, 'id'));

export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventsMap],
  ([$selectedExternalEventId, $externalEventsMap]) => {
    if ($selectedExternalEventId !== null) {
      const selected = $externalEventsMap[$selectedExternalEventId];
      return selected ? selected : null;
    }
    return null;
  },
);

/** Helper functions. */
export function resetModelStores() {
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

// Cannot access list form of a store in a .ts as it isn't a 'reactive' file like svelte. Thus, list must manually be passed in.
export function getEventTypeById(id: number, eventTypes: ExternalEventType[]): ExternalEventType | undefined {
  return eventTypes.find(eventType => eventType.id === id);
}

export function getEventTypeName(id: number, eventTypes: ExternalEventType[]): string | undefined {
  return eventTypes.find(eventType => eventType.id === id)?.name;
}

export function getEventTypeId(name: string, eventTypes: ExternalEventType[]): number | undefined {
  return eventTypes.find(eventType => eventType.name === name)?.id;
}
