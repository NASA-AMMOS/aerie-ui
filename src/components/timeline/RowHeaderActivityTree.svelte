<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FolderIcon from '../../assets/folder.svg?component';
  import DirectiveAndSpanIcon from '../../assets/timeline-directive-and-span.svg?component';
  import DirectiveIcon from '../../assets/timeline-directive.svg?component';
  import SpanIcon from '../../assets/timeline-span.svg?component';
  import type { ActivityDirectiveId } from '../../types/activity';
  import type { SpanId } from '../../types/simulation';
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

  function isSelected(node, selectedActivityDirectiveId: number, selectedSpanId: number) {
    if (node.directives && node.directives.length) {
      if (node.directives[0].id === selectedActivityDirectiveId) {
        return true;
      }
    }
    if (node.spans && node.spans.length) {
      if (node.spans[0].id === selectedSpanId) {
        return true;
      }
    }
    return false;
  }
</script>

{#if activityTree.length}
  {#each activityTree as node}
    {#if node.isLeaf}
      <button
        class="row-header-activity-group leaf st-button tertiary"
        class:selected={isSelected(node, selectedActivityDirectiveId, selectedSpanId)}
        on:dblclick={() => {
          dispatch('dblClick', { activityDirectives: node.directives || [], spans: node.spans || [] });
        }}
        on:click={() => {
          dispatch('mouseDown', { activityDirectives: node.directives || [], spans: node.spans || [] });
        }}
      >
        <div style=" align-items: center;color: var(--st-gray-50);display: flex; gap: 4px;">
          {#if node.directives?.length && node.spans?.length}
            <div title="Activity Directive and Simulated Activity" class="icon-group">
              <DirectiveAndSpanIcon />
            </div>
          {:else if node.directives?.length}
            <div title="Activity Directive" class="icon-group">
              <DirectiveIcon />
            </div>
          {:else if node.spans?.length}
            <div title="Simulated Activity" class="icon-group">
              <SpanIcon />
            </div>
          {/if}
        </div>
        {node.label}
      </button>
    {:else}
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
          {:else if node.directives?.length}
            {#if node.spans?.length}
              <div title="Activity Directive and Simulated Activity" class="icon-group">
                <DirectiveAndSpanIcon />
              </div>
            {:else}
              <div title="Activity Directive" class="icon-group">
                <DirectiveIcon />
              </div>
            {/if}
          {:else if node.spans?.length}
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
              {#if node.directives?.length}
                <div
                  title={`${node.directives.length} Activity Directive${pluralize(node.directives.length)}`}
                  class="icon-group"
                >
                  <DirectiveIcon />
                  <span>{node.directives.length}</span>
                </div>
              {/if}
              {#if node.spans?.length}
                <div
                  title={`${node.spans.length} Simulated Activit${node.spans.length === 1 ? 'y' : 'ies'}`}
                  class="icon-group"
                >
                  <SpanIcon />
                  <span>{node.spans.length}</span>
                </div>
              {/if}
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
