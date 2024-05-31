<svelte:options immutable={true} />

<script lang="ts">
  import { externalSources, planExternalSourceLinks } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalSourceSlim } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import CollapsibleListControls from '../CollapsibleListControls.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // filter which sources are visible
  let filterText: string = '';
  let fileteredExternalEvents: ExternalSourceSlim[] = [];
  $: fileteredExternalEvents = $externalSources
    .filter(source => {
      const filterTextLowerCase = filterText.toLowerCase();
      const includesName = source.key.toLocaleLowerCase().includes(filterTextLowerCase);
      return includesName;
    });

  // Track which source ids are enabled, from planExternalSourceLinks, to check membership from our list of externalSources
  let enabledSourceIds: number[] = [];

  // Perform the relevant mapping every time planExternalSourceLinks updates
  $: {
    enabledSourceIds = $planExternalSourceLinks.filter(link => link.plan_id === $plan?.id).map(link => link.external_source_id);
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
    </CollapsibleListControls>


    {#if fileteredExternalEvents.length}
      {#each fileteredExternalEvents as externalSource}
        <ExternalSourcePanelEntry
          enabled={enabledSourceIds.includes(externalSource.id)}
          externalSource={externalSource}
          plan_id={$plan?.id}
          user={user}
        >

        </ExternalSourcePanelEntry>
      {/each}
    {:else}
      <p>
        <br>
        No External Sources Found
      </p>
    {/if}
  </svelte:fragment>
</Panel>
