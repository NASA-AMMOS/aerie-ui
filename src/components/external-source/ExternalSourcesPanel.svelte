<svelte:options immutable={true} />

<script lang="ts">
  import { externalSources, planExternalSourceLinks } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import ListItem from '../ui/ListItem.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalSourcePanelEntry from './ExternalSourcePanelEntry.svelte';

  export let gridSection: ViewGridSection;

  export let user: User | null;

  // Track which source ids are enabled, from planExternalSourceLinks, to check membership from our list of externalSources
  let enabledSourceIds: number[] = [];

  // Perform the relevant mapping every time planExternalSourceLinks updates
  $: {
    enabledSourceIds = $planExternalSourceLinks.map(link => link.external_source_id);
    console.log(enabledSourceIds)
  }

</script>

<Panel>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Sources" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    {#if $externalSources.length}
      {#each $externalSources as externalSource}
        <ExternalSourcePanelEntry
          enabled={enabledSourceIds.includes(externalSource.id)}
          externalSource={externalSource}
          plan_id={$plan?.id}
          user={user}
        >

        </ExternalSourcePanelEntry>
      {/each}
    {:else}
      <ListItem>No External Sources Found</ListItem>
    {/if}
  </svelte:fragment>
</Panel>
