<svelte:options immutable={true} />

<script lang="ts">
  import {
    derivationGroupPlanLinkError,
    derivationGroups,
    externalSources,
    planDerivationGroupLinks,
    usersSeenSources,
  } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { DerivationGroup, UserSeenEntryWithDate } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import effects from '../../utilities/effects';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';
  import CollapsibleListControls from '../CollapsibleListControls.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import AlertError from '../ui/AlertError.svelte';
  import CardList from '../ui/CardList.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';
  import ExternalSourceUpdateCard from './ExternalSourceUpdateCard.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // filter which derivation groups are visible
  let filterText: string = '';
  let mappedDerivationGroups: { [key: string]: DerivationGroup[] } = {};
  let filteredDerivationGroups: DerivationGroup[] = [];
  let unseenSources: UserSeenEntryWithDate[] = [];
  let unseenDeletedSources: UserSeenEntryWithDate[] = [];

  // Determine which new and deleted sources are unacknowledged for the user
  $: {
    let sourceKeys: UserSeenEntryWithDate[] = $externalSources.map(externalSource => {
      return {
        change_date: externalSource.created_at,
        derivation_group_name: externalSource.derivation_group_name,
        key: externalSource.key,
        source_type_name: externalSource.source_type_name,
      };
    });

    if (user !== null && user.id !== null && $usersSeenSources[user.id] !== undefined) {
      unseenSources = sourceKeys.filter(externalSource => {
        if (user === null || user.id === null) {
          return true;
        }
        return !$usersSeenSources[user.id].find(
          userSeenSource =>
            userSeenSource.key === externalSource.key &&
            userSeenSource.derivation_group_name === externalSource.derivation_group_name,
        );
      });
    } else {
      unseenSources = sourceKeys;
    }

    if (user && user.id && $usersSeenSources[user.id]) {
      unseenDeletedSources = $usersSeenSources[user.id].filter(
        userSeenSource =>
          !sourceKeys.find(
            externalSource =>
              externalSource.key === userSeenSource.key &&
              externalSource.derivation_group_name === userSeenSource.derivation_group_name,
          ),
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
      if (
        mappedDerivationGroups[group.source_type_name] &&
        !mappedDerivationGroups[group.source_type_name]
          .map(mappedDerivationGroup => mappedDerivationGroup.name)
          .includes(group.name)
      ) {
        // use string later for source type
        mappedDerivationGroups[group.source_type_name]?.push(group);
      } else {
        mappedDerivationGroups[group.source_type_name] = [group];
      }
    }
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
          class="st-button active"
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
            <ExternalSourceUpdateCard
              deleted={false}
              sources={unseenSources}
              on:dismiss={() => {
                effects.createExternalSourceSeenEntry(unseenSources, user);
              }}
            />
          {/if}
          {#if unseenDeletedSources.length}
            <ExternalSourceUpdateCard
              deleted={true}
              sources={unseenDeletedSources}
              on:dismiss={() => {
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
      <div class="st-typography-body">
        <p class="no-derivation-groups-linked">No Derivation Groups Linked To This Plan</p>
      </div>
      <div class="st-typography-body">
        <p>
          <br />
          <i>Click "Manage Derivation Groups" to associate Derivation Groups to this plan.</i>
        </p>
      </div>
    {/if}
  </svelte:fragment>
</Panel>

<style>
  .no-derivation-groups-linked {
    padding-top: 12px;
  }
  .st-button {
    white-space: nowrap;
  }
</style>
