<svelte:options immutable={true} />

<script lang="ts">
  import {
    derivationGroupPlanLinkError,
    derivationGroups,
    externalSources,
    planDerivationGroupLinks,
    planDerivationGroupNamesToFilter,
    usersSeenSources,
  } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { originalView } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DerivationGroup, UserSeenEntry } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import effects from '../../utilities/effects';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';
  import CollapsibleListControls from '../CollapsibleListControls.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import AlertError from '../ui/AlertError.svelte';
  import CardList from '../ui/CardList.svelte';
  import Panel from '../ui/Panel.svelte';
  import UpdateCard from '../ui/UpdateCard.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // filter which derivation groups are visible
  let filterText: string = '';
  let mappedDerivationGroups: { [key: string]: DerivationGroup[] } = {};
  let filteredDerivationGroups: DerivationGroup[] = [];
  let unseenSources: UserSeenEntry[] = [];
  let unseenDeletedSources: UserSeenEntry[] = [];

  // Determine which new and deleted sources are unacknowledged for the user
  $: {
    let sourceKeys: UserSeenEntry[] = $externalSources.map(es => {
      return {
        derivation_group_name: es.pkey.derivation_group_name,
        key: es.pkey.key,
        source_type_name: es.source_type_name,
      };
    });

    if (user !== null && user.id !== null && $usersSeenSources[user.id] !== undefined) {
      unseenSources = sourceKeys.filter(key => {
        if (user === null || user.id === null) {
          return true;
        }
        return !$usersSeenSources[user.id].find(
          k => k.key === key.key && k.derivation_group_name === key.derivation_group_name,
        );
      });
    } else {
      unseenSources = sourceKeys;
    }

    if (user && user.id && $usersSeenSources[user.id]) {
      unseenDeletedSources = $usersSeenSources[user.id].filter(
        key => !sourceKeys.find(k => k.key === key.key && k.derivation_group_name === key.derivation_group_name),
      );
    } else if (user && user.id && !(user.id in $usersSeenSources)) {
      unseenDeletedSources = [];
    }
  }

  $: linkedDerivationGroupIds = $planDerivationGroupLinks
    .filter(link => link.plan_id === $plan?.id)
    .map(link => link.derivation_group_name);
  $: filteredDerivationGroups = $derivationGroups
    .filter(group => linkedDerivationGroupIds.includes(group.name))
    .filter(group => {
      const filterTextLowerCase = filterText.toLowerCase();
      const includesName = group.name.toLocaleLowerCase().includes(filterTextLowerCase);
      return includesName;
    });
  planDerivationGroupLinks.subscribe(_ => (mappedDerivationGroups = {})); // clear the map...
  $: filteredDerivationGroups.forEach(group => {
    // ...and repopulate it every time the links change. this handles deletion correctly
    if (group.source_type_name) {
      // undefined is being very frustrating
      if (
        mappedDerivationGroups[group.source_type_name] &&
        !mappedDerivationGroups[group.source_type_name].map(g => g.name).includes(group.name)
      ) {
        // use string later for source type
        mappedDerivationGroups[group.source_type_name]?.push(group);
      } else {
        mappedDerivationGroups[group.source_type_name] = [group];
      }
    }
  });
  // $: unseenSourcesParsed = JSON.parse($unseenSources);
  // $: deletedSourcesParsed = JSON.parse($deletedSourcesSeen);
  originalView.subscribe(ov => {
    // any time a new view is selected, change the enabled list
    if (ov && $plan) {
      $planDerivationGroupNamesToFilter[$plan.id] = ov?.definition.plan.filteredDerivationGroups;
    }
    // planDerivationGroupNamesToFilter.set(JSON.stringify($planDerivationGroupNamesToFilter));
  });

  function onManageDerivationGroups() {
    effects.managePlanDerivationGroups(user);
  }
</script>

<Panel>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Sources" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <CollapsibleListControls
      placeholder="Filter External Sources"
      on:input={event => (filterText = event.detail.value)}
    >
      <svelte:fragment slot="right">
        <button
          name="manage-derivation-groups"
          class="st-button secondary"
          on:click|stopPropagation={onManageDerivationGroups}
          use:tooltip={{ content: 'Select derivation groups to associate with this plan', placement: 'top' }}
        >
          Manage Derivation Groups
        </button>
      </svelte:fragment>
    </CollapsibleListControls>

    <AlertError class="m-2" error={$derivationGroupPlanLinkError} />

    {#if unseenSources.length || unseenDeletedSources.length}
      <div style="padding-top: 10px">
        <CardList>
          {#if unseenSources.length}
            <UpdateCard
              deleted={false}
              sources={unseenSources}
              on:dismiss={() => {
                // call effect.
                effects.createExternalSourceSeenEntry(unseenSources, user);
              }}
            />
          {/if}
          {#if unseenDeletedSources.length}
            <UpdateCard
              deleted={true}
              sources={unseenDeletedSources}
              on:dismiss={() => {
                // call effect.
                effects.deleteExternalSourceSeenEntry(unseenDeletedSources, user);
              }}
            />
          {/if}
        </CardList>
      </div>
    {/if}

    {#if filteredDerivationGroups.length}
      {#each Object.keys(mappedDerivationGroups) as sourceType}
        <Collapse title={sourceType.toString()} tooltipContent={sourceType.toString()} defaultExpanded={true}>
          {#if mappedDerivationGroups[sourceType]}
            {#each mappedDerivationGroups[sourceType] as group}
              <ExternalSourcePanelEntry derivationGroup={group} {user} />
            {/each}
          {/if}
        </Collapse>
      {/each}
    {:else}
      <p>
        <br />
        No Derivation Groups Linked To This Plan
      </p>
      <p>
        <br />
        <i>Click "Manage Derivation Groups" to associate Derivation Groups to this plan.</i>
      </p>
    {/if}
  </svelte:fragment>
</Panel>

<style>
  .st-button {
    white-space: nowrap;
  }
</style>
