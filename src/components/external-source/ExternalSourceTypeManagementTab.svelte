<svelte:options immutable={true} />

<script lang="ts">
  import { externalSourceTypes, getRowIdExternalSourceType } from '../../stores/external-source';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalSourceType } from '../../types/external-source';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';

  export let estColumnDefs: DataGridColumnDef<ExternalSourceType>[] = [];
  export let filterString: string = '';

  let estDataGrid: DataGrid<ExternalSourceType>;
</script>

<DataGrid
  bind:this={estDataGrid}
  columnDefs={estColumnDefs}
  rowData={$externalSourceTypes.filter(est => est.name.includes(filterString))}
  getRowId={getRowIdExternalSourceType}
/>
