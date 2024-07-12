<svelte:options immutable={true} />

<script lang="ts">
  import { derivationGroupPlanLinkError, derivationGroups, externalSourceTypes, externalSourceWithResolvedNames, getEventSourceTypeName, seenSources, selectedPlanDerivationGroupIds } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import effects from '../../utilities/effects';
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

  // TODO: ASSOCIATON HANDLED IN MODAL, MAKE THIS PANEL HANDLE ENABLED/DISABLED INSTEAD. UPDATE TIMELINE AND FILTERS ACCORDINGLY

  // filter which derivation groups are visible
  let filterText: string = '';
  let mappedDerivationGroups: { [key: string]: DerivationGroup[] } = {};
  let filteredDerivationGroups: DerivationGroup[] = [];
  let seenSourcesParsed: ExternalSourceWithResolvedNames[] = [];
  let unseenSources: ExternalSourceWithResolvedNames[] = [];
  $: filteredDerivationGroups = $derivationGroups
    .filter(group => {
      const filterTextLowerCase = filterText.toLowerCase();
      const includesName = group.name.toLocaleLowerCase().includes(filterTextLowerCase);
      return includesName;
    });
  $: filteredDerivationGroups.forEach(group => {
    const sourceType = getEventSourceTypeName(group.source_type_id, $externalSourceTypes)
    if (sourceType) { // undefined is being very frustrating
      if (mappedDerivationGroups[sourceType]) {// use string later for source type
        mappedDerivationGroups[sourceType]?.push(group)
      }
      else {
        mappedDerivationGroups[sourceType] = [group]
      }
    }
  })
  $: seenSourcesParsed = JSON.parse($seenSources)
  $: unseenSources = $externalSourceWithResolvedNames.filter(source => !seenSourcesParsed.map(source => source.id).includes(source.id));

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
        <!-- TODO: Attach permissionHandler to button -->
        <button
          name="manage-derivation-groups"
          class="st-button secondary"
          on:click|stopPropagation={onManageDerivationGroups}
        >
          Manage Derivation Groups
        </button>
      </svelte:fragment>

    </CollapsibleListControls>

    <AlertError class="m-2" error={$derivationGroupPlanLinkError} />

    {#if filteredDerivationGroups.length}
      {#if unseenSources.length}
        <div style="padding-top: 10px">
          <CardList>
            <UpdateCard newSources={unseenSources} on:dismiss={() => seenSources.set(JSON.stringify(seenSourcesParsed.concat(unseenSources)))}/>
          </CardList>
        </div>
      {/if}
      {#each Object.keys(mappedDerivationGroups) as sourceType}
        <Collapse title={sourceType.toString()} tooltipContent={sourceType.toString()} defaultExpanded={false}>
          {#if mappedDerivationGroups[sourceType]}
            {#each mappedDerivationGroups[sourceType] as group}
              <ExternalSourcePanelEntry
                enabled={$selectedPlanDerivationGroupIds.includes(group.id)}
                derivationGroup={group}
                user={user}
              />
            {/each}
          {/if}
        </Collapse>
      {/each}
    {:else}
      <p>
        <br>
        No External Sources Found
      </p>
    {/if}
  </svelte:fragment>
</Panel>
<style>
  .st-button {
    white-space: nowrap;
  }
</style>
