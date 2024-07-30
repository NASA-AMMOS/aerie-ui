<svelte:options immutable={true} />

<script lang="ts">
  import type { User } from '../../types/app';
  import type { DataGridColumnDef, DataGridRowSelection } from '../../types/data-grid';
  import Input from '../form/Input.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  type Workspace = {
    id: number;
    items: number[];
    name: string;
  };

  export let user: User | null;

  let baseColumnDefs: DataGridColumnDef[];
  let filterText = '';
  let filteredWorkspaces: Workspace[] = [];
  let selectedWorkspace: Workspace | null = null;
  let workspaces: Workspace[] = [];

  $: baseColumnDefs = [
    {
      field: 'id',
      filter: 'text',
      headerName: 'ID',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 60,
    },
    {
      field: 'name',
      filter: 'text',
      headerName: 'Name',
      resizable: true,
      sortable: true,
    },
  ];

  $: filteredWorkspaces = workspaces.filter(workspace => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesName = workspace.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesName;
  });

  function createNewWorkspace(): void {
    workspaces = [...workspaces, { id: workspaces.length, items: [], name: `Workspace ${workspaces.length}` }];
  }

  function resetSelectedWorkspace(): void {
    selectedWorkspace = null;
  }

  function workspaceSelected(event: CustomEvent<DataGridRowSelection<Workspace>>) {
    const { detail } = event;
    const { data: clickedWorkspace, isSelected } = detail;

    if (isSelected) {
      selectedWorkspace = clickedWorkspace;
    }
  }
</script>

<Panel>
  <svelte:fragment slot="header">
    <SectionTitle>Sequence Workspaces</SectionTitle>

    <Input>
      <input bind:value={filterText} class="st-input" placeholder="Filter workspaces" style="width: 100%;" />
    </Input>

    <div class="right">
      <button class="st-button secondary ellipsis" on:click={createNewWorkspace}>Create Workspace</button>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="body">
    <div class="breadcrumbs st-typography-header">
      {#if selectedWorkspace !== null}
        <span class="link" role="none" on:click={resetSelectedWorkspace}>Workspace</span> / {selectedWorkspace.name}
      {:else}
        Workspace
      {/if}
    </div>

    {#if selectedWorkspace === null}
      <SingleActionDataGrid
        columnDefs={baseColumnDefs}
        itemDisplayText="Workspaces"
        items={filteredWorkspaces}
        {user}
        on:rowSelected={workspaceSelected}
      ></SingleActionDataGrid>
    {:else}
      <slot />
    {/if}
  </svelte:fragment>
</Panel>

<style>
  .breadcrumbs {
    padding-bottom: 0.5rem;
  }

  .link {
    color: var(--st-primary-70);
    cursor: pointer;
  }
</style>
