<svelte:options immutable={true} />

<script lang="ts">
  import TabList from '../ui/Tabs/TabList.svelte';
  import Tabs from '../ui/Tabs/Tabs.svelte';

  let isOpen: boolean = false;

  function onSelectTab() {
    isOpen = true;
  }
</script>

<div class="console-container">
  <div class="console-expander" class:expanded={isOpen}>
    <Tabs on:select-tab={onSelectTab}>
      <TabList>
        <slot name="tab-list" />
      </TabList>
      <slot />
    </Tabs>
  </div>
</div>

<style>
  .console-container {
    height: 36px;
    position: relative;
    width: 100%;
  }

  .console-container .console-expander {
    background-color: white;
    height: 336px;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  .console-container .console-expander.expanded {
    top: -300px;
  }
</style>
