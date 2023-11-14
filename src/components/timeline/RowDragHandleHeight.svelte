<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ViewConstants } from '../../enums/view';

  const dispatch = createEventDispatcher();

  let parentElement: HTMLElement | null = null;

  function onMouseMove(event: MouseEvent): void {
    const parentY = parentElement?.getBoundingClientRect().y;

    if (parentY !== undefined) {
      const newHeight = event.clientY - parentY;
      if (newHeight >= ViewConstants.MIN_ROW_HEIGHT) {
        dispatch('updateRowHeight', { newHeight });
      }
    }
  }

  function onMouseDown(event: MouseEvent): void {
    parentElement = (event.target as HTMLElement).parentElement ?? null;
    document.addEventListener('mousemove', onMouseMove, false);
  }

  function onMouseUp(): void {
    parentElement = null;
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
