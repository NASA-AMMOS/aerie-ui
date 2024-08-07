<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ChartType, Layer, Row, TimelineItemType } from '../types/timeline';
  import ContextMenu from './context-menu/ContextMenu.svelte';
  import ContextMenuHeader from './context-menu/ContextMenuHeader.svelte';
  import ContextMenuItem from './context-menu/ContextMenuItem.svelte';
  import ContextSubMenuItem from './context-menu/ContextSubMenuItem.svelte';

  export let rows: Row[] = [];
  export let chartType: ChartType = 'activity';

  const dispatch = createEventDispatcher<{
    select: { item?: TimelineItemType; layer?: Layer; row: Row };
  }>();

  let contextMenu: ContextMenu;
  let layerItem: TimelineItemType | undefined = undefined;

  export function toggle(e: MouseEvent, item?: TimelineItemType) {
    if (contextMenu.isShown()) {
      contextMenu.hide();
      layerItem = undefined;
    } else {
      show(e);
      layerItem = item || undefined;
    }
  }

  export function show(e: MouseEvent) {
    const bounds = (e.target as HTMLElement).getBoundingClientRect();
    contextMenu.showDirectly(bounds.x, bounds.y + bounds.height + 4, bounds.x);
  }
</script>

<ContextMenu hideAfterClick={false} bind:this={contextMenu}>
  <ContextMenuHeader>Add to Existing Row</ContextMenuHeader>
  {#if rows.length < 1}
    <div class="st-typography-label empty">No rows found</div>
  {/if}
  {#each rows as row}
    <ContextSubMenuItem text={row.name} parentMenu={contextMenu}>
      <ContextMenuItem on:click={() => dispatch('select', { item: layerItem, row })}>
        <div class="context-menu-button">New Layer +</div>
      </ContextMenuItem>
      {#each row.layers.filter(l => l.chartType === chartType) as layer}
        <ContextMenuItem on:click={() => dispatch('select', { item: layerItem, layer, row })}>
          <div class="layer">
            {layer.name || `${layer.chartType} Layer`}
          </div>
        </ContextMenuItem>
      {/each}
    </ContextSubMenuItem>
  {/each}
</ContextMenu>

<style>
  .layer {
    text-transform: capitalize;
  }

  .empty {
    padding: 8px 4px;
    user-select: none;
  }

  /* TODO clean this up */
  :global(.context-menu-button) {
    color: var(--st-utility-blue);
  }
</style>
