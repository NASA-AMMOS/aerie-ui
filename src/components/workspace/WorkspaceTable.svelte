<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { workspaces } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef, DataGridRowSelection } from '../../types/data-grid';
  import type { Workspace, WorkspaceInsertInput } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import Input from '../form/Input.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  export let selectedWorkspaceId: number | null;
  export let user: User | null;

  let baseColumnDefs: DataGridColumnDef[];
  let filterText = '';
  let filteredWorkspaces: Workspace[] = [];
  let selectedWorkspace: Workspace | null = null;

  const dispatch = createEventDispatcher<{
    workspaceSelected: number;
  }>();

  $: baseColumnDefs = [
    {
      field: 'id',
      filter: 'text',
      headerName: 'ID',
      resizable: true,
      sort: 'asc',
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
    {
      field: 'owner',
      filter: 'string',
      headerName: 'Owner',
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 100,
    },
  ];

  $: filteredWorkspaces = $workspaces.filter(workspace => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesName = workspace.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesName;
  });

  async function createNewWorkspace(): Promise<void> {
    const workspace: WorkspaceInsertInput = {
      name: `Workspace ${$workspaces.length}`,
    };

    await effects.createWorkspace(workspace, user);
  }

  function workspaceSelected(event: CustomEvent<DataGridRowSelection<Workspace>>) {
    const { detail } = event;
    const { data: clickedWorkspace, isSelected } = detail;

    if (isSelected) {
      selectedWorkspace = clickedWorkspace;
      dispatch('workspaceSelected', selectedWorkspace.id);
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
    {#if filteredWorkspaces.length}
      <SingleActionDataGrid
        columnDefs={baseColumnDefs}
        itemDisplayText="Workspaces"
        items={filteredWorkspaces}
        selectedItemId={selectedWorkspaceId}
        {user}
        on:rowSelected={workspaceSelected}
      ></SingleActionDataGrid>
    {:else}
      <div class="p1 st-typography-label">No Workspaces Found</div>
    {/if}
  </svelte:fragment>
</Panel>
