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

/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(
  gql.SUB_EXTERNAL_SOURCES,
  {},
  [],
  null,
  transformExternalSources,
);
export const externalSourceTypes = gqlSubscribable<ExternalSourceType[]>(gql.SUB_EXTERNAL_SOURCE_TYPES, {}, [], null);
export const derivationGroups = gqlSubscribable<DerivationGroup[]>(
  gql.SUB_DERIVATION_GROUPS,
  {},
  [],
  null,
  transformDerivationGroups,
);
export const planDerivationGroupLinks = gqlSubscribable<PlanDerivationGroup[]>(
  gql.SUB_PLAN_DERIVATION_GROUP,
  {},
  [],
  null,
);

// this tracks each user's view of the sources. if something exists in externalSources that isn't in usersSeenSources, it's treated as unseen, and vice versa for deleted.
export const usersSeenSources = gqlSubscribable<Record<string, UserSeenEntry[]>>(
  gql.SUB_SEEN_SOURCES,
  {},
  {},
  null,
  transformUsersSeenSources,
);

/* Derived. */
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
export function resetExternalSourceStores() {
  createExternalSourceError.set(null);
  createExternalSourceTypeError.set(null);
  createDerivationGroupError.set(null);
  derivationGroupPlanLinkError.set(null);
}

function transformExternalSources(
  externalSources: {
    created_at: string;
    derivation_group_name: string;
    end_time: string;
    key: string;
    source_type_name: string;
    start_time: string;
    valid_at: string;
  }[],
): ExternalSourceSlim[] {
  const completeExternalSourceSlim: ExternalSourceSlim[] = [];
  if (externalSources !== null && externalSources !== undefined) {
    externalSources.forEach(es => {
      completeExternalSourceSlim.push({
        created_at: es.created_at,
        end_time: es.end_time,
        pkey: {
          derivation_group_name: es.derivation_group_name,
          key: es.key,
        },
        source_type_name: es.source_type_name,
        start_time: es.start_time,
        valid_at: es.valid_at,
      });
    });
  }
  return completeExternalSourceSlim;
}

function transformDerivationGroups(
  derivationGroups: {
    derived_total: number;
    event_types: string[];
    name: string;
    source_type_name: string;
    sources: string[];
  }[],
): DerivationGroup[] {
  const completeExternalSourceSlim: DerivationGroup[] = [];
  if (derivationGroups !== null && derivationGroups !== undefined) {
    derivationGroups.forEach(dg => {
      completeExternalSourceSlim.push({
        derived_event_total: dg.derived_total,
        event_types: dg.event_types,
        name: dg.name,
        source_type_name: dg.source_type_name,
        sources: new Map(
          // comes from view schema that is hardcoded as "{source_key}, {derivation_group_name}, {event_count}""
          dg.sources
            .filter(s => s.charAt(0) !== ',' && s.length > 4)
            .map(s => [s.split(', ')[0], { event_counts: parseInt(s.split(', ')[2]) }]),
        ),
      });
    });
  }
  return completeExternalSourceSlim;
}

function transformUsersSeenSources(
  seenSources: {
    derivation_group: string;
    external_source_name: string;
    external_source_type: string;
    id: number;
    username: string;
  }[],
): Record<string, UserSeenEntry[]> {
  const res: Record<string, UserSeenEntry[]> = {};
  for (const entry of seenSources) {
    if (res[entry.username]) {
      res[entry.username].push({
        derivation_group_name: entry.derivation_group,
        key: entry.external_source_name,
        source_type_name: entry.external_source_type,
      });
    } else {
      res[entry.username] = [
        {
          derivation_group_name: entry.derivation_group,
          key: entry.external_source_name,
          source_type_name: entry.external_source_type,
        },
      ];
    }
  }
  return res;
}

// Row/Hash Functions
export function getRowIdExternalSourceSlim(externalSourceSlim: ExternalSourceSlim): string {
  return externalSourceSlim.pkey.derivation_group_name + externalSourceSlim.pkey.key;
}

export function getRowIdExternalSource(externalSourcePkey: ExternalSourcePkey): string {
  return externalSourcePkey.derivation_group_name + externalSourcePkey.key;
}

export function getRowIdDerivationGroup(derivationGroup: DerivationGroup): string {
  return `${derivationGroup.name}:${derivationGroup.source_type_name}`;
}

export function getRowIdExternalSourceType(externalSourceType: ExternalSourceType): string {
  return externalSourceType.name;
}
