<svelte:options immutable={true} />

<script lang="ts">
  import ChevronDownIcon from '@nasa-jpl/stellar/icons/chevron_down.svg?component';
  import ChevronUpIcon from '@nasa-jpl/stellar/icons/chevron_up.svg?component';
  import Tabs from '../ui/Tabs/Tabs.svelte';

  let isOpen: boolean = false;

  function onSelectTab() {
    isOpen = true;
  }

  function onToggle() {
    isOpen = !isOpen;
  }
</script>

<div class="console-container">
  <div class="console-expand-container" class:expanded={isOpen}>
    <Tabs on:select-tab={onSelectTab}>
      <svelte:fragment slot="tab-list">
        <div class="console-tabs">
          <div>
            <slot name="console-tabs" />
          </div>
          <div class="console-toggle" on:click={onToggle}>
            {#if isOpen}
              <ChevronDownIcon />
            {:else}
              <ChevronUpIcon />
            {/if}
          </div>
        </div>
      </svelte:fragment>
      <div class="console-panels">
        <slot />
      </div>
    </Tabs>
  </div>
</div>

<style>
  .console-container {
    position: relative;
    width: 100%;
  }

  .console-expand-container {
    background-color: white;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  .console-expand-container.expanded {
    height: 336px;
    top: -300px;
  }

  .console-tabs {
    align-items: center;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .console-toggle {
    cursor: pointer;
    margin-right: 1rem;
  }

  .console-panels {
    height: 0;
    overflow: hidden;
  }

  .console-expand-container.expanded .console-panels {
    height: 100%;
  }
</style>
