import { derived, writable, type Writable } from 'svelte/store';
import { type DerivationGroup, type ExternalSourceEventType, type ExternalSourceSlim, type ExternalSourceType, type ExternalSourceWithResolvedNames, type PlanExternalSource } from '../types/external-source';
import gql from '../utilities/gql';
import { planId } from './plan';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingExternalSource: Writable<boolean> = writable(false);
export const createExternalSourceError: Writable<string | null> = writable(null);

export const createExternalSourceTypeError: Writable<string | null> = writable(null);

export const createExternalSourcePlanError: Writable<string | null> = writable(null);

export const createExternalSourceEventTypeLinkError: Writable<string | null> = writable(null);


/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);
export const derivationGroups = gqlSubscribable<DerivationGroup[]>(gql.SUB_DERIVATION_GROUPS, {}, [], null);

// use to keep track of associations between plans and goals
export const planExternalSourceLinks = gqlSubscribable<PlanExternalSource[]>(gql.SUB_PLAN_EXTERNAL_SOURCE, {}, [], null);

// use to keep track of associations between sources and their event types
export const externalSourceEventTypes = gqlSubscribable<ExternalSourceEventType[]>(gql.SUB_EXTERNAL_SOURCE_EVENT_TYPE, {}, [], null)


/* Derived. */
// Creates a store for each externalSource with the added 'source_type' field that maps to the human-readable source type name
export const externalSourceWithTypeName = derived<[typeof externalSources, typeof externalSourceTypes, typeof derivationGroups], ExternalSourceWithResolvedNames[]>(
  [externalSources, externalSourceTypes, derivationGroups],
  ([$externalSources, $externalSourceTypes, $derivationGroups]) => $externalSources.map(externalSource => ({
      ...externalSource,
      source_type: getEventSourceTypeName(externalSource.source_type_id, $externalSourceTypes),
      derivation_group: getDerivationGroupName(externalSource.derivation_group_id, $derivationGroups)
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
    return allValidEventTypes.filter((val, ind, arr) => arr.indexOf(val) == ind);
  }
)


/* Helper Functions. */
export function resetModelStores() {
  createExternalSourceError.set(null);
  createExternalSourceTypeError.set(null);
  createExternalSourcePlanError.set(null);
  createExternalSourceEventTypeLinkError.set(null);
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

export function getDerivationGroupByName(name: string, derivationGroups: DerivationGroup[]): DerivationGroup | undefined {
  return derivationGroups.find(derivationGroup => derivationGroup.name === name)
}

export function getDerivationGroupName(id: number, derivationGroups: DerivationGroup[]): string | undefined {
  return derivationGroups.find(derivationGroup => derivationGroup.id === id)?.name
}