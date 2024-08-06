<svelte:options immutable={true} />

<script lang="ts">
  import { capitalize, pluralize } from '../utilities/text';

  import ChevronDownIcon from '@nasa-jpl/stellar/icons/chevron_down.svg?component';
  import AddToRowIcon from '../assets/add-to-row.svg';
  import InsertInstanceIcon from '../assets/insert-instance.svg';
  import PlusCircledIcon from '../assets/plus-circled.svg';
  import { view, viewAddFilterToRow } from '../stores/views';
  import type { ChartType, Layer, Row, TimelineItemType } from '../types/timeline';
  import { permissionHandler } from '../utilities/permissionHandler';
  import { tooltip } from '../utilities/tooltip';
  import Input from './form/Input.svelte';
  import LayerPicker from './LayerPicker.svelte';
  import Menu from './menus/Menu.svelte';
  import ListItem from './ui/ListItem.svelte';
  import Tag from './ui/Tags/Tag.svelte';

  type FilterOption = {
    color?: string;
    label: string;
    value: string;
  };

  // type Item = $$Generic<{ name: string; [key: string]: any }>;

  export let createItem: ((name: string) => void) | undefined = undefined;
  export let hasPermission: boolean = true;
  export let permissionError: string = '';
  export let chartType: ChartType = 'activity';
  export let typeName: 'activity' | 'resource' = 'activity';
  export let items: TimelineItemType[] = [];
  export let filterOptions: FilterOption[] = [];
  export let filterName: string = 'Filter';
  export let filterItems: (
    items: TimelineItemType[],
    textFilters: string[],
    selectedFilterOptions: Record<string, FilterOption>,
  ) => TimelineItemType[];

  let menu: Menu;
  let filteredItems: TimelineItemType[] = [];
  let textFilters: string[] = [];
  let selectedFilters: Record<string, FilterOption> = {};
  let filterText: string = '';
  let layerPicker: LayerPicker;
  let layerPickerIndividual: LayerPicker;

  $: filteredItems = filterItems(items, filterText ? textFilters.concat(filterText) : textFilters, selectedFilters);
  $: timelines = $view?.definition.plan.timelines || [];

  function onDragEnd(): void {
    document.getElementById('list-item-drag-image')?.remove();
  }

  function onDragStart(event: DragEvent, item: TimelineItemType): void {
    const dragImage = document.createElement('div');
    const text = document.createTextNode(item.name);
    dragImage.appendChild(text);
    dragImage.id = 'list-item-drag-image';
    dragImage.style.padding = '8px 20px';
    dragImage.style.color = 'rgba(0, 0, 0, 0.8)';
    dragImage.style.background = 'var(--st-gray-10)';
    dragImage.style.width = 'min-content';
    dragImage.style.borderRadius = '4px';
    dragImage.style.border = '1px solid var(--st-gray-30)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.className = 'st-typography-medium';
    document.body.appendChild(dragImage);
    event.dataTransfer?.setDragImage(dragImage, 0, 0);
    event.dataTransfer?.setData('text/plain', JSON.stringify({ item, type: typeName }));
  }

  function addTextFilter() {
    if (filterText && textFilters.indexOf(filterText) < 0) {
      textFilters = textFilters.concat(filterText);
    }
    filterText = '';
  }

  function onInputKeydown(event: KeyboardEvent) {
    const { key } = event;
    if (key === 'Enter') {
      addTextFilter();
    }
  }

  function onBulkNewRow() {
    addTextFilter();
    viewAddFilterToRow(filteredItems, typeName);
  }

  function onBulkLayerPicked(event: CustomEvent<{ layer?: Layer; row: Row }>) {
    addTextFilter();
    viewAddFilterToRow(filteredItems, typeName, event.detail.row.id, event.detail.layer);
  }

  function onBulkAddToRow(e: MouseEvent) {
    e.stopPropagation();
    addTextFilter();
    layerPicker.toggle(e);
  }

  function onIndividualLayerPicked(event: CustomEvent<{ item?: TimelineItemType; layer?: Layer; row: Row }>) {
    if (event.detail.item) {
      viewAddFilterToRow([event.detail.item], typeName, event.detail.row.id, event.detail.layer);
    }
  }

  function onFilterIndividualItem(e: MouseEvent, item: TimelineItemType) {
    e.stopPropagation();
    layerPickerIndividual.toggle(e, item);
  }
</script>

<div class="timeline-item-list">
  <div class="timeline-item-list-filters">
    <input
      bind:value={filterText}
      on:keydown={onInputKeydown}
      class="st-input"
      name="search"
      autocomplete="off"
      placeholder="Filter {typeName} types"
    />
    <div style="position: relative">
      <button
        class="st-button secondary menu-button"
        style="position: relative; z-index: 1"
        on:click|stopPropagation={() => menu.toggle()}
      >
        {filterName}
        <ChevronDownIcon />
      </button>
      <Menu bind:this={menu} hideAfterClick={false} placement="bottom-end">
        <div class="timeline-item-list-filter-options">
          {#if !filterOptions.length}
            <div>No {filterName}{pluralize(filterName)} found</div>
          {/if}
          {#each filterOptions as option}
            <Input layout="inline" class="timeline-item-list-filter-option">
              <label class="st-typography-body timeline-item-list-filter-option-label" for={option.value}>
                {#if option.color}
                  <div class="color" style:background={option.color} />
                {/if}
                {option.label}
              </label>
              <input
                checked={!!selectedFilters[option.value.toString()]}
                id={option.value}
                name={option.value}
                on:change={() => {
                  if (selectedFilters[option.value]) {
                    delete selectedFilters[option.value];
                  } else {
                    selectedFilters[option.value] = option;
                  }
                  selectedFilters = { ...selectedFilters };
                }}
                type="checkbox"
              />
            </Input>
          {/each}
        </div>
      </Menu>
    </div>
  </div>

  <div class="filters st-typography-label">
    {#if textFilters.length === 0 && Object.keys(selectedFilters).length === 0 && !filterText}
      <i>No filters applied</i>
    {:else}
      {#each textFilters as filter, i}
        <Tag
          tag={{ id: i, name: filter }}
          on:click={() => {
            textFilters = textFilters.filter(f => f !== filter);
          }}
        />
      {/each}
      {#each Object.values(selectedFilters) as selectedFilter}
        <!-- TODO maybe pull the tag instead of recreating it? -->
        <Tag
          tag={{ color: selectedFilter.color, id: parseInt(selectedFilter.value), name: selectedFilter.label }}
          on:click={() => {
            delete selectedFilters[selectedFilter.value];
            selectedFilters = { ...selectedFilters };
          }}
        />
      {/each}
    {/if}
    {#if filterText}
      <i>Press enter to apply "{filterText}"</i>
    {/if}
  </div>

  <div class="list">
    <div class="list-header st-typography-medium">
      <div>Types ({filteredItems.length})</div>
      <div>
        <button
          class="st-button secondary"
          on:click={onBulkAddToRow}
          use:tooltip={{ content: 'Filter in Existing Row', placement: 'top' }}
        >
          <PlusCircledIcon /> Add to Row
        </button>
        <LayerPicker bind:this={layerPicker} rows={timelines[0].rows || []} {chartType} on:select={onBulkLayerPicked} />
      </div>
      <button
        class="st-button secondary"
        on:click={onBulkNewRow}
        use:tooltip={{ content: 'Filter in New Row', placement: 'top' }}
      >
        <AddToRowIcon /> New Row
      </button>
    </div>
    <div class="list-items">
      {#if filteredItems.length}
        {#each filteredItems as item}
          <ListItem
            draggable
            style="cursor: move;"
            on:dragend={onDragEnd}
            on:dragstart={e => onDragStart(e.detail, item)}
          >
            {item.name}
            <span slot="prefix">
              <slot name="prefix" />
            </span>
            <span slot="suffix">
              {#if createItem}
                <button
                  aria-label="Create{typeName}-{item.name}"
                  class="st-button icon"
                  on:click={() => createItem(item.name)}
                  use:tooltip={{
                    content: `Insert ${capitalize(typeName)} Instance`,
                    disabled: !hasPermission,
                    placement: 'top',
                  }}
                  use:permissionHandler={{
                    hasPermission: hasPermission ?? true,
                    permissionError,
                  }}
                >
                  <InsertInstanceIcon />
                </button>
              {/if}
              <button
                aria-label="Create{typeName}-{item.name}"
                class="st-button icon"
                on:click={e => onFilterIndividualItem(e, item)}
                use:tooltip={{ content: 'Filter in Existing Row', placement: 'top' }}
              >
                <PlusCircledIcon />
              </button>
              <button
                aria-label="Create{typeName}-{item.name}"
                class="st-button icon"
                on:click={() => viewAddFilterToRow([item], typeName)}
                use:tooltip={{ content: 'Add to New Row', placement: 'top' }}
              >
                <AddToRowIcon />
              </button>
            </span>
          </ListItem>
        {/each}
        <LayerPicker
          bind:this={layerPickerIndividual}
          rows={timelines[0].rows || []}
          {chartType}
          on:select={onIndividualLayerPicked}
        />
      {:else}
        <div class="st-typography-label empty-state">No {typeName} Types Found</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .timeline-item-list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .timeline-item-list-filters {
    align-items: center;
    display: flex;
    gap: 8px;
    padding: 8px 8px;
    position: relative;
  }

  .timeline-item-list-filters :global(.st-input) {
    flex: 1;
  }

  .filters {
    align-items: center;
    display: flex;
    gap: 8px;
    min-height: 28px;
    padding: 4px 12px;
  }

  .menu-button {
    gap: 4px;
    position: relative;
    z-index: 1;
  }

  .color {
    border-radius: 2px;
    flex-shrink: 0;
    height: 16px;
    margin-right: 8px;
    position: relative;
    width: 16px;
  }

  .color:after {
    border: 1px solid rgb(0 0 0 / 25%);
    border-radius: 2px;
    content: ' ';
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1;
  }

  :global(.timeline-item-list-filter-options) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    position: relative;
  }

  :global(.input.input-inline.timeline-item-list-filter-option) {
    display: flex;
    flex-direction: row-reverse;
    gap: 12px;
    justify-content: flex-end;
    padding: 0;
  }

  :global(.input.input-inline.timeline-item-list-filter-option input) {
    margin: 0;
  }

  .timeline-item-list-filter-option-label {
    align-items: center;
    display: flex;
    user-select: none;
  }

  .list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .list-header {
    align-items: center;
    display: flex;
    gap: 8px;
    height: 36px;
    padding: 8px 12px;
  }

  .list-header > div:first-child {
    flex: 1;
  }

  .list-header .st-button {
    gap: 4px;
  }

  .list-items {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .list-items {
    overflow: auto;
  }

  .empty-state {
    padding: 8px 12px;
    text-transform: capitalize;
  }
</style>
