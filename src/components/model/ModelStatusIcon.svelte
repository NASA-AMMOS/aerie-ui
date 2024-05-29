<svelte:options immutable={true} />

<script lang="ts">
  import CheckIcon from '@nasa-jpl/stellar/icons/check.svg?component';
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import { tooltip } from '../../utilities/tooltip';
  import ProgressRadial from '../ui/ProgressRadial.svelte';

  export let tooltipContent: string | null = null;
  export let showCompleteStatus: boolean = true;
  export let status: 'extracting' | 'complete' | 'error' | 'none' = 'none';

  $: showCompleteStatus;
</script>

<div
  class="model-status-icon-container"
  use:tooltip={{
    content: tooltipContent,
  }}
>
  {#if status === 'extracting'}
    <ProgressRadial useBackground={false} size={14} />
  {:else if status === 'complete' && showCompleteStatus}
    <div class="check"><CheckIcon /></div>
  {:else if status === 'error'}
    <WarningIcon class="red-icon" />
  {/if}
</div>

<style>
  .model-status-icon-container {
    align-items: center;
    display: flex;
  }

  .model-status-icon-container .check {
    background-color: #0eaf0a;
    border-radius: 50%;
    color: var(--st-white);
    display: flex;
  }
</style>
