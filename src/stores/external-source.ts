import { derived, writable, type Writable } from 'svelte/store';
import {
  type DerivationGroup,
  type ExternalSourcePkey,
  type ExternalSourceSlim,
  type ExternalSourceType,
  type PlanDerivationGroup,
  type UserSeenEntryWithDate
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
export const usersSeenSourcesRaw = gqlSubscribable<{
  derivation_group: string;
  external_source_name: string;
  external_source_type: string;
  id: number;
  username: string;
}[]>(
  gql.SUB_SEEN_SOURCES,
  {},
  [],
  null
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
      .filter(derivationGroup => $selectedPlanDerivationGroupIds.includes(derivationGroup.name))
      .map(derivationGroup => derivationGroup.event_types)
      .reduce((acc, curr) => acc.concat(curr), []);
  },
);
export const usersSeenSources = derived(
  [usersSeenSourcesRaw, externalSources],
  ([$usersSeenSourcesRaw, $externalSources]) => {
    const res: Record<string, UserSeenEntryWithDate[]> = {};
    for (const entry of $usersSeenSourcesRaw) {
      const change_date = $externalSources.find(externalSource => externalSource.pkey.derivation_group_name === entry.derivation_group && externalSource.pkey.key === entry.external_source_name)?.created_at ?? ""
      if (res[entry.username]) {
        res[entry.username].push({
          change_date,
          derivation_group_name: entry.derivation_group,
          key: entry.external_source_name,
          source_type_name: entry.external_source_type,
        });
      } else {
        res[entry.username] = [
          {
            change_date,
            derivation_group_name: entry.derivation_group,
            key: entry.external_source_name,
            source_type_name: entry.external_source_type,
          },
        ];
      }
    }
    return res;
  }
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
    externalSources.forEach(externalSource => {
      completeExternalSourceSlim.push({
        created_at: externalSource.created_at,
        end_time: externalSource.end_time,
        pkey: {
          derivation_group_name: externalSource.derivation_group_name,
          key: externalSource.key,
        },
        source_type_name: externalSource.source_type_name,
        start_time: externalSource.start_time,
        valid_at: externalSource.valid_at,
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
    derivationGroups.forEach(derivationGroup => {
      completeExternalSourceSlim.push({
        derived_event_total: derivationGroup.derived_total,
        event_types: derivationGroup.event_types,
        name: derivationGroup.name,
        source_type_name: derivationGroup.source_type_name,
        sources: new Map(
          // comes from view schema that is hardcoded as "{source_key}, {derivation_group_name}, {event_count}""
          derivationGroup.sources
            .filter(source => source.charAt(0) !== ',' && source.length > 4)
            .map(source => [source.split(', ')[0], { event_counts: parseInt(source.split(', ')[2]) }]),
        ),
      });
    });
  }
  return completeExternalSourceSlim;
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
