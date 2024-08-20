import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventPkey, ExternalEventType } from '../types/external-event';
import gql from '../utilities/gql';
import { selectedPlanDerivationGroupNames } from './external-source';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';
import { getRowIdExternalEvent } from '../utilities/hash';

/* Writeable. */
export const creatingExternalEventType: Writable<boolean> = writable(false);
export const createExternalEventTypeError: Writable<string | null> = writable(null);

/* Subscriptions. */
export const externalEventsDB = gqlSubscribable<ExternalEventDB[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS_DG,
  { derivation_group_names: selectedPlanDerivationGroupNames },
  [],
  null,
);
export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

// use to track which event is selected in the plan view, as this information is shared across several sibling panels
export const selectedExternalEventId: Writable<number | null> = writable(null);

/* Derived. */
export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventsDB],
  ([$selectedExternalEventId, $externalEventsDB]) => {
    // TODO: Can you just compare the Id type/object? I don't know if its smart enough to know to compare the fields
    const selected = $externalEventsDB.find(ee => getRowIdExternalEvent(ee.pkey))
    return selected !== undefined ? selected : null;
  }
);

/** Helper functions. */
export function resetModelStores() {
  createExternalEventTypeError.set(null);
}

export function selectExternalEvent(
  externalEventId: number | null,
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
