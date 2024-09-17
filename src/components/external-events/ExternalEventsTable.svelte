<svelte:options immutable={true} />

<script lang="ts">
  import type { ValueGetterParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import { plugins } from '../../stores/plugins';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventDB, ExternalEventId } from '../../types/external-event';
  import type { ExternalSourceSlim } from '../../types/external-source';
  import { getRowIdExternalEventWhole } from '../../utilities/externalEvents';
  import { formatDate } from '../../utilities/time';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';

  export let selectedItemId: ExternalEventId | null;
  export let items: ExternalEventDB[];
  export let user: User | null;

  const dispatch = createEventDispatcher<{
    rowDoubleClicked: void;
    selectionChanged: void;
  }>();

  const baseColumnDefs: DataGridColumnDef[] = [
    {
      field: 'pkey',
      filter: 'text',
      headerName: 'Key',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalEventDB>) => {
        if (params.data?.pkey) {
          return params.data.pkey.key;
        }
      },
    },
    {
      field: 'event_type_name',
      filter: 'text',
      headerName: 'Event Type',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalEventDB>) => {
        if (params.data?.pkey) {
          return params.data.pkey.event_type_name;
        }
      },
    },
    {
      field: 'pkey',
      filter: 'number',
      headerName: 'Source Key',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalEventDB>) => {
        if (params.data?.pkey) {
          return params.data.pkey.source_key;
        }
      },
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: `Start Time (${$plugins.time.primary.label})`,
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.start_time) {
          return formatDate(new Date(params.data?.start_time), $plugins.time.primary.format);
        }
      },
    },
    {
      field: 'duration',
      filter: 'text',
      headerName: 'Duration',
      resizable: true,
      sortable: true,
    },
  ];

  let columnDefs = baseColumnDefs;
</script>

<SingleActionDataGrid
  {columnDefs}
  itemDisplayText="External Events"
  {items}
  {user}
  getRowId={getRowIdExternalEventWhole}
  bind:selectedItemId
  on:rowDoubleClicked={() => dispatch('rowDoubleClicked')}
  on:selectionChanged={() => dispatch('selectionChanged')}
/>
