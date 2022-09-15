<svelte:options immutable={true} />

<script lang="ts">
  import CaretDownIcon from '@nasa-jpl/stellar/icons/caret_down.svg?component';
  import CaretRightIcon from '@nasa-jpl/stellar/icons/caret_right.svg?component';
  import { createEventDispatcher } from 'svelte';
  import RowDragHandleMove from './RowDragHandleMove.svelte';

  export let rowDragMoveDisabled: boolean = false;
  export let title: string = '';
  export let rowId: number = 0;
  export let expanded: boolean = true;

  const dispatch = createEventDispatcher();

  function toggleExpansion() {
    dispatch('toggleRowExpansion', { expanded: !expanded, rowId });
  }
</script>

<div class="row-header">
  <button class="st-button icon" on:click={toggleExpansion}>
    {#if expanded}
      <CaretDownIcon class="row-header-collapse" />
    {:else}
      <CaretRightIcon class="row-header-collapse" />
    {/if}
  </button>

  <div class="row-header-title st-typography-medium">{title}</div>
  <div class="row-hover-menu">
    <RowDragHandleMove disabled={rowDragMoveDisabled} on:mouseDownRowMove />
  </div>

  {#if $$slots.right}
    <div class="right">
      <slot name="right" />
    </div>
  {/if}
</div>

<style>
  .row-header {
    align-items: center;
    background-color: var(--st-gray-10);
    border-bottom: 1px solid var(--st-gray-15);
    border-top: 1px solid var(--st-gray-15);
    display: flex;
    height: 22px;
    padding: 0px 8px 0px 4px;
    position: relative;
  }

  .row-header-title {
    color: var(--st-gray-70);
    cursor: pointer;
    flex: 1;
    user-select: none;
  }

  :global(.row-header-collapse) {
    color: var(--st-gray-30);
  }

  .row-hover-menu {
    color: var(--st-gray-50);
    font-size: 1.2rem;
    left: calc(50% - 8px);
    opacity: 0.2;
    position: absolute;
    z-index: 2;
  }
</style>
