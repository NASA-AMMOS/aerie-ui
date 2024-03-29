<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import Nav from '../../components/app/Nav.svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import AlertError from '../../components/ui/AlertError.svelte';
  import CssGrid from '../../components/ui/CssGrid.svelte';
  import DataGridActions from '../../components/ui/DataGrid/DataGridActions.svelte';
  import SingleActionDataGrid from '../../components/ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../../components/ui/Panel.svelte';
  import SectionTitle from '../../components/ui/SectionTitle.svelte';
  import { commandDictionaries } from '../../stores/sequencing';
  import type { DataGridColumnDef, RowId } from '../../types/data-grid';
  import type { CommandDictionary } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { showFailureToast, showSuccessToast } from '../../utilities/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  type CellRendererParams = {
    deleteCommandDictionary: (dictionary: CommandDictionary) => void;
  };
  type CommandDictionaryCellRendererParams = ICellRendererParams<CommandDictionary> & CellRendererParams;

  const columnDefs: DataGridColumnDef[] = [
    {
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 60,
    },
    { field: 'mission', filter: 'text', headerName: 'Mission', sortable: true, width: 100 },
    { field: 'version', filter: 'text', headerName: 'Version', sortable: true, suppressAutoSize: true, width: 100 },
    {
      field: 'command_types_typescript_path',
      filter: 'text',
      headerName: 'Types Path',
      resizable: true,
      sortable: true,
      width: 220,
    },
    { field: 'created_at', filter: 'text', headerName: 'Created At', resizable: true, sortable: true },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: CommandDictionaryCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteCommandDictionary,
            deleteTooltip: {
              content: 'Delete Command Dictionary',
              placement: 'bottom',
            },
            hasDeletePermission,
            rowData: params.data,
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        deleteCommandDictionary,
      } as CellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
  ];

  const createPermissionError = 'You do not have permission to create Command Dictionaries';

  let createButtonDisabled: boolean = false;
  let createDictionaryError: string | null = null;
  let creatingDictionary: boolean = false;
  let files: FileList;

  $: hasCreatePermission = featurePermissions.commandDictionary.canCreate(data.user);
  $: hasDeletePermission = featurePermissions.commandDictionary.canDelete(data.user);
  $: createButtonDisabled = !files;

  async function createCommandDictionary(files: FileList) {
    createDictionaryError = null;
    creatingDictionary = true;

    try {
      const newCommandDictionary = await effects.createCommandDictionary(files, data.user);
      if (newCommandDictionary !== null) {
        const seenSet = new Set<number>();
        commandDictionaries.updateValue((dictionaries: CommandDictionary[]) =>
          [newCommandDictionary, ...dictionaries].filter(val => {
            if (!seenSet.has(val.id)) {
              seenSet.add(val.id);
              return true;
            } else {
              return false;
            }
          }),
        );
        showSuccessToast('Command Dictionary Created Successfully');
      }
    } catch (e) {
      createDictionaryError = (e as Error).message;
      showFailureToast('Command Dictionary Create Failed');
    }

    creatingDictionary = false;
  }

  function deleteCommandDictionary({ id }: Pick<CommandDictionary, 'id'>) {
    effects.deleteCommandDictionary(id, data.user);
  }

  function deleteCommandDictionaryContext(event: CustomEvent<RowId[]>) {
    deleteCommandDictionary({ id: event.detail[0] as number });
  }
</script>

<PageTitle title="Command Dictionaries" />

<CssGrid rows="var(--nav-header-height) calc(100vh - var(--nav-header-height))">
  <Nav user={data.user}>
    <span slot="title">Command Dictionaries</span>
  </Nav>

  <CssGrid columns="20% auto">
    <Panel borderRight padBody={false}>
      <svelte:fragment slot="header">
        <SectionTitle>New Command Dictionary</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <form on:submit|preventDefault={() => createCommandDictionary(files)}>
          <AlertError class="m-2" error={createDictionaryError} />

          <fieldset>
            <label for="file">AMPCS Command Dictionary XML File</label>
            <input
              class="w-100 st-typography-body"
              name="file"
              required
              type="file"
              bind:files
              use:permissionHandler={{
                hasPermission: hasCreatePermission,
                permissionError: createPermissionError,
              }}
            />
          </fieldset>

          <fieldset>
            <button
              class="st-button w-100"
              disabled={createButtonDisabled}
              type="submit"
              use:permissionHandler={{
                hasPermission: hasCreatePermission,
                permissionError: createPermissionError,
              }}
            >
              {creatingDictionary ? 'Creating...' : 'Create'}
            </button>
          </fieldset>
        </form>
      </svelte:fragment>
    </Panel>

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Command Dictionaries</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if $commandDictionaries.length}
          <SingleActionDataGrid
            {columnDefs}
            {hasDeletePermission}
            itemDisplayText="Command Dictionary"
            items={$commandDictionaries}
            user={data.user}
            on:deleteItem={deleteCommandDictionaryContext}
          />
        {:else}
          No Command Dictionaries Found
        {/if}
      </svelte:fragment>
    </Panel>
  </CssGrid>
</CssGrid>
