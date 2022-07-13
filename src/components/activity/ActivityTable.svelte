<svelte:options immutable={true} />

<script lang="ts">
  import { activities, selectedActivityId } from '../../stores/activities';
  import { view } from '../../stores/views';
  import DataGrid from '../ui/DataGrid.svelte';

  export let activityTableId: number;

  let activityTable: ViewActivityTable;

  $: activityTable = $view?.definition.plan.activityTables.find(table => table.id === activityTableId);
</script>

<DataGrid
  columnDefs={Object.keys(activityTable?.columnDefs).map(columnKey => {
    const columnDef = activityTable?.columnDefs[columnKey];
    return {
      field: columnDef.field,
      headerName: columnDef.name,
      sortable: columnDef.sortable,
    };
  })}
  rowData={$activities}
  on:rowClick={({ detail }) => ($selectedActivityId = detail.id)}
/>
