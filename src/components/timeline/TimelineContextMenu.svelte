<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ActivityDirective, ActivityDirectivesMap } from '../../types/activity';
  import type { Span, SpansMap, SpanUtilityMaps } from '../../types/simulation';
  import type { MouseOver } from '../../types/timeline';
  import { getAllSpansForActivityDirective, getSpanRootParent } from '../../utilities/activities';
  import ContextMenu from '../context-menu/ContextMenu.svelte';
  import ContextMenuItem from '../context-menu/ContextMenuItem.svelte';
  import ContextSubMenuItem from '../context-menu/ContextSubMenuItem.svelte';

  export let activityDirectivesMap: ActivityDirectivesMap;
  export let spansMap: SpansMap;
  export let spanUtilityMaps: SpanUtilityMaps;
  export let contextMenu: MouseOver;

  const dispatch = createEventDispatcher();

  let contextMenuComponent: ContextMenu;
  let activityDirective: ActivityDirective;
  let activityDirectiveSpans: Span[] = [];
  let span: Span;

  $: if (contextMenu && contextMenuComponent) {
    const { e, selectedActivityDirectiveId, selectedSpanId } = contextMenu;
    contextMenuComponent.show(e);
    activityDirective = null;
    span = null;
    activityDirectiveSpans = null;
    if (typeof selectedActivityDirectiveId === 'number') {
      activityDirective = activityDirectivesMap[selectedActivityDirectiveId];
      activityDirectiveSpans = getAllSpansForActivityDirective(selectedActivityDirectiveId, spansMap, spanUtilityMaps);
    } else if (typeof selectedSpanId === 'number') {
      span = spansMap[selectedSpanId];
    }
  } else {
    activityDirective = null;
    span = null;
    activityDirectiveSpans = null;
  }

  function jumpToActivityDirective() {
    const rootSpan = getSpanRootParent(spansMap, span.id);
    if (rootSpan) {
      const activityDirectiveId = spanUtilityMaps.spanIdToDirectiveIdMap[rootSpan.id];
      dispatch('jumpToActivityDirective', activityDirectiveId);
    }
  }
</script>

<ContextMenu hideAfterClick on:hide bind:this={contextMenuComponent}>
  {#if activityDirective}
    <ContextMenuItem on:click={() => dispatch('deleteActivityDirective', activityDirective.id)}
      >Delete Directive
    </ContextMenuItem>
    {#if activityDirectiveSpans}
      <ContextSubMenuItem text="Jump to Simulated Activities" parentMenu={contextMenuComponent}>
        {#each activityDirectiveSpans as activityDirectiveSpan}
          <ContextMenuItem on:click={() => dispatch('jumpToSpan', activityDirectiveSpan.id)}
            >{activityDirectiveSpan.type}
          </ContextMenuItem>
        {/each}
      </ContextSubMenuItem>
    {/if}

    {#if activityDirective.anchor_id !== null}
      <ContextMenuItem on:click={() => dispatch('jumpToActivityDirective', activityDirective.anchor_id)}>
        Jump to Anchor Directive
      </ContextMenuItem>
    {/if}
  {/if}
  {#if span}
    <ContextMenuItem on:click={jumpToActivityDirective}>Jump to Activity Directive</ContextMenuItem>
  {/if}
</ContextMenu>
