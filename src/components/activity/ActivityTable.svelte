<svelte:options immutable={true} />

<script lang="ts">
  import type { ColDef, Column, ColumnState, RedrawRowsParams } from 'ag-grid-community';
  import type { ISizeColumnsToFitParams } from 'ag-grid-community/dist/lib/gridApi';
  import { activities, selectedActivityId } from '../../stores/activities';
  import effects from '../../utilities/effects';
  import BulkActionDataGrid from '../ui/DataGrid/BulkActionDataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';

  export function autoSizeColumns(keys: (string | Column)[], skipHeader?: boolean) {
    dataGrid?.autoSizeColumns(keys, skipHeader);
  }
  export function autoSizeAllColumns(skipHeader?: boolean) {
    dataGrid?.autoSizeAllColumns(skipHeader);
  }
  // expose ag-grid function to select all visible rows
  export function selectAllVisible() {
    dataGrid?.selectAllFiltered();
  }
  export function redrawRows(params?: RedrawRowsParams<TRowData>) {
    dataGrid?.redrawRows(params);
  }
  export function sizeColumnsToFit(params?: ISizeColumnsToFitParams) {
    dataGrid?.sizeColumnsToFit(params);
  }

  export let columnDefs: ColDef[];
  export let columnStates: ColumnState[] = [];
  export let dataGrid: BulkActionDataGrid = undefined;

  type CellRendererParams = {
    deleteActivityDirective: (activity: Activity) => void;
  };
  type ActivityCellRendererParams = ICellRendererParams<Activity> & CellRendererParams;

  const activityActionColumnDef: DataGridColumnDef = {
    cellClass: 'action-cell-container',
    cellRenderer: (params: ActivityCellRendererParams) => {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions-cell';
      new DataGridActions({
        props: {
          deleteCallback: params.deleteActivityDirective,
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
      deleteActivityDirective,
    } as CellRendererParams,
    field: 'actions',
    headerName: '',
    resizable: false,
    sortable: false,
    suppressAutoSize: true,
    suppressSizeToFit: true,
    width: 25,
  };

  function deleteActivityDirective({ id }: Activity) {
    effects.deleteActivityDirective(id);
  }

  function deleteActivityDirectives({ detail: ids }: CustomEvent<number[]>) {
    effects.deleteActivityDirectives(ids);
  }
</script>

<BulkActionDataGrid
  bind:this={dataGrid}
  columnDefs={[...(columnDefs ?? []), activityActionColumnDef]}
  {columnStates}
  items={$activities}
  pluralItemDisplayText="Activities"
  singleItemDisplayText="Activity"
  suppressDragLeaveHidesColumns={false}
  bind:selectedItemId={$selectedActivityId}
  on:bulkDeleteItems={deleteActivityDirectives}
  on:columnStateChange
/>
