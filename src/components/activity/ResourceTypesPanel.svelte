<svelte:options immutable={true} />

<script lang="ts">
  import { resourceTypes } from '../../stores/simulation';
  import type { ResourceType } from '../../types/simulation';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import ResourceTree from './ResourceTree.svelte';

  export let gridSection: ViewGridSection;

  let filterText: string = '';
  let filteredResourceTypes: ResourceType[] = [];
  let tree: Array = [];
  let mode: 'tree' | 'list' = 'tree';
  const columnDefs: DataGridColumnDef[] = [
    {
      field: 'schema.type',
      filter: 'number',
      headerName: 'Type',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 100,
    },
    {
      field: 'name',
      filter: 'string',
      headerName: 'Name',
      resizable: true,
      sortable: true,
    },
  ];

  $: if ($resourceTypes.length) {
    tree = [];
    let level = { tree };

    filteredResourceTypes = $resourceTypes.filter(
      resourceType => !filterText || resourceType.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1,
    );

    filteredResourceTypes.forEach(resourceType => {
      resourceType.name
        .split('/')
        .filter(n => n !== '')
        .reduce((r, name, i, a) => {
          if (!r[name]) {
            if (i === a.length - 1) {
              r[name] = { ...resourceType };
              r.tree.push({ name, isLeaf: true, data: { ...resourceType }, open: false });
            } else {
              r[name] = { tree: [] };
              r.tree.push({ name, children: r[name].tree, open: false });
            }
          }

          return r[name];
        }, level);
    });
    tree = { name: 'root', children: tree };
  }
</script>

<Panel>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="Resource Types" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <fieldset class="p-0 pb-2">
      <input
        bind:value={filterText}
        class="st-input w-100"
        name="search"
        placeholder="Filter resource types"
        autocomplete="off"
      />
      <div style="display: flex;">
        <button class="st-button icon" on:click={() => (mode = 'tree')}>tree</button>
        <button class="st-button icon" on:click={() => (mode = 'list')}>list</button>
      </div>
    </fieldset>
    {#if mode === 'tree'}
      <ResourceTree {tree} />
    {/if}
    {#if mode === 'list'}
      <SingleActionDataGrid {columnDefs} itemDisplayText="Resource" items={filteredResourceTypes} />
      <!-- <div style="display: flex; flex-direction: column; gap: 4px">
        {#each filteredResourceTypes as resourceType}
          <div class="st-typography-body resource-name">
            <span class="resource-type">{resourceType.schema.type}</span>
            {resourceType.name}
          </div>
        {/each}
      </div> -->
    {/if}
  </svelte:fragment>
</Panel>

<style>
  .resource-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resource-type {
    background: var(--st-gray-10);
    font-family: 'JetBrains mono';
    padding: 2px;
  }
</style>
