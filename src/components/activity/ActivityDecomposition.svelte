<svelte:options immutable={true} />

<script lang="ts">
  import CaretDownIcon from '@nasa-jpl/stellar/icons/svg/caret_down.svg?component';
  import CaretRightIcon from '@nasa-jpl/stellar/icons/svg/caret_right.svg?component';
  import TreeLeafIcon from '@nasa-jpl/stellar/icons/svg/tree_leaf.svg?component';
  import TreeParentCollapsedIcon from '@nasa-jpl/stellar/icons/svg/tree_parent_collapsed.svg?component';
  import TreeParentExpandedIcon from '@nasa-jpl/stellar/icons/svg/tree_parent_expanded.svg?component';
  import { activitiesMap } from '../../stores/activities';

  export let selected_id: number | null = null;
  export let expanded = true;
  export let id: number = 0;

  $: activity = $activitiesMap[id];
  $: isRoot = !activity.parent_id;
  $: type = activity.type || '';
  $: child_ids = activity.child_ids || null;
  $: hasChildren = child_ids ? child_ids.length > 0 : false;

  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="activity-decomposition" on:click={toggle}>
  {#if isRoot}
    {#if expanded}
      <CaretDownIcon />
    {:else}
      <CaretRightIcon />
    {/if}
  {:else if hasChildren}
    {#if expanded}
      <TreeParentExpandedIcon />
    {:else}
      <TreeParentCollapsedIcon />
    {/if}
  {:else}
    <TreeLeafIcon />
  {/if}
  <span class={id === selected_id ? 'st-typography-medium' : 'unselected st-typography-body'}>{type}</span>
</div>

{#if hasChildren && expanded}
  <ul>
    {#each child_ids as child_id}
      <li>
        <svelte:self id={$activitiesMap[child_id]?.id} {selected_id} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    margin: 0px;
    padding-inline-start: 32px;
  }

  li {
    list-style: none;
  }

  .activity-decomposition {
    height: 24px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .unselected {
    color: var(--st-gray-60);
  }
</style>
