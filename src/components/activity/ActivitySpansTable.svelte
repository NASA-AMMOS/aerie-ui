<svelte:options immutable={true} />

<script lang="ts">
  import type { ColDef, ColumnState } from 'ag-grid-community';
  import type { RowId } from '../../types/data-grid';
  import type { Span, SpanId } from '../../types/simulation';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';

  export let columnDefs: ColDef[];
  export let columnStates: ColumnState[] = [];
  export let dataGrid: DataGrid = undefined;
  export let selectedSpanId: SpanId | null = null;
  export let spans: Span[] = [];

  let selectedItemIds: RowId[] = [];

  function getRowId(span: Span): SpanId {
    return span.id;
  }
</script>

<DataGrid
  bind:this={dataGrid}
  bind:currentSelectedRowId={selectedSpanId}
  bind:selectedRowIds={selectedItemIds}
  columnDefs={[...(columnDefs ?? [])]}
  {columnStates}
  {getRowId}
  preventDefaultOnContextMenu
  rowData={spans}
  rowSelection="single"
  scrollToSelection={true}
  suppressDragLeaveHidesColumns={false}
  on:columnStateChange
  on:selectionChanged
/>
