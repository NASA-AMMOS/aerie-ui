<svelte:options immutable={true} />

<script lang="ts">
  import { externalSources, planExternalSourceLinks } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import ListItem from '../ui/ListItem.svelte';
  import Panel from '../ui/Panel.svelte';

  export let gridSection: ViewGridSection;

  // We need to keep track of...
  // * the possible sources
  // * the actual sources included in the plan
  // * the plan itself

  let selection: any[] = [];

</script>

<Panel>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Sources" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    {#if $externalSources.length}
      {#each $externalSources as externalSource}
        <ListItem>
          {externalSource.key}
          <span slot="suffix">
            <label>
              <input
                type="checkbox"
                bind:group={selection}
                value={{ plan_id: $plan?.id, source_id: externalSource.id }}
              />
            </label>
          </span>
        </ListItem>
      {/each}
    {:else}
      <ListItem>No External Sources Found</ListItem>
    {/if}
    <div class="debug">
      <div>
        Possible Sources:
        <pre>{JSON.stringify($externalSources, null, 2)}</pre>
      </div>
      <div>
        Selected Sources:
        <pre>{JSON.stringify($planExternalSourceLinks, null, 2)}</pre>
      </div>
      <div>
        Selection Group:
        <pre>{JSON.stringify(selection, null, 2)}</pre>
      </div>
    </div>
  </svelte:fragment>
</Panel>
