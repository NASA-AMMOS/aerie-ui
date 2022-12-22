<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Menu from '../../menus/Menu.svelte';

  export let layer: Layer;
  export let values: string[];
  export let options: string[];

  const dispatch = createEventDispatcher();

  let filterMenu: Menu;
  let input: HTMLInputElement;
  let filterString: string = '';
  let filteredValues: string[] = [];
  let menuTitle: string = '';
  let selectedValuesMap = {};

  $: if (layer) {
    selectedValuesMap = listToMap(values);
    if (layer.chartType === 'activity') {
      /* TODO pass this in somehow, don't need the whole layer */
      menuTitle = 'Activty Dictionary';
    } else if (layer.chartType === 'line') {
      menuTitle = 'Resource Types';
    } else if (layer.chartType === 'x-range') {
      menuTitle = 'Resource Types';
    }
  }

  $: if (filterString) {
    filteredValues = options.filter(item => item.indexOf(filterString) > -1);
  } else {
    filteredValues = options.slice();
  }

  function listToMap(list: string[]): Record<string, boolean> {
    return list.reduce((map, item) => {
      if (!map[item]) {
        map[item] = true;
      }
      return map;
    }, {});
  }

  function selectFilteredValues() {
    const newValues = [...new Set([values, ...filteredValues])];
    dispatch('change', { values: newValues });
  }

  function toggleItem(value: string) {
    let newVaues = [];
    console.log(selectedValuesMap);
    if (selectedValuesMap[value]) {
      newVaues = values.filter(i => value !== i);
    } else {
      newVaues = [...values, value];
    }
    console.log('newVaues :>> ', newVaues);
    dispatch('change', { values: newVaues });
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
      {#if filteredValues.length}
        <div class="values">
          {#each filteredValues as item}
            <button
              class="value st-button tertiary st-typography-body"
              on:click={() => toggleItem(item)}
              class:active={selectedValuesMap[item]}
            >
              {item}
            </button>
          {/each}
        </div>
        {#if filterString}
          <button class="st-button secondary" on:click={selectFilteredValues}>
            Select {filteredValues.length}
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
    text-align: left;
  }

  .values {
    display: flex;
    flex-direction: column;
  }

  .value {
    border-radius: 0;
    justify-content: left;
    padding: 16px 8px;
  }

  .value:hover {
    background: var(--st-gray-20);
  }

  .value.active {
    background: #4fa1ff4f;
  }

  .body :global(.input-inline) {
    padding: 0;
  }
</style>
