import { derived, writable, type Writable } from 'svelte/store';
import type { ExternalSourceSlim, PlanExternalSource } from '../types/external-source';
import gql from '../utilities/gql';
import { planId } from './plan';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingExternalSource: Writable<boolean> = writable(false);
export const createExternalSourceError: Writable<string | null> = writable(null);

/* Derived. */

/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);

// use to keep track of associations between plans and goals
export const planExternalSourceLinks = gqlSubscribable<PlanExternalSource[]>(gql.SUB_PLAN_EXTERNAL_SOURCE, {}, [], null);
export const selectedPlanExternalSourceIds = derived(
  [planExternalSourceLinks, planId],
  ([$planExternalSourceLinks, $planId]) => $planExternalSourceLinks.filter(link => link.plan_id === $planId).map(link => link.external_source_id)
);

/* Helper Functions. */
export function resetModelStores() {
  creatingExternalSource.set(false);
  createExternalSourceError.set(null);
}
