<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Collapse from '../Collapse.svelte';

  export let activityTree;
  const dispatch = createEventDispatcher<{
    'activity-tree-node-change': any;
  }>();
</script>

{#if activityTree.length}
  {#each activityTree as node}
    <Collapse
      collapsible={!node.isLeaf}
      defaultExpanded={node.expanded}
      className="row-header-activity-group"
      title={node.label}
      on:collapse={e => dispatch('activity-tree-node-change', node)}
    >
      <svelte:self activityTree={node.groups} on:activity-tree-node-change />

      <!-- {#if node.groups}
        {#each node.groups as child}
        {/each}
      {/if} -->
    </Collapse>
  {/each}
{/if}

<style>
  :global(.row-header-activity-group.collapse > .collapse-header) {
    border-bottom: 1px solid var(--st-gray-30);
    border-radius: 0px;
    /* border-top: 1px solid var(--st-gray-30); */
    font-size: 10px;
    height: 20px !important;
    letter-spacing: 0.1px;
    padding: 0 !important;
    padding-left: 4px !important;
  }

  :global(.row-header-activity-group.collapse > .collapse-header:hover) {
    background: var(--st-gray-20) !important;
  }

  :global(.row-header-activity-group.collapse > .content.pad-content) {
    margin-left: 16px !important;
  }

  :global(.row-header-activity-group.collapse > .content) {
    gap: 0px;
  }
</style>
