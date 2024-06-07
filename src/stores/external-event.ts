import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalEventDB, ExternalEventId } from "../types/external-event";
import gql from '../utilities/gql';
import { selectedPlanExternalSourceIds } from './external-source';
import { gqlSubscribable } from './subscribable';
import { viewUpdateGrid } from './views';

export const externalEventsDB = gqlSubscribable<ExternalEventDB[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS,
  { source_ids: selectedPlanExternalSourceIds },
  [],
  null,
);

export const externalEventTypes = derived(
  externalEventsDB,
  ($externalEventsDB) => $externalEventsDB.map(event => event.event_type).filter((val, index, arr) => arr.indexOf(val) === index) // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
);

export const selectedExternalEventId: Writable<ExternalEventId | undefined> = writable(undefined);

export function selectExternalEvent(
  externalEventId: ExternalEventId | undefined,
  switchToTable = true,
  switchToPanel = false,
): void {
  if (externalEventId !== undefined) {
    selectedExternalEventId.set(externalEventId);
    // TODO: flesh this out
    if (switchToTable) {
      viewUpdateGrid({ middleComponentBottom: 'ExternalEventsTablePanel' });
    }
    if (switchToPanel) {
      viewUpdateGrid({ rightComponentTop: 'ExternalEventFormPanel' });
    }
  } else {
    selectedExternalEventId.set(undefined);
  }
}

export const selectedExternalEvent = derived(
  [selectedExternalEventId, externalEventsDB],
  ([$selectedExternalEventId, $externalEventsDB]) => {
    if ($selectedExternalEventId !== null) {
      return $externalEventsDB.filter(e => e.id == $selectedExternalEventId) || null; // TODO: REFACTOR WITH A MAP, EVENTUALLY.
    }
    return null;
  },
);