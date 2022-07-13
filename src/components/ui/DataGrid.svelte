<svelte:options immutable={true} />

<script lang="ts">
  import { Grid, type ColDef, type GridOptions } from 'ag-grid-community';
  import { onMount } from 'svelte';

  export let columnDefs: ColDef[];
  export let rowData: TRowData[] = [];
  export let rowSelection: 'single' | 'multiple';

  export let suppressRowClickSelection: boolean;

  let gridOptions: GridOptions;
  let gridDiv: HTMLDivElement;

  $: {
    gridOptions?.api?.setRowData(rowData);
  }

  onMount(() => {
    gridOptions = {
      // each entry here represents one column
      columnDefs,
      rowData,
      rowSelection,
      suppressRowClickSelection,
    };
    new Grid(gridDiv, gridOptions);
  });
</script>

<div bind:this={gridDiv} class="ag-theme-alpine table" />

<style>
  .table {
    width: 100%;
    height: 100%;
  }
</style>
