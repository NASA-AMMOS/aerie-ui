<svelte:options immutable={true} />

<script lang="ts">
  import type { ValueGetterParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventWithTypeName } from '../../types/external-event';
  import type { ExternalSourceSlim } from '../../types/external-source';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';

  export let selectedItemId: number | null;
  export let items: ExternalEventWithTypeName[];
  export let user: User | null;

  const dispatch = createEventDispatcher<{
    rowDoubleClicked: void
    selectionChanged: void
  }>();

  const baseColumnDefs: DataGridColumnDef[] = [
    {
      field: 'id',
      filter: 'number',
      headerName: 'External Event ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'key',
      filter: 'text',
      headerName: 'Key',
      resizable: true,
      sortable: true,
    },
    {
      field: 'event_type',
      filter: 'text',
      headerName: 'Event Type',
      resizable: true,
      sortable: true,
    },
    {
      field: 'source_id',
      filter: 'number',
      headerName: 'Source ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: 'Start Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.start_time) {
          return new Date(params.data?.start_time).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'duration',
      filter: 'text',
      headerName: 'Duration',
      resizable: true,
      sortable: true,
    }
  ];

  let columnDefs = baseColumnDefs;
</script>
  
<SingleActionDataGrid
  {columnDefs}
  itemDisplayText="External Source"
  {items}
  {user}
  bind:selectedItemId={selectedItemId}
  on:rowDoubleClicked={() => dispatch('rowDoubleClicked')}
  on:selectionChanged={() => dispatch('selectionChanged')}
/>

<style>
</style>
