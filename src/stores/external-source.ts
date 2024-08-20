import { browser } from '$app/environment';
import { derived, writable, type Writable } from 'svelte/store';
import {
  type DerivationGroup,
  type ExternalSourcePkey,
  type ExternalSourceSlim,
  type ExternalSourceType,
  type PlanDerivationGroup,
  type UserSeenEntry,
} from '../types/external-source';
import gql from '../utilities/gql';
import { planId } from './plan';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const parsingError: Writable<string | null> = writable(null);
export const creatingExternalSource: Writable<boolean> = writable(false);
export const createExternalSourceError: Writable<string | null> = writable(null);
export const createExternalSourceTypeError: Writable<string | null> = writable(null);
export const createDerivationGroupError: Writable<string | null> = writable(null);
export const derivationGroupPlanLinkError: Writable<string | null> = writable(null);
export const getExternalSourceMetadataError: Writable<string | null> = writable(null);

/* Persisted.
  The following stores persist their values within the browser's localStorage
*/
// Track which sources have yet to be acknowledged by user as added to AERIE
export const unseenSources = writable((browser && localStorage.getItem('seenSources')) || '[]');
unseenSources.subscribe(val => {
  // Validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('seenSources', val);
  }
});

// Track which sources have been acknowledged by user as deleted from AERIE
export const deletedSourcesSeen = writable((browser && localStorage.getItem('deletedSources')) || '[]');
deletedSourcesSeen.subscribe(val => {
  // Validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('deletedSources', val);
  }
});

// This store catches all derivation groups associated with the current plans that have been hidden from view.
//  - Note: this does NOT require the derivation group be currently linked to the
//          plan. If a derivation group is added to this store while NOT associated
//          to the plan, it will be hidden once associated.
// Assumes shape {[plan_id: number]: number[]}, where the list of numbers is the list of filtered out
//    derivation groups for the given plan ID
export const planDerivationGroupNamesToFilter = writable(
  (browser && localStorage.getItem('planDerivationGroupNamesToFilter')) || '{}',
);
planDerivationGroupNamesToFilter.subscribe(val => {
  // Validate that val is list-like
  if (browser && JSON.parse(val)) {
    localStorage.setItem('planDerivationGroupNamesToFilter', val);
  }
});

/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);
export const derivationGroupsRaw = gqlSubscribable<
  {
    derived_total: number;
    event_types: string[];
    name: string;
    source_type_name: string;
    sources: string[];
  }[]
>(gql.SUB_DERIVATION_GROUPS, {}, [], null);
export const planDerivationGroupLinks = gqlSubscribable<PlanDerivationGroup[]>(
  gql.SUB_PLAN_DERIVATION_GROUP,
  {},
  [],
  null,
);
export const usersSeenSourcesRaw = gqlSubscribable<
  {
    derivation_group: string;
    external_source_name: string;
    external_source_type: string;
    id: number;
    username: string;
  }[]
>(gql.SUB_SEEN_SOURCES, {}, [], null);
export const usersSeenSources = derived<[typeof usersSeenSourcesRaw], { [key: string]: UserSeenEntry[] }>(
  [usersSeenSourcesRaw],
  ([$rawSeen]) => {
    const res: Record<string, UserSeenEntry[]> = {};
    for (const entry of $rawSeen) {
      if (res[entry.username]) {
        res[entry.username].push({
          derivation_group: entry.derivation_group,
          key: entry.external_source_name,
          source_type_name: entry.external_source_type,
        });
      } else {
        res[entry.username] = [
          {
            derivation_group: entry.derivation_group,
            key: entry.external_source_name,
            source_type_name: entry.external_source_type,
          },
        ];
      }
    }
    return res;
  },
);

/* Derived. */
// 'Cleaned' version of derivationGroupsRaw
export const derivationGroups = derived<[typeof derivationGroupsRaw], DerivationGroup[]>(
  [derivationGroupsRaw],
  ([$derivationGroupsRaw]) =>
    $derivationGroupsRaw.map(raw => ({
      derived_event_total: raw.derived_total,
      event_types: raw.event_types,
      name: raw.name,
      source_type_name: raw.source_type_name,
      sources: new Map(
        // comes from view schema that is hardcoded as "{dg_id}, {source_key}, {source_id}""
        raw.sources
          .filter(s => s.charAt(0) !== ',' && s.length > 4)
          .map(s => [s.split(', ')[1], { event_counts: parseInt(s.split(', ')[2]) }]),
      ),
    })),
);
export const selectedPlanDerivationGroupNames = derived(
  [planDerivationGroupLinks, planId],
  ([$planDerivationGroupLinks, $planId]) =>
    $planDerivationGroupLinks.filter(link => link.plan_id === $planId).map(link => link.derivation_group_name),
);
export const selectedPlanDerivationGroupEventTypes = derived(
  [derivationGroups, selectedPlanDerivationGroupNames],
  ([$derivationGroups, $selectedPlanDerivationGroupIds]) => {
    return $derivationGroups
      .filter(dg => $selectedPlanDerivationGroupIds.includes(dg.name))
      .map(dg => dg.event_types)
      .reduce((acc, curr) => acc.concat(curr), []);
  },
);

/* Helper Functions. */
export function resetModelStores() {
  createExternalSourceError.set(null);
  createExternalSourceTypeError.set(null);
  createDerivationGroupError.set(null);
  derivationGroupPlanLinkError.set(null);
}

export function getRowIdFromExternalSourceId(externalSourceId: ExternalSourcePkey): string {
  return `${externalSourceId.key}:::${externalSourceId.source_type_name}:::${externalSourceId.derivation_group_name}`;
}