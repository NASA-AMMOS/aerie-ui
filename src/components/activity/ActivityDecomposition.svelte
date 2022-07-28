<svelte:options immutable={true} />

<script lang="ts">
  import { activitiesMap } from '../../stores/activities';

  export let selected_id: number | null = null;
  export let expanded = true;
  export let id: number = 0;

  let iconClass = '';

  $: activity = $activitiesMap[id];
  $: isRoot = !activity.parent_id;
  $: type = activity.type || '';
  $: child_ids = activity.child_ids || null;
  $: hasChildren = child_ids ? child_ids.length > 0 : false;
  $: if (isRoot) {
    iconClass = expanded ? 'si-caret_down' : 'si-caret_right';
  } else if (hasChildren) {
    iconClass = expanded ? 'si-tree_parent' : 'si-tree_parent'; // TODO make the icon for tree parent expand/collapse
  } else {
    iconClass = 'si-tree_leaf';
  }

  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="activity-decomposition" on:click={toggle}>
  <i class={`st-icon si ${iconClass}`} />
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
