<svelte:options immutable={true} />

<script lang="ts">
  import type { ColDef, ColumnState } from 'ag-grid-community';
  import { view, viewUpdateActivityTables } from '../../stores/views';
  import GridMenu from '../menus/GridMenu.svelte';
  import Menu from '../menus/Menu.svelte';
  import MenuItem from '../menus/MenuItem.svelte';
  import Panel from '../ui/Panel.svelte';
  import ActivityTable from './ActivityTable.svelte';

  export let activityTableId: number;
  export let gridId: number;

  interface ColumnMenuItem {
    field: keyof Activity;
    isHidden: boolean;
    name: string;
  }

  const defaultColumnDefinitions: Partial<Record<keyof Activity, ColDef<Activity>>> = {
    arguments: {
      field: 'arguments',
      filter: 'text',
      headerName: 'Arguments',
      hide: true,
      resizable: true,
      sortable: false,
      valueFormatter: (argumentsMap: ArgumentsMap) => {
        return JSON.stringify(argumentsMap);
      },
    },
    created_at: {
      field: 'created_at',
      filter: 'text',
      headerName: 'Created At',
      hide: true,
      resizable: true,
      sortable: true,
    },
    duration: {
      field: 'duration',
      filter: 'text',
      headerName: 'Duration',
      hide: true,
      resizable: true,
      sortable: true,
    },
    id: {
      field: 'id',
      filter: 'text',
      headerName: 'ID',
      hide: true,
      resizable: true,
      sortable: true,
    },
    last_modified_at: {
      field: 'last_modified_at',
      filter: 'text',
      headerName: 'Last Modified At',
      hide: true,
      resizable: true,
      sortable: true,
    },
    metadata: {
      field: 'metadata',
      filter: 'text',
      headerName: 'Metadata',
      hide: true,
      resizable: true,
      sortable: false,
    },
    name: {
      field: 'name',
      filter: 'text',
      headerName: 'Name',
      hide: true,
      resizable: true,
      sortable: true,
    },
    source_scheduling_goal_id: {
      field: 'source_scheduling_goal_id',
      filter: 'number',
      headerName: 'Scheduling Goal ID',
      hide: true,
      resizable: true,
      sortable: true,
    },
    start_time: {
      field: 'start_time',
      filter: 'text',
      headerName: 'Start Time',
      hide: true,
      resizable: true,
      sortable: true,
    },
    tags: {
      field: 'tags',
      filter: 'text',
      headerName: 'Tags',
      hide: true,
      resizable: true,
      sortable: true,
    }, //string[];
    type: {
      field: 'type',
      filter: 'text',
      headerName: 'Type',
      hide: true,
      resizable: true,
      sortable: true,
    },
  };
  let activityTable: ViewActivityTable;
  let derivedColumnDefs: ColDef[] = [];
  let columnMenuItems: ColumnMenuItem[] = [];
  let tableMenu: Menu;

  $: activityTable = $view?.definition.plan.activityTables.find(table => table.id === activityTableId);
  $: derivedColumnDefs = Object.values(defaultColumnDefinitions).map((defaultColumnDef: ColDef) => {
    const columnDef = activityTable.columnDefs.find((columnDef: ColDef) => columnDef.field === defaultColumnDef.field);
    if (columnDef) {
      return {
        ...defaultColumnDef,
        ...columnDef,
        hide: columnDef.hide ?? false,
      };
    }

    return defaultColumnDef;
  });
  $: columnMenuItems = Object.values(defaultColumnDefinitions).map((defaultColumnDef: ColDef) => {
    const columnDef = activityTable.columnDefs.find((columnDef: ColDef) => columnDef.field === defaultColumnDef.field);
    const columnState = activityTable.columnStates.find(
      (columnState: ColumnState) => columnState.colId === defaultColumnDef.field,
    );

    if (columnDef || columnState) {
      return {
        field: defaultColumnDef.field as keyof Activity,
        isHidden: columnState?.hide ?? columnDef.hide ?? false,
        name: defaultColumnDef.headerName,
      };
    }

    return {
      field: defaultColumnDef.field as keyof Activity,
      isHidden: true,
      name: defaultColumnDef.headerName,
    };
  });

  function onColumnToggleChange(column: ColumnMenuItem) {
    const activityColumnStates: ColumnState[] = activityTable?.columnStates ?? [];
    const existingColumnStateIndex: number = activityColumnStates.findIndex(
      (columnState: ColumnState) => column.field === columnState.colId,
    );
    if (existingColumnStateIndex >= 0) {
      viewUpdateActivityTables(
        {
          columnStates: [
            ...activityColumnStates.slice(0, existingColumnStateIndex),
            {
              ...activityColumnStates[existingColumnStateIndex],
              hide: !column.isHidden,
            },
            ...activityColumnStates.slice(existingColumnStateIndex + 1),
          ],
        },
        activityTableId,
      );
    } else {
      viewUpdateActivityTables(
        {
          columnStates: [
            ...activityColumnStates,
            {
              colId: column.field,
              hide: !column.isHidden,
            },
          ],
        },
        activityTableId,
      );
    }
  }

  function onColumnStateChange({ detail: columnStates }: CustomEvent<ColumnState[]>) {
    const updatedColumnStates = columnStates.filter(columnState => columnState.colId !== 'actions');

    viewUpdateActivityTables({ columnStates: updatedColumnStates }, activityTableId);
  }
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridId} title="Activity Table" />
    <div class="activity-table-container">
      <div class="grid-menu st-typography-medium" on:click|stopPropagation={() => tableMenu.toggle()}>
        <div class="title">Table Menu</div>
        <Menu bind:this={tableMenu} hideAfterClick={false}>
          {#each columnMenuItems as columnMenuItem (columnMenuItem)}
            <MenuItem on:click={() => onColumnToggleChange(columnMenuItem)}>
              <input type="checkbox" checked={!columnMenuItem.isHidden} />
              <div>{columnMenuItem.name}</div>
            </MenuItem>
          {/each}
        </Menu>
      </div>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="body">
    <ActivityTable
      columnDefs={derivedColumnDefs ?? []}
      columnStates={activityTable?.columnStates}
      on:columnStateChange={onColumnStateChange}
    />
  </svelte:fragment>
</Panel>

<style>
  .activity-table-container {
    height: 100%;
    position: relative;
  }

  .grid-menu {
    align-items: center;
    border: 1px solid var(--st-gray-30);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    font-size: 13px;
    gap: 5px;
    height: 24px;
    justify-content: center;
    padding: 4px 8px;
    position: relative;
    user-select: none;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
