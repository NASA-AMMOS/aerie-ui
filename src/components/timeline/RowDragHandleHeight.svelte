<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let rowHeight: number = 0;

  const dispatch = createEventDispatcher();

  let clientY: number | null = null;
  let dragging: boolean = false;

  function onMouseMove(event: MouseEvent): void {
    if (clientY == null) {
      return;
    }

    const dy = event.clientY - clientY;
    const newHeight = rowHeight + dy;
    if (newHeight >= 80) {
      dispatch('updateRowHeight', { newHeight });
    }
    clientY = event.clientY;
  }

  function onMouseDown(event: MouseEvent): void {
    dragging = true;
    clientY = event.clientY;
    document.addEventListener('mousemove', onMouseMove, false);
  }

  function onMouseUp(): void {
    dragging = false;
    clientY = null;
    document.removeEventListener('mousemove', onMouseMove, false);
  }
</script>

<svelte:window on:mouseup={onMouseUp} />

<div class="row-drag-handle-height" role="none" on:mousedown|capture={onMouseDown} class:dragging />

<style>
  div {
    background-color: var(--st-gray-20);
    cursor: row-resize;
    height: 2px;
    width: 100%;
  }

  .row-drag-handle-height:hover,
  .dragging {
    background-color: var(--st-gray-30);
    z-index: 4;
  }
</style>
