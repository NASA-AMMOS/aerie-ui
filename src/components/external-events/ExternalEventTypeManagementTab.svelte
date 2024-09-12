<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventTypes, getRowIdExternalEventType } from '../../stores/external-event';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventType } from '../../types/external-event';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';

  export let externalEventTypeColumnDefs: DataGridColumnDef<ExternalEventType>[] = [];
  export let filterString: string = '';

  let externalEventTypeDataGrid: DataGrid<ExternalEventType>;
</script>

<DataGrid
  bind:this={externalEventTypeDataGrid}
  columnDefs={externalEventTypeColumnDefs}
  rowData={$externalEventTypes.filter(eet => eet.name.includes(filterString))}
  getRowId={getRowIdExternalEventType}
/>
