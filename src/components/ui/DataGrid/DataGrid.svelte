<svelte:options immutable={true} />

<script lang="ts">
  import {
    Grid,
    RowNode,
    type CellContextMenuEvent,
    type CellMouseOverEvent,
    type ColDef,
    type GridOptions,
    type RowClickedEvent,
    type RowSelectedEvent,
  } from 'ag-grid-community';
  import { createEventDispatcher, onMount } from 'svelte';

  export let columnDefs: ColDef[];
  export let highlightOnSelection: boolean = true;
  export let rowData: TRowData[] = [];
  export let rowSelection: 'single' | 'multiple' | undefined = undefined;
  export let selectedRowIds: number[] = [];
  export let suppressCellFocus: boolean = true;
  export let suppressRowClickSelection: boolean = false;
  export let preventDefaultOnContextMenu: boolean | undefined = undefined;

  const dispatch = createEventDispatcher();

  let gridOptions: GridOptions;
  let gridDiv: HTMLDivElement;
  let debounceTimer: NodeJS.Timeout | null;

  $: gridOptions?.api?.setRowData(rowData);
  $: gridOptions?.api?.sizeColumnsToFit();

  $: {
    const currentSelectedRowIds: number[] =
      gridOptions?.api?.getSelectedNodes().map(node => parseInt(getRowId(node))) || [];

    const currentSelectedRowIdsSet: Set<number> = new Set(currentSelectedRowIds);
    const selectedRowIdsSet: Set<number> = new Set(selectedRowIds);

    /**
     *  remove the rows that are present in both because those are the rows that haven't changed
     *  deleting the shared ids from the `currentSelectedRowIdsSet` will yield ids that need to be deselected
     *  deleting the shared ids from the `selectedRowIdsSet` will yield the new ids that need to be selected
     */
    for (let i = currentSelectedRowIds.length; i >= 0; --i) {
      const currentId = currentSelectedRowIds[i];
      if (selectedRowIdsSet.has(currentId)) {
        currentSelectedRowIdsSet.delete(currentId);
        selectedRowIdsSet.delete(currentId);
      }
    }

    currentSelectedRowIdsSet.forEach(deselectedRowId => {
      const selectedRow = gridOptions?.api?.getRowNode(`${deselectedRowId}`);
      selectedRow?.setSelected(false);
    });
    selectedRowIds.forEach(selectedRowId => {
      const selectedRow = gridOptions?.api?.getRowNode(`${selectedRowId}`);
      selectedRow?.setSelected(true);
    });
  }

  // throw `rowsSelected` immediately once and ignore any others within a certain cooldown period
  function debouncedRowsSelected(selectedNodes: RowNode<TRowData>[]) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    } else {
      dispatch(
        'rowsSelected',
        selectedNodes.map(rowNode => rowNode.data),
      );
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
    }, 10);
  }

  function getRowId(params: { data: TRowData }) {
    return `${params.data.id}`;
  }

  onMount(() => {
    gridOptions = {
      // each entry here represents one column
      columnDefs,
      getRowId,
      onCellContextMenu(event: CellContextMenuEvent<TRowData>) {
        dispatch('cellContextMenu', event);
      },
      onCellMouseOver(event: CellMouseOverEvent<TRowData>) {
        dispatch('cellMouseOver', event);
      },
      onRowClicked(event: RowClickedEvent<TRowData>) {
        dispatch('rowClicked', event);
      },
      onRowSelected(event: RowSelectedEvent<TRowData>) {
        const selectedNodes = gridOptions?.api?.getSelectedNodes();
        // because `onRowSelected` gets thrown for every row selected/unselected,
        // `debouncedRowsSelected` is debounced to only throw once since it's redundant to broadcast all
        // the selected rows every time
        debouncedRowsSelected(selectedNodes);

        // only dispatch `rowSelected` for single row selections
        if (selectedNodes.length <= 1) {
          dispatch('rowSelected', {
            data: event.data,
            isSelected: event.node.isSelected(),
          } as DataGridRowSelection<TRowData>);
        }
      },
      preventDefaultOnContextMenu,
      rowData,
      rowSelection,
      suppressCellFocus,
      suppressRowClickSelection,
    };
    new Grid(gridDiv, gridOptions);
  });
</script>

<div
  bind:this={gridDiv}
  class="ag-theme-stellar table"
  class:ag-selectable-rows={rowSelection !== undefined}
  class:highlightOnSelection
/>

<style>
  .table {
    height: 100%;
    width: 100%;
  }
</style>
