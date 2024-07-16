import { browser } from "$app/environment";
import { derived, writable, type Writable } from 'svelte/store';
import { type DerivationGroup, type ExternalSourceEventType, type ExternalSourceSlim, type ExternalSourceType, type ExternalSourceWithResolvedNames, type PlanDerivationGroup } from '../types/external-source';
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

export const currentPlanDerivationGroupFilter: Writable<Array<DerivationGroup>> = writable([]);

// need extra logic for persistence
// track which sources have been acknowledged by user as added to AERIE
export const unseenSources = writable((browser && localStorage.getItem('seenSources')) || '[]');
unseenSources.subscribe(val => {
  // validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('seenSources', val);
  }
});
// TODO: delete from this

// track which sources have been acknowledged by user as deleted from AERIE
export const deletedSourcesSeen = writable((browser && localStorage.getItem('deletedSources')) || '[]');
deletedSourcesSeen.subscribe(val => {
  // validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('deletedSources', val);
  }
});
// TODO: clear this at acknowledgement


/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);
export const derivationGroupsRaw = gqlSubscribable<
  {
    id: number;
    name: string;
    source_type_id: number;
    external_source: [
      {
        key: string;
        external_events_aggregate: {
          aggregate: {
            count: number;
          };
        };
      },
    ];
  }[]
>(gql.SUB_DERIVATION_GROUPS, {}, [], null);
export const derivationGroupsEventIds = gqlSubscribable<
  {
    derivation_group_id: number
    event_id: number
  }[]
>(gql.SUB_DERIVATION_GROUPS_EVENT_IDS, {}, [], null)


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
export const derivationGroups = derived<[typeof derivationGroupsRaw, typeof derivationGroupsEventIds], DerivationGroup[]>(
  [derivationGroupsRaw, derivationGroupsEventIds],
  ([$derivationGroupsRaw, $derivationGroupsEventIds]) =>
    $derivationGroupsRaw.map(raw => ({
      id: raw.id,
      name: raw.name,
      source_type_id: raw.source_type_id,
      sources: new Map(
        raw.external_source.map(source => [
          source.key,
          { event_counts: source.external_events_aggregate.aggregate.count },
        ]),
      ),
      totalEventCount: raw.external_source.reduce(
        (sum, currentSource) => sum + currentSource.external_events_aggregate.aggregate.count,
        0,
      ),
      derivedEventIds: $derivationGroupsEventIds
                          .filter(e => e.derivation_group_id === raw.id)
                          .map(e => e.event_id)
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
      source_type: getEventSourceTypeName(externalSource.source_type_id, $externalSourceTypes),
      derivation_group: getDerivationGroupName(externalSource.derivation_group_id, $derivationGroups),
      total_groups: $derivationGroups.length,
    })),
);

export const selectedPlanDerivationGroupIds = derived(
  [planDerivationGroupLinks, planId],
  ([$planDerivationGroupLinks, $planId]) =>
    $planDerivationGroupLinks.filter(link => link.plan_id === $planId).map(link => link.derivation_group_id),
);

export const selectedPlanExternalSourceEventTypes = derived(
  [externalSourceEventTypes, selectedPlanDerivationGroupIds, externalSources],
  ([$externalSourceEventTypes, $selectedPlanDerivationGroupIds, $externalSources]) => {
    const allValidSources = $externalSources
      .filter(source => $selectedPlanDerivationGroupIds.includes(source.derivation_group_id))
      .map(source => source.id);
    const allValidEventTypes = $externalSourceEventTypes
      .filter(eset => allValidSources.includes(eset.external_source_id))
      .map(eset => eset.external_event_type_id);

    // remove duplicates
    return allValidEventTypes.filter((val, ind, arr) => arr.indexOf(val) == ind);
  },
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
  return derivationGroups.find(derivationGroup => derivationGroup.name === name && derivationGroup.source_type_id === sourceTypeId);
}

export function getDerivationGroupName(id: number, derivationGroups: DerivationGroup[]): string | undefined {
  return derivationGroups.find(derivationGroup => derivationGroup.id === id)?.name;
}
