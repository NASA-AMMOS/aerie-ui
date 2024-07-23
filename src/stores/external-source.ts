import { browser } from '$app/environment';
import { derived, writable, type Writable } from 'svelte/store';
import {
  type DerivationGroup,
  type ExternalSourceEventType,
  type ExternalSourceSlim,
  type ExternalSourceType,
  type ExternalSourceWithResolvedNames,
  type PlanDerivationGroup,
} from '../types/external-source';
import gql from '../utilities/gql';
import { planId } from './plan';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingExternalSource: Writable<boolean> = writable(false);
export const createExternalSourceError: Writable<string | null> = writable(null);

export const createExternalSourceTypeError: Writable<string | null> = writable(null);

export const createDerivationGroupError: Writable<string | null> = writable(null);

export const derivationGroupPlanLinkError: Writable<string | null> = writable(null);

export const createExternalSourceEventTypeLinkError: Writable<string | null> = writable(null);

/* Persisted. */
// need extra logic for persistence
// track which sources have been acknowledged by user as added to AERIE
// assumes shape ExternalSourceWithDateInfo[]
export const unseenSources = writable((browser && localStorage.getItem('seenSources')) || '[]');
unseenSources.subscribe(val => {
  // validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('seenSources', val);
  }
});

// track which sources have been acknowledged by user as deleted from AERIE
// assumes shape ExternalSourceWithDateInfo[]
export const deletedSourcesSeen = writable((browser && localStorage.getItem('deletedSources')) || '[]');
deletedSourcesSeen.subscribe(val => {
  // validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('deletedSources', val);
  }
});

// this store catches all derivation groups associated with the current plans that have been disabled
//    doesn't check if they're linked or not, simply acts as a list to filter out if they are associated
//    it is therefore possible to disable a group, dissociate it, reassociate it, and it'll still be disabled
// assumes shape {[plan_id: number]: number[]}, where the list of numbers is the list of filtered out
//    derivation groups for the given plan id
export const planDerivationGroupIdsToFilter = writable(
  (browser && localStorage.getItem('planDerivationGroupIdsToFilter')) || '{}',
);
planDerivationGroupIdsToFilter.subscribe(val => {
  // validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('planDerivationGroupIdsToFilter', val);
  }
});
// export const currentPlanDerivationGroupIdsToFilter: Writable<number[]> = writable([]);

/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);
export const derivationGroupsRaw = gqlSubscribable<
  {
    derived_total: number;
    event_types: string[];
    id: number;
    name: string;
    source_type_id: number;
    sources: string[];
  }[]
>(gql.SUB_DERIVATION_GROUPS, {}, [], null);

// use to keep track of associations between plans and goals
export const planDerivationGroupLinks = gqlSubscribable<PlanDerivationGroup[]>(
  gql.SUB_PLAN_DERIVATION_GROUP,
  {},
  [],
  null,
);

// use to keep track of associations between sources and their event types
export const externalSourceEventTypes = gqlSubscribable<ExternalSourceEventType[]>(
  gql.SUB_EXTERNAL_SOURCE_EVENT_TYPE,
  {},
  [],
  null,
);

/* Derived. */
// cleans up derivationGroupsRaw
export const derivationGroups = derived<[typeof derivationGroupsRaw], DerivationGroup[]>(
  [derivationGroupsRaw],
  ([$derivationGroupsRaw]) =>
    $derivationGroupsRaw.map(raw => ({
      derivedEventTotal: raw.derived_total,
      event_types: raw.event_types,
      id: raw.id,
      name: raw.name,
      source_type_id: raw.source_type_id,
      sources: new Map(
        // comes from view schema that is hardcoded as "{dg_id}, {source_key}, {source_id}""
        raw.sources.map(s => [s.split(', ')[1], { event_counts: parseInt(s.split(', ')[2]) }]),
      ),
    })),
);

// Creates a store for each externalSource with the added 'source_type' field that maps to the human-readable source type name
export const externalSourceWithResolvedNames = derived<
  [typeof externalSources, typeof externalSourceTypes, typeof derivationGroups],
  ExternalSourceWithResolvedNames[]
>(
  [externalSources, externalSourceTypes, derivationGroups],
  ([$externalSources, $externalSourceTypes, $derivationGroups]) =>
    $externalSources.map(externalSource => ({
      ...externalSource,
      derivation_group: getDerivationGroupName(externalSource.derivation_group_id, $derivationGroups),
      source_type: getEventSourceTypeName(externalSource.source_type_id, $externalSourceTypes),
      total_groups: $derivationGroups.length,
    })),
);

export const selectedPlanDerivationGroupIds = derived(
  [planDerivationGroupLinks, planId],
  ([$planDerivationGroupLinks, $planId]) =>
    $planDerivationGroupLinks.filter(link => link.plan_id === $planId).map(link => link.derivation_group_id),
);

/* Helper Functions. */
export function resetModelStores() {
  createExternalSourceError.set(null);
  createExternalSourceTypeError.set(null);
  createDerivationGroupError.set(null);
  derivationGroupPlanLinkError.set(null);
  createExternalSourceEventTypeLinkError.set(null);
}

export function getSourceName(source_id: number | undefined, sources: ExternalSourceSlim[]): string {
  return sources.find(s => s.id === source_id)?.key ?? 'None';
}

export function getSourceName(source_id: number | undefined, sources: ExternalSourceSlim[]): string {
  return sources.find(s => s.id === source_id)?.key ?? 'None'  
}

export function getEventSourceTypeName(id: number, sourceTypes: ExternalSourceType[]): string | undefined {
  return sourceTypes.find(sourceType => sourceType.id === id)?.name;
}

export function getEventSourceTypeId(name: string, sourceTypes: ExternalSourceType[]): number | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name)?.id;
}

export function getEventSourceTypeByName(
  name: string,
  sourceTypes: ExternalSourceType[],
): ExternalSourceType | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name);
}

export function getDerivationGroupByNameSourceTypeId(
  name: string,
  sourceTypeId: number,
  derivationGroups: DerivationGroup[],
): DerivationGroup | undefined {
  return derivationGroups.find(
    derivationGroup => derivationGroup.name === name && derivationGroup.source_type_id === sourceTypeId,
  );
}

export function getDerivationGroupName(id: number, derivationGroups: DerivationGroup[]): string | undefined {
  return derivationGroups.find(derivationGroup => derivationGroup.id === id)?.name;
}

export function getEventSourceTypeByName(name: string, sourceTypes: ExternalSourceType[]): ExternalSourceType | undefined {
  return sourceTypes.find(sourceType => sourceType.name === name)
}
