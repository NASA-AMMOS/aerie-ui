import { derived, writable, type Readable, type Writable } from 'svelte/store';
import {
  type DerivationGroup,
  type ExternalSourceSlim,
  type ExternalSourceType,
  type PlanDerivationGroup,
  type UserSeenEntryWithDate,
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
export const derivationGroupVisibilityMap: Writable<Record<DerivationGroup['name'], boolean>> = writable({});

/* Subscriptions. */
export const externalSources = gqlSubscribable<ExternalSourceSlim[]>(gql.SUB_EXTERNAL_SOURCES, {}, [], null);
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
export const usersSeenSourcesRaw = gqlSubscribable<
  {
    derivation_group: string;
    external_source_name: string;
    external_source_type: string;
    id: number;
    username: string;
  }[]
>(gql.SUB_SEEN_SOURCES, {}, [], null);

/* Derived. */
export const selectedPlanDerivationGroupNames: Readable<string[]> = derived(
  [planDerivationGroupLinks, planId],
  ([$planDerivationGroupLinks, $planId]) =>
    $planDerivationGroupLinks.filter(link => link.plan_id === $planId).map(link => link.derivation_group_name),
);
export const selectedPlanDerivationGroupEventTypes: Readable<string[]> = derived(
  [derivationGroups, selectedPlanDerivationGroupNames],
  ([$derivationGroups, $selectedPlanDerivationGroupIds]) => {
    const filteredDerivationGroups = $derivationGroups.filter(derivationGroup =>
      $selectedPlanDerivationGroupIds.includes(derivationGroup.name),
    );
    if (filteredDerivationGroups !== undefined) {
      return filteredDerivationGroups.reduce(
        (acc: string[], derivationGroup) => acc.concat(derivationGroup.event_types),
        [],
      );
    } else {
      return [];
    }
  },
);
export const usersSeenSources: Readable<Record<string, UserSeenEntryWithDate[]>> = derived(
  [usersSeenSourcesRaw, externalSources],
  ([$usersSeenSourcesRaw, $externalSources]) => {
    const seenSources: Record<string, UserSeenEntryWithDate[]> = {};
    for (const entry of $usersSeenSourcesRaw) {
      const change_date =
        $externalSources.find(
          externalSource =>
            externalSource.derivation_group_name === entry.derivation_group &&
            externalSource.key === entry.external_source_name,
        )?.created_at ?? '';
      if (seenSources[entry.username]) {
        seenSources[entry.username].push({
          change_date,
          derivation_group_name: entry.derivation_group,
          key: entry.external_source_name,
          source_type_name: entry.external_source_type,
        });
      } else {
        seenSources[entry.username] = [
          {
            change_date,
            derivation_group_name: entry.derivation_group,
            key: entry.external_source_name,
            source_type_name: entry.external_source_type,
          },
        ];
      }
    }
    return seenSources;
  },
);

/* Helper Functions. */
export function resetExternalSourceStores(): void {
  createExternalSourceError.set(null);
  createExternalSourceTypeError.set(null);
  createDerivationGroupError.set(null);
  derivationGroupPlanLinkError.set(null);
}

function transformDerivationGroups(
  derivationGroups:
    | {
        derived_total: number;
        event_types: string[];
        name: string;
        source_type_name: string;
        sources: string[];
      }[]
    | null
    | undefined,
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
          derivationGroup.sources.reduce(
            (currentSourcesMap: [string, { event_counts: number }][], source: string) => {
              // regex to match strings of the form "source_key, derivation_group_name, event_count", and ignore empty entries for empty
              //    derivation groups, like ", , "
              const matches = source.match(
                /(?<source_key>[^,]+)\s*,\s*(?<derivation_group_name>[^,]+)\s*,\s*(?<event_count>[^,]+)\s*/,
              );
        
              if (matches) {
                const { groups: { event_count, source_key } = {} } = matches;
        
                return [
                  ...currentSourcesMap,
                  [source_key, { event_counts: parseInt(event_count) }] as [string, { event_counts: number }],
                ];
              }
              return currentSourcesMap;
            },
            [],
          ),
        ),
      });
    });
  }
  return completeExternalSourceSlim;
}
