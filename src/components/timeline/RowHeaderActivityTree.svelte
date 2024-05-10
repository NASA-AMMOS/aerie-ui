<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FolderIcon from '../../assets/folder.svg?component';
  import DirectiveAndSpanIcon from '../../assets/timeline-directive-and-span.svg?component';
  import DirectiveIcon from '../../assets/timeline-directive.svg?component';
  import SpanIcon from '../../assets/timeline-span.svg?component';
  import type { ActivityDirective, ActivityDirectiveId } from '../../types/activity';
  import type { Span, SpanId } from '../../types/simulation';
  import type { MouseDown, MouseOver } from '../../types/timeline';
  import { pluralize } from '../../utilities/text';
  import Collapse from '../Collapse.svelte?component';

  export let activityTree;
  export let selectedActivityDirectiveId: ActivityDirectiveId | null = null;
  export let selectedSpanId: SpanId | null = null;

  const dispatch = createEventDispatcher<{
    'activity-tree-node-change': any;
    dblClick: MouseOver;
    mouseDown: MouseDown;
  }>();

  function onLeafClick(node, event) {
    dispatch(event, getDirectivesAndSpansForNode(node));
  }

  function getDirectivesAndSpansForNode(node) {
    const activityDirectives: ActivityDirective[] = [];
    const spans: Span[] = [];
    (node.items || []).forEach(({ directive, span }) => {
      if (directive) {
        activityDirectives.push(directive);
      }
      if (span) {
        spans.push(span);
      }
    });
    return { activityDirectives, spans };
  }

  function getNodeComposition(node) {
    let activityDirectiveCount = 0;
    let spanCount = 0;
    let combinedActivityDirectiveSpanCount = 0;
    (node.items || []).forEach(({ directive, span }) => {
      if (directive && span) {
        combinedActivityDirectiveSpanCount++;
      } else if (directive) {
        activityDirectiveCount++;
      } else if (span) {
        spanCount++;
      }
    });
    return { activityDirectiveCount, combinedActivityDirectiveSpanCount, spanCount };
  }
</script>

{#if activityTree.length}
  {#each activityTree as node}
    {#if node.isLeaf}
      {@const directive = node.items[0].directive}
      {@const span = node.items[0].span}
      <button
        class="row-header-activity-group leaf st-button tertiary"
        class:selected={directive?.id === selectedActivityDirectiveId || span?.id === selectedSpanId}
        on:dblclick={() => onLeafClick(node, 'dblClick')}
        on:click={() => onLeafClick(node, 'mouseDown')}
      >
        <div style=" align-items: center;color: var(--st-button-tertiary-color);display: flex; gap: 4px;">
          {#if directive && span}
            <div title="Combined Activity Directive and Simulated Activity" class="icon-group">
              <DirectiveAndSpanIcon />
            </div>
          {:else if directive}
            <div title="Activity Directive" class="icon-group">
              <DirectiveIcon />
            </div>
          {:else if span}
            <div title="Simulated Activity" class="icon-group">
              <SpanIcon />
            </div>
          {/if}
        </div>
        {node.label}
      </button>
    {:else}
      {@const { activityDirectiveCount, spanCount, combinedActivityDirectiveSpanCount } = getNodeComposition(node)}
      <Collapse
        collapsible={!node.isLeaf}
        defaultExpanded={node.expanded}
        className="row-header-activity-group"
        on:collapse={e => dispatch('activity-tree-node-change', node)}
      >
        <div slot="left" style="align-items: center;display: flex">
          {#if node.type === 'aggregation'}
            <div title="Type Group" class="icon-group">
              <FolderIcon />
            </div>
          {:else if combinedActivityDirectiveSpanCount > 0}
            <div title="Combined Activity Directive and Simulated Activity" class="icon-group">
              <DirectiveAndSpanIcon />
            </div>
          {:else if activityDirectiveCount > 0}
            <div title="Activity Directive" class="icon-group">
              <DirectiveIcon />
            </div>
          {:else if spanCount > 0}
            <div title="Simulated Activity" class="icon-group">
              <SpanIcon />
            </div>
          {/if}
        </div>
        <div slot="title" style="align-items: center;display: flex; gap: 8px;">
          {node.label}
          <div style=" align-items: center;color: var(--st-gray-50);display: flex; gap: 4px;">
            {#if node.type === 'directive'}
              <div title={`${node.groups.length} child type group${pluralize(node.groups.length)}`} class="icon-group">
                <FolderIcon />
                <span>{node.groups.length}</span>
              </div>
            {:else}
              {activityDirectiveCount + spanCount + combinedActivityDirectiveSpanCount}
            {/if}
          </div>
        </div>

        {#if node.expanded}
          <svelte:self
            activityTree={node.groups}
            on:activity-tree-node-change
            on:mouseDown
            on:dblClick
            {selectedActivityDirectiveId}
            {selectedSpanId}
          />
        {/if}
      </Collapse>
    {/if}
  {/each}
{/if}

<style>
  :global(.row-header-activity-group.collapse > .collapse-header),
  .row-header-activity-group.leaf {
    border-bottom: 1px solid var(--st-gray-30);
    border-radius: 0px;
    font-size: 10px;
    height: 20px !important;
    letter-spacing: 0.1px;
    padding: 0 !important;
    padding-left: 4px !important;
  }

  :global(.row-header-activity-group.collapse > .collapse-header:hover),
  .row-header-activity-group.leaf:hover:not(.selected) {
    background: var(--st-gray-20) !important;
  }

  :global(.row-header-activity-group.collapse > .content.pad-content) {
    margin-left: 16px !important;
  }

  :global(.row-header-activity-group.collapse > .content) {
    gap: 0px;
  }

  .row-header-activity-group.leaf {
    gap: 3px;
    height: 32px;
    justify-content: flex-start;
    outline: none;
    padding: 8px 0px 8px 0px;
  }

  :global(.row-header-activity-group.collapse .collapse-icon svg) {
    color: var(--st-gray-40);
  }

  .selected {
    background-color: #e3effd !important;
  }

  .icon-group {
    display: flex;
    gap: 4px;
  }

  .row-header-activity-group.selected,
  .row-header-activity-group.selected :global(svg) {
    color: var(--st-utility-blue) !important;
  }
</style>
