<svelte:options immutable={true} />

<script lang="ts">
  import Collapse from '../Collapse.svelte';

  export let tree: any;
</script>

<div>
  {#if !tree}
    <div />
  {:else if tree.isLeaf}
    <div class="leaf st-typography-body">
      <div class="leaf-name">
        Name: {tree.data.name}
      </div>
      <div class="leaf-name">
        Type: {tree.data.schema.type}
      </div>
      <div>
        Schema: <div class="resource-tree-schema">{JSON.stringify(tree.data.schema)}</div>
      </div>
    </div>
  {:else if tree.children}
    <!-- HM ROOT -->
    {#each tree.children as child}
      <Collapse
        title={child.name}
        defaultExpanded={child.open}
        preserveContent={false}
        on:toggle={expanded => {
          child.open = expanded;
        }}
      >
        <svelte:self tree={child} />
      </Collapse>
    {/each}
  {/if}
</div>

<style>
  .resource-tree-schema {
    background: var(--st-gray-10);
    border: 1px solid var(--st-gray-20);
    border-radius: 4px;
    font-family: 'JetBrains mono';
    height: unset;
    margin-top: 4px;
    padding: 8px;
    white-space: unset;
    word-break: break-word;
    word-wrap: normal;
  }

  .leaf {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .leaf-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
