<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TimelineItemType } from '../../types/timeline';

  let isDropTarget: boolean = false;
  let isDragging: boolean = false;

  const dispatch = createEventDispatcher<{
    dragend: DragEvent;
    dragstart: DragEvent;
    drop: { item?: TimelineItemType; type?: string };
  }>();

  function onDragEnter() {
    isDropTarget = true;
  }

  function onDragLeave() {
    isDropTarget = false;
  }

  function onDragOver() {
    isDropTarget = true;
  }

  function onDrop(e: DragEvent) {
    isDropTarget = false;

    if (e.dataTransfer !== null) {
      const data = e.dataTransfer.getData('text');
      const json = JSON.parse(data || '{}');
      // const { type, item } =
      // const activityLayers = layers.filter(isActivityLayer);
      // if (type && item) {
      //   viewAddFilterToRow([item], type, rowId, activityLayers[0]);
      // }
      dispatch('drop', json);
    }
  }
</script>

<svelte:window
  on:dragstart={e => {
    isDragging = true;
    dispatch('dragstart', e);
  }}
  on:dragend={e => {
    isDragging = false;
    dispatch('dragend', e);
  }}
/>

<div
  class="drop-target"
  class:dropping={isDropTarget}
  role="none"
  on:dragenter|preventDefault={onDragEnter}
  on:dragleave={onDragLeave}
  on:dragover|preventDefault={onDragOver}
  on:drop|preventDefault={onDrop}
>
  <div class="content-wrapper" class:disable-pointer={isDragging}><slot /></div>
</div>

<style>
  .drop-target,
  .content-wrapper {
    display: inherit;
    height: inherit;
    width: inherit;
  }

  .disable-pointer,
  .disable-pointer * {
    pointer-events: none;
  }

  .dropping::after {
    box-shadow: 0 0 0px 2px inset var(--st-utility-blue);
    content: ' ';
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 9;
  }
</style>
