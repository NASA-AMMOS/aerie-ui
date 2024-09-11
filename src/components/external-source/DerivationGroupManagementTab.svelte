<svelte:options immutable={true} />

<script lang="ts">
  import { derivationGroups, getRowIdDerivationGroup } from '../../stores/external-source';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { DerivationGroup } from '../../types/external-source';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';

  export let dgColumnDefs: DataGridColumnDef<DerivationGroup>[] = [];
  export let filterString: string = '';

  let dgDataGrid: DataGrid<DerivationGroup>;
</script>

<DataGrid
  bind:this={dgDataGrid}
  columnDefs={dgColumnDefs}
  rowData={$derivationGroups.filter(dg => dg.name.includes(filterString))}
  getRowId={getRowIdDerivationGroup}
/>
