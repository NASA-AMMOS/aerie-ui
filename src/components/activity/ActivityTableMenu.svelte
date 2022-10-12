<svelte:options immutable={true} />

<script lang="ts">
  import type { ColDef, ColumnState } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import Menu from '../menus/Menu.svelte';
  import MenuItem from '../menus/MenuItem.svelte';

  export let columnDefs: ColDef[] = [];
  export let columnStates: ColumnState[] = [];

  interface ColumnMenuItem {
    field: keyof Activity;
    isHidden: boolean;
    name: string;
  }

  const dispatch = createEventDispatcher();

  let columnMenuItems: ColumnMenuItem[] = [];
  let tableMenu: Menu;

  $: columnMenuItems = columnDefs.map((derivedColumnDef: ColDef) => {
    const columnState = columnStates.find((columnState: ColumnState) => columnState.colId === derivedColumnDef.field);

    if (columnState) {
      return {
        field: derivedColumnDef.field as keyof Activity,
        isHidden: columnState?.hide ?? derivedColumnDef.hide ?? false,
        name: derivedColumnDef.headerName,
      };
    }

    return {
      field: derivedColumnDef.field as keyof Activity,
      isHidden: true,
      name: derivedColumnDef.headerName,
    };
  });

  function onColumnToggleChange(column: ColumnMenuItem) {
    dispatch('toggle-column', {
      field: column.field,
      isHidden: !column.isHidden,
    });
  }
</script>

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

<style>
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
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 1;
  }
</style>
