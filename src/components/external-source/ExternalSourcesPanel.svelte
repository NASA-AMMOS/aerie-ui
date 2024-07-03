<svelte:options immutable={true} />

<script lang="ts">
  import { createExternalSourcePlanError, derivationGroups, externalSourceTypes, getEventSourceTypeName, selectedPlanDerivationGroupIds } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { createExternalSourcePlanError, externalSourceWithTypeName, selectedPlanExternalSourceIds } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import type { DerivationGroup } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import Collapse from '../Collapse.svelte';
  import CollapsibleListControls from '../CollapsibleListControls.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import AlertError from '../ui/AlertError.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // filter which derivation groups are visible
  let filterText: string = '';
  let mappedDerivationGroups: { [key: string]: DerivationGroup[] } = {};
  let filteredDerivationGroups: DerivationGroup[] = [];
  $: console.log("DERIVATION GROUPS: ", $derivationGroups)
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
</script>

<Panel>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Sources" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <CollapsibleListControls
      placeholder="Filter External Sources"
      on:input={event => (filterText = event.detail.value)}
    />

    <AlertError class="m-2" error={$createExternalSourcePlanError} />

    <!-- {#if filteredDerivationGroups.length}
      {#each filteredDerivationGroups as derivationGroup}
        <ExternalSourcePanelEntry
          enabled={$selectedPlanExternalSourceIds.includes(derivationGroup.id)}
          derivationGroup={derivationGroup}
          plan_id={$plan?.id}
          user={user}
        />
      {/each} -->
    {#if filteredDerivationGroups.length}
      {#each Object.keys(mappedDerivationGroups) as sourceType}
        <Collapse title={sourceType.toString()} tooltipContent={sourceType.toString()} defaultExpanded={false}>
          {#if mappedDerivationGroups[sourceType]}
            {#each mappedDerivationGroups[sourceType] as group}
              <ExternalSourcePanelEntry
                enabled={$selectedPlanDerivationGroupIds.includes(group.id)}
                derivationGroup={group}
                plan_id={$plan?.id}
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
