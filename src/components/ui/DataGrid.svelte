<svelte:options immutable={true} />

<script lang="ts">
  import { Grid, type ColDef, type GridOptions, type RowSelectedEvent } from 'ag-grid-community';
  import { createEventDispatcher, onMount } from 'svelte';

  export let columnDefs: ColDef[];
  export let rowData: TRowData[] = [];
  export let rowSelection: 'single' | 'multiple' | undefined = undefined;

  export let suppressRowClickSelection: boolean = false;

  const dispatch = createEventDispatcher();

  let gridOptions: GridOptions;
  let gridDiv: HTMLDivElement;

  $: gridOptions?.api?.setRowData(rowData);
  $: gridOptions?.api?.sizeColumnsToFit();

  onMount(() => {
    gridOptions = {
      // each entry here represents one column
      columnDefs,
      rowData,
      rowSelection,
      suppressRowClickSelection,
      onRowSelected(event: RowSelectedEvent<TRowData>) {
        dispatch('rowSelected', event);
      },
      onRowClicked(event: RowSelectedEvent<TRowData>) {
        dispatch('rowClicked', event);
      },
    };
    new Grid(gridDiv, gridOptions);
  });
</script>

<div bind:this={gridDiv} class="ag-theme-stellar table" />

<style>
  .table {
    width: 100%;
    height: 100%;
  }
</style>
