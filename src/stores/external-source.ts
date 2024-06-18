import { derived, writable, type Writable } from 'svelte/store';
import { type ExternalSourceEventType, type ExternalSourceSlim, type ExternalSourceType, type ExternalSourceWithTypeName, type PlanExternalSource } from '../types/external-source';
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

// use to keep track of associations between sources and their event types
export const externalSourceEventTypes = gqlSubscribable<ExternalSourceEventType[]>(gql.SUB_EXTERNAL_SOURCE_EVENT_TYPE, {}, [], null)


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

export const selectedPlanExternalSourceEventTypes = derived(
  [externalSourceEventTypes, planExternalSourceLinks, planId],
  ([$externalSourceEventTypes, $planExternalSourceLinks, $planId]) => {
    let validSources = $planExternalSourceLinks.filter(link => link.plan_id == $planId).map(link => link.external_source_id)
    let allValidEventTypes = $externalSourceEventTypes.filter(eset => validSources.includes(eset.external_source_id)).map(eset => eset.external_event_type_id)
    
    // remove duplicates
    return Array.from(new Set(allValidEventTypes))
  }
)


/* Helper Functions. */
export function resetModelStores() {
  creatingExternalSource.set(false);
  createExternalSourceError.set(null);
}

export function getSourceName(source_id: number | undefined, sources: ExternalSourceSlim[]): string {
  return sources.find(s => s.id === source_id)?.key ?? 'None'  
}

export function getEventSourceTypeName(id: number, sourceTypes: ExternalSourceType[]): string | undefined {
  return sourceTypes.find(sourceType => sourceType.id === id)?.name
}

export function getEventSourceTypeId(name: string, sourceTypes: ExternalSourceType[]): number | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name)?.id
}

export function getEventSourceTypeByName(name: string, sourceTypes: ExternalSourceType[]): ExternalSourceType | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name)
}
