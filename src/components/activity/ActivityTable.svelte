<svelte:options immutable={true} />

<script lang="ts">
  import effects from '../../utilities/effects';

  import { activities, selectedActivityId } from '../../stores/activities';
  import { view } from '../../stores/views';
  import ContextMenu from '../context-menu/ContextMenu.svelte';
  import ContextMenuHeader from '../context-menu/ContextMenuHeader.svelte';
  import ContextMenuItem from '../context-menu/ContextMenuItem.svelte';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';

  export let activityTableId: number;

  type CellRendererParams = {
    deleteActivity: (activity: Activity) => void;
  };
  type ActivityCellRendererParams = ICellRendererParams & CellRendererParams;

  const activityActionColumnDef: DataGridColumnDef = {
    cellClass: 'action-cell-container',
    cellRenderer: (params: ActivityCellRendererParams) => {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions-cell';
      new DataGridActions({
        props: {
          deleteCallback: params.deleteActivity,
          deleteTooltip: {
            content: 'Delete Activity',
            placement: 'bottom',
          },
          rowData: params.data,
        },
        target: actionsDiv,
      });

      return actionsDiv;
    },
    cellRendererParams: {
      deleteActivity,
    } as CellRendererParams,
    field: 'actions',
    headerName: '',
    resizable: false,
    sortable: false,
    suppressAutoSize: true,
    suppressSizeToFit: true,
    width: 55,
  };

  let activityTable: ViewActivityTable;
  let contextMenu: ContextMenu;
  let previousSelectedActivityId: number | null = null;
  let selectedActivityIds: number[] = [];

  $: activityTable = $view?.definition.plan.activityTables.find(table => table.id === activityTableId);
  $: {
    if (previousSelectedActivityId !== $selectedActivityId) {
      selectedActivityIds = [$selectedActivityId];
    }
    previousSelectedActivityId = $selectedActivityId;
  }

  async function deleteActivity({ id }: Activity) {
    const success = await effects.deleteActivity(id);

    if (success) {
      selectedActivityIds = selectedActivityIds.filter(selectedId => selectedId !== id);
    }
  }

  async function deleteActivities() {
    const success = await effects.deleteActivities(selectedActivityIds);

    if (success) {
      selectedActivityIds = [];
    }
  }

  function onCellContextMenu(event: CustomEvent) {
    const { detail } = event;
    const { data: clickedRow } = detail;
    if (selectedActivityIds.length <= 1) {
      $selectedActivityId = clickedRow.id;
    }

    contextMenu.show(detail.event);
  }

  function onRowSelected(event: CustomEvent<DataGridRowSelection<Activity>>) {
    const {
      detail: {
        data: { id },
        isSelected,
      },
    } = event;

    if (isSelected) {
      $selectedActivityId = id;
    } else if ($selectedActivityId === id) {
      $selectedActivityId = null;
    }
  }

  function onSelectionChanged({ detail: selectedRows }: CustomEvent<DataGridRowsSelection<Activity>>) {
    selectedActivityIds = selectedRows.map(selectedRow => selectedRow.id);

    if (selectedActivityIds.length === 1) {
      $selectedActivityId = selectedActivityIds[0];
    }
  }

  function selectAllActivities() {
    selectedActivityIds = $activities.map(({ id }: Activity) => id);
  }
</script>

<DataGrid
  columnDefs={[
    ...Object.keys(activityTable?.columnDefs).map(columnKey => {
      const columnDef = activityTable?.columnDefs[columnKey];
      return {
        field: columnDef.field,
        filter: 'agTextColumnFilter',
        headerName: columnDef.name,
        resizable: true,
        sortable: columnDef.sortable,
      };
    }),
    activityActionColumnDef,
  ]}
  rowSelection="multiple"
  rowData={$activities}
  selectedRowIds={selectedActivityIds}
  preventDefaultOnContextMenu
  on:rowSelected={onRowSelected}
  on:selectionChanged={onSelectionChanged}
  on:cellContextMenu={onCellContextMenu}
/>
<ContextMenu bind:this={contextMenu}>
  <ContextMenuHeader>Bulk Actions</ContextMenuHeader>
  <ContextMenuItem on:click={selectAllActivities}>Select All Activities</ContextMenuItem>
  <ContextMenuItem on:click={deleteActivities}
    >Delete {selectedActivityIds.length} Activit{selectedActivityIds.length > 1 ? 'ies' : 'y'}</ContextMenuItem
  >
</ContextMenu>
