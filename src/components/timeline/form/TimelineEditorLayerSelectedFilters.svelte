<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ChartType } from '../../../types/timeline';
  import Chip from '../../ui/Chip.svelte';

  export let filters: string[];
  export let chartType: ChartType;

  let open = false;
  let verb = '';
  $: if (filters) {
    if (filters.length !== 1) {
      verb = chartType === 'activity' ? 'activities' : 'resources';
    } else {
      verb = chartType === 'activity' ? 'activity' : 'resource';
    }
  }

  const dispatch = createEventDispatcher();
</script>

<div class="st-typography-medium timeline-editor-layer-selected-filters">
  {#if filters.length === 0}
    <div class="filter-items-empty">
      All {chartType === 'activity' ? 'activities' : 'resources'}
    </div>
  {:else}
    <details {open}>
      <summary style="text-transform: capitalize">{filters.length} {verb}</summary>
      <div class="filter-items">
        {#each filters as item}
          <Chip label={item} on:click={() => dispatch('remove', { filter: item })} />
        {/each}
      </div>
    </details>
  {/if}
</div>

<style>
  .filter-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 0 8px 16px;
  }

  .filter-items-empty {
    align-items: center;
    display: flex;
    height: 16px;
    margin: 8px 0px 8px 16px;
  }
</style>
