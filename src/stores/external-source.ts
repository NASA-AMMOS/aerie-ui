import { writable, type Writable } from 'svelte/store';
import type { ExternalSourceSlim } from '../types/external-source';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingExternalSource: Writable<boolean> = writable(false);

export const createExternalSourceError: Writable<string | null> = writable(null);

// export const initialExternalSource: Writable<Model | null> = writable(null);

/* Derived. */
// export const externalSourceId: Readable<number> = derived(initialExternalSource, $external_source => ($external_source ? $external_source.id : -1));

/* Subscriptions. */

// export const externalSource = gqlSubscribable<Model>(gql.SUB_MODEL, { id: externalSourceId }, null, null);

export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);

/* Helper Functions. */

export function resetModelStores() {
  creatingExternalSource.set(false);
  createExternalSourceError.set(null);
}
