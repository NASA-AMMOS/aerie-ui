<svelte:options immutable={true} />

<script lang="ts">
  import type { ColDef, ColumnState } from 'ag-grid-community';
  import type { RowId } from '../../types/data-grid';
  import type { MySimulationEvent } from '../../types/simulation';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';

  export let columnDefs: ColDef[];
  export let columnStates: ColumnState[] = [];
  export let dataGrid: DataGrid<MySimulationEvent> | undefined = undefined;
  export let selectedSimulationEventId: number | null = null;
  export let spans: Span[] = [];
  export let simulationEvents: MySimulationEvent[] = [];
  export let filterExpression: string = '';

  let selectedItemIds: RowId[] = [];

  $: if (selectedSimulationEventId != null && !selectedItemIds.includes(selectedSimulationEventId)) {
    selectedItemIds = [selectedSimulationEventId];
  } else if (selectedSimulationEventId === null) {
    selectedItemIds = [];
  }

  function getRowId(simulationEvent: MySimulationEvent): number {
    return simulationEvent.id;
  }
</script>

<DataGrid
  bind:this={dataGrid}
  bind:currentSelectedRowId={selectedSimulationEventId}
  bind:selectedRowIds={selectedItemIds}
  autoSizeColumnsToFit={false}
  columnDefs={[...(columnDefs ?? [])]}
  {filterExpression}
  {getRowId}
  useCustomContextMenu
  rowData={simulationEvents}
  rowSelection="single"
  scrollToSelection={true}
  suppressDragLeaveHidesColumns={false}
  on:columnMoved
  on:columnPinned
  on:columnResized
  on:columnVisible
  on:gridSizeChanged
  on:rowDoubleClicked
  on:selectionChanged
/>
