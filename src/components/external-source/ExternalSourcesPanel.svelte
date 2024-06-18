<svelte:options immutable={true} />

<script lang="ts">
  import { externalSourceWithTypeName, selectedPlanExternalSourceIds } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalSourceWithTypeName } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import CollapsibleListControls from '../CollapsibleListControls.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // filter which sources are visible
  let filterText: string = '';
  let filteredExternalEvents: ExternalSourceWithTypeName[] = [];
  $: filteredExternalEvents = $externalSourceWithTypeName
    .filter(source => {
      const filterTextLowerCase = filterText.toLowerCase();
      const includesName = source.key.toLocaleLowerCase().includes(filterTextLowerCase);
      return includesName;
    });
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

    {#if filteredExternalEvents.length}
      {#each filteredExternalEvents as externalSource}
        <ExternalSourcePanelEntry
          enabled={$selectedPlanExternalSourceIds.includes(externalSource.id)}
          externalSource={externalSource}
          plan_id={$plan?.id}
          user={user}
        />
      {/each}
    {:else}
      <p>
        <br>
        No External Sources Found
      </p>
    {/if}
  </svelte:fragment>
</Panel>
