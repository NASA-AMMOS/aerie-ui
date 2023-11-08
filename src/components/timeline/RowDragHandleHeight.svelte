<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ViewConstants } from '../../enums/view';

  export let rowHeight: number = 0;

  const dispatch = createEventDispatcher();

  let clientY: number | null = null;
  let oldHeight: number = rowHeight;

  function onMouseMove(event: MouseEvent): void {
    if (clientY == null) {
      return;
    }

    const dy = event.clientY - clientY;
    const newHeight = oldHeight + dy;
    if (newHeight >= ViewConstants.MIN_ROW_HEIGHT) {
      dispatch('updateRowHeight', { newHeight });
    }
  }

  function onMouseDown(event: MouseEvent): void {
    clientY = event.clientY;
    oldHeight = rowHeight;
    document.addEventListener('mousemove', onMouseMove, false);
  }

  function onMouseUp(): void {
    clientY = null;
    document.removeEventListener('mousemove', onMouseMove, false);
  }
</script>

<svelte:window on:mouseup={onMouseUp} />

<div class="row-drag-handle-height" role="none" on:mousedown|capture={onMouseDown} />

<style>
  div {
    background-color: var(--st-gray-20);
    cursor: row-resize;
    height: 2px;
    width: 100%;
  }

  .row-drag-handle-height:hover,
  .row-drag-handle-height:active {
    background-color: var(--st-gray-30);
    z-index: 4;
  }
</style>
