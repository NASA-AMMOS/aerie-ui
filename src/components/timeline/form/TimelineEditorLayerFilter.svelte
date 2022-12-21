<svelte:options immutable={true} />

<script lang="ts">
  import { activityTypes } from '../../../stores/plan';
  import { resourceTypes } from '../../../stores/resource';
  import Menu from '../../menus/Menu.svelte';

  export let layer: Layer;

  type item = { name: string };

  let filterMenu: Menu;
  let input: HTMLInputElement;
  let layerAsActivity: ActivityLayer;
  let layerAsLine: LineLayer;
  let layerAsXRange: XRangeLayer;
  let filterString: string = '';
  let items: item[] = [];
  let filteredItems: item[] = [];
  let menuTitle: string = '';

  $: if (layer) {
    if (layer.chartType === 'activity') {
      layerAsActivity = layer as ActivityLayer;
      items = $activityTypes;
      menuTitle = 'Activty Dictionary';
    } else if (layer.chartType === 'line') {
      layerAsLine = layer as LineLayer;
      items = $resourceTypes;
      menuTitle = 'Resource Types';
    } else if (layer.chartType === 'x-range') {
      layerAsXRange = layer as XRangeLayer;
      items = $resourceTypes;
      menuTitle = 'Resource Types';
    }
  }

  $: if (filterString) {
    filteredItems = items.filter(item => item.name.indexOf(filterString) > -1);
  } else {
    filteredItems = items.slice();
  }

  function selectFilteredItems() {
    /* TODO - dispatch some update */
  }
</script>

<div class="timeline-editor-layer-filter" style="position: relative">
  <!-- TODO work out how to have focus also properly open the menu
  without stomping on click -->
  <input
    bind:this={input}
    bind:value={filterString}
    on:click|stopPropagation={() => {
      if (!filterMenu.shown) {
        filterMenu.show();
        input.focus();
      }
    }}
    autocomplete="off"
    class="st-input w-100"
    name="filter"
    placeholder="Search"
  />
  <Menu hideAfterClick={false} bind:this={filterMenu} placement="bottom-end" on:hide={() => (filterString = '')}>
    <div class="header">
      <div class="title st-typography-small-caps">{menuTitle}</div>
    </div>
    <div class="body st-typography-body">
      {#if filteredItems.length}
        {#each filteredItems as item}
          <button class="item st-button tertiary st-typography-body">
            {item.name}
          </button>
        {/each}
        {#if filterString}
          <button class="st-button secondary" on:click={selectFilteredItems}>
            Select {filteredItems.length}
            {layer.chartType === 'line' ? 'activities' : 'resources'}
          </button>
        {/if}
      {:else}
        <div>No items matching filter</div>
      {/if}
    </div>
  </Menu>
</div>

<style>
  .header {
    align-items: center;
    border-bottom: 1px solid var(--st-gray-20);
    color: var(--st-gray-40);
    cursor: auto;
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
    padding: 8px;
  }

  .title {
    color: var(--st-gray-40);
  }

  .timeline-editor-layer-filter input {
    position: relative;
    z-index: 1;
  }

  .body {
    cursor: auto;
    display: grid;
    gap: 8px;
    max-height: 376px;
    overflow: auto;
    padding: 8px;
    text-align: left;
  }

  .item {
    justify-content: left;
  }

  .body :global(.input-inline) {
    padding: 0;
  }
</style>
