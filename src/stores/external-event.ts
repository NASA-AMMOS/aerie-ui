import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventId, ExternalEventType, ExternalEventWithTypeName } from "../types/external-event";
import gql from '../utilities/gql';
import { selectedPlanExternalSourceIds } from './external-source';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

/* Writeable. */
export const creatingExternalEventType: Writable<boolean> = writable(false);
export const createExternalEventTypeError: Writable<string | null> = writable(null);

/* Subscriptions. */
export const externalEventsDB = gqlSubscribable<ExternalEventDB[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS,
  { source_ids: selectedPlanExternalSourceIds },
  [],
  null,
);

export const externalEventTypes = gqlSubscribable<ExternalEventType[]>(gql.SUB_EXTERNAL_EVENT_TYPES, {}, [], null);

export const selectedExternalEventId: Writable<ExternalEventId | null> = writable(null);

export function selectExternalEvent(
  externalEventId: ExternalEventId | null,
  switchToTable = true,
  switchToPanel = false,
): void {
  if (externalEventId !== null) {
    selectedExternalEventId.set(externalEventId);
    // TODO: flesh this out
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


/* Derived. */
export const externalEventWithTypeName = derived<[typeof externalEventsDB, typeof externalEventTypes], ExternalEventWithTypeName[]>(
  [externalEventsDB, externalEventTypes],
  ([$externalEventsDB, $externalEventTypes]) => $externalEventsDB.map(externalEvent => ({
    ...externalEvent,
    event_type: $externalEventTypes.find(eventType => eventType.id === externalEvent.event_type_id)?.name
  }))
);

export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventWithTypeName],
  ([$selectedExternalEventId, $externalEventsDB]) => {
    if ($selectedExternalEventId !== null) {
      let filtered = $externalEventsDB.filter(e => e.id == $selectedExternalEventId);
      if (filtered.length) {
        return filtered[0]
      } // TODO: REFACTOR WITH A MAP, EVENTUALLY.
    }
    return null;
  },
);