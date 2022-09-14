<svelte:options immutable={true} />

<script lang="ts">
  import CaretDownIcon from '@nasa-jpl/stellar/icons/caret_down.svg?component';
  import RowDragHandleMove from './RowDragHandleMove.svelte';

  export let rowDragMoveDisabled = false;
</script>

<div class="row-header">
  <CaretDownIcon class="row-header-collapse" />
  <div class="row-header-title st-typography-medium">Row Name</div>
  <div class="row-hover-menu">
    <RowDragHandleMove disabled={rowDragMoveDisabled} on:mouseDownRowMove />
  </div>
</div>

<style>
  .row-header {
    align-items: center;
    background-color: var(--st-gray-10);
    border-bottom: 1px solid var(--st-gray-15);
    border-top: 1px solid var(--st-gray-15);
    display: flex;
    height: 22px;
    padding: 0px 4px 0px 8px;
    position: relative;
  }

  .row-header-title {
    color: var(--st-gray-70);
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
