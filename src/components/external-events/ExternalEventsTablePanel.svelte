<svelte:options immutable={true} />

<script lang="ts">
  import type { ValueGetterParams } from 'ag-grid-community';
  import { externalEventWithTypeName, selectExternalEvent, selectedExternalEventId } from '../../stores/external-event';
  import { viewTogglePanel } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalSourceSlim } from '../../types/external-source';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

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
    },
    // { // TODO: figure out a dropdown or something for this....
    //   field: 'properties',
    //   filter: 'record',
    //   headerName: 'Properties',
    //   resizable: true,
    //   sortable: true,
    // },
  ];

  let columnDefs = baseColumnDefs;

  function onRowDoubleClicked() {
    viewTogglePanel({ state: true, type: 'right', update: { rightComponentTop: 'ExternalEventFormPanel' } });
  }

  function onSelectionChanged() {
    selectExternalEvent($selectedExternalEventId);
  }
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Events Table" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <SingleActionDataGrid
      {columnDefs}
      itemDisplayText="External Source"
      items={$externalEventWithTypeName}
      {user}
      bind:selectedItemId={$selectedExternalEventId}
      on:rowDoubleClicked={onRowDoubleClicked}
      on:selectionChanged={onSelectionChanged}
    />
  </svelte:fragment>
</Panel>

<style>
</style>
