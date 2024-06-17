import { derived, writable, type Writable } from 'svelte/store';
import { type ExternalSourceSlim, type ExternalSourceType, type ExternalSourceWithTypeName, type PlanExternalSource } from '../types/external-source';
import gql from '../utilities/gql';
import { planId } from './plan';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingExternalSource: Writable<boolean> = writable(false);
export const creatingExternalSourceType: Writable<boolean> = writable(false);

export const createExternalSourceError: Writable<string | null> = writable(null);
export const createExternalSourceTypeError: Writable<string | null> = writable(null);


/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);

// use to keep track of associations between plans and goals
export const planExternalSourceLinks = gqlSubscribable<PlanExternalSource[]>(gql.SUB_PLAN_EXTERNAL_SOURCE, {}, [], null);


/* Derived. */
// Creates a store for each externalSource with the added 'source_type' field that maps to the human-readable source type name
export const externalSourceWithTypeName = derived<[typeof externalSources, typeof externalSourceTypes], ExternalSourceWithTypeName[]>(
  [externalSources, externalSourceTypes],
  ([$externalSources, $externalSourceTypes]) => $externalSources.map(externalSource => ({
    ...externalSource,
    source_type: getEventSourceTypeName(externalSource.source_type_id, $externalSourceTypes)
  }))
);

export const selectedPlanExternalSourceIds = derived(
  [planExternalSourceLinks, planId],
  ([$planExternalSourceLinks, $planId]) => $planExternalSourceLinks.filter(link => link.plan_id === $planId).map(link => link.external_source_id)
);


/* Helper Functions. */
export function resetModelStores() {
  creatingExternalSource.set(false);
  createExternalSourceError.set(null);
}

export function getEventSourceTypeName(id: number, sourceTypes: ExternalSourceType[]): string | undefined {
  return sourceTypes.find(sourceType => sourceType.id === id)?.name
}

export function getEventSourceTypeId(name: string, sourceTypes: ExternalSourceType[]): number | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name)?.id
}
