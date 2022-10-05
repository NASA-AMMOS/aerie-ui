<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import { TabContextKey } from './Tabs.svelte';

  export let tabId: TabId = {};

  const { registerTab, selectTab, selectedTab } = getContext<TabContext>(TabContextKey);
  const dispatch = createEventDispatcher();

  function onSelectTab() {
    selectTab(tabId);
    dispatch('select-tab', tabId);
  }

  registerTab(tabId);
</script>

<button class:selected={$selectedTab === tabId} on:click={onSelectTab}>
  <slot />
</button>

<style>
  button {
    background: none;
    border: none;
    border-bottom: 2px solid white;
    border-radius: 0;
    color: #ccc;
    margin: 0;
  }

  .selected {
    border-bottom: 2px solid teal;
    color: #333;
  }
</style>
