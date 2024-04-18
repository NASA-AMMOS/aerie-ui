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
  import { commandDictionaries, parameterDictionaries, sequenceAdaptations } from '../../stores/sequencing';
  import type { DataGridColumnDef, RowId } from '../../types/data-grid';
  import {
    DictionaryTypes,
    type CommandDictionary,
    type ParameterDictionary,
    type SequenceAdaptation,
  } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { showFailureToast, showSuccessToast } from '../../utilities/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  type cdCellRendererParams = {
    deleteCommandDictionary?: (commandDictionary: CommandDictionary) => void;
  };
  type CommandDictionaryCellRendererParams = ICellRendererParams<CommandDictionary> & cdCellRendererParams;
  type pCellRendererParams = {
    deleteParameterDictionary?: (parameterDictionary: ParameterDictionary) => void;
  };
  type ParameterDictionaryCellRendererParams = ICellRendererParams<ParameterDictionary> & pCellRendererParams;
  type seqCellRendererParams = {
    deleteSequenceAdaptation: (sequenceAdaptation: SequenceAdaptation) => void;
  };
  type SequenceAdaptationCellRendererParams = ICellRendererParams<SequenceAdaptation> & seqCellRendererParams;

  const sharedDictionaryColumnDefs: DataGridColumnDef[] = [
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
    { field: 'created_at', filter: 'text', headerName: 'Created At', resizable: true, sortable: true },
  ];

  const commandDictionaryColumnDefs: DataGridColumnDef[] = [
    ...sharedDictionaryColumnDefs,
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
      } as pCellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
  ];

  const parameterDictionaryColumnDefs: DataGridColumnDef[] = [
    ...sharedDictionaryColumnDefs,
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ParameterDictionaryCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteParameterDictionary,
            deleteTooltip: {
              content: 'Delete Parameter Dictionary',
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
        deleteParameterDictionary,
      } as cdCellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
  ];

  const sequenceColumnDefs: DataGridColumnDef[] = [
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
    { field: 'created_at', filter: 'text', headerName: 'Created At', resizable: true, sortable: true },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: SequenceAdaptationCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteSequenceAdaptation,
            deleteTooltip: {
              content: 'Delete Sequence Adaptation',
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
        deleteSequenceAdaptation,
      } as seqCellRendererParams,
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

  async function uploadDictionaryOrAdaptation(files: FileList) {
    createDictionaryError = null;
    creatingDictionary = true;

    try {
      const uploadedDictionaryOrAdaptation = await effects.uploadDictionaryOrAdaptation(files, data.user);

      if (uploadedDictionaryOrAdaptation !== null) {
        let seenSet: Set<number> = new Set<number>();

        switch (uploadedDictionaryOrAdaptation.type) {
          case DictionaryTypes.command_dictionary: {
            commandDictionaries.updateValue((commandDictionaries: CommandDictionary[]) =>
              [uploadedDictionaryOrAdaptation.uploadedObject, ...commandDictionaries].filter(val => {
                if (!seenSet.has(val.id)) {
                  seenSet.add(val.id);
                  return true;
                } else {
                  return false;
                }
              }),
            );

            showSuccessToast('Command Dictionary Created Successfully');
            break;
          }
          case DictionaryTypes.param_def:
            parameterDictionaries.updateValue((parameterDictionaries: ParameterDictionary[]) =>
              [uploadedDictionaryOrAdaptation.uploadedObject, ...parameterDictionaries].filter(val => {
                if (!seenSet.has(val.id)) {
                  seenSet.add(val.id);
                  return true;
                } else {
                  return false;
                }
              }),
            );

            showSuccessToast('Parameter Dictionary Created Successfully');
            break;
          case DictionaryTypes.telemetry_dictionary:
            break;
          case DictionaryTypes.sequence_adaptation: {
            showSuccessToast('Sequence Adaptation Created Successfully');

            break;
          }
        }
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

  function deleteParameterDictionary({ id }: Pick<ParameterDictionary, 'id'>) {
    effects.deleteParameterDictionary(id, data.user);
  }

  function deleteParameterDictionaryContext(event: CustomEvent<RowId[]>) {
    deleteParameterDictionary({ id: event.detail[0] as number });
  }

  function deleteSequenceAdaptation({ id }: Pick<SequenceAdaptation, 'id'>) {
    effects.deleteSequenceAdaptation(id, data.user);
  }

  function deleteSequenceAdaptationContext(event: CustomEvent<RowId[]>) {
    deleteSequenceAdaptation({ id: event.detail[0] as number });
  }
</script>

<PageTitle title="Dictionaries" />

<CssGrid rows="var(--nav-header-height) calc(100vh - var(--nav-header-height))">
  <Nav user={data.user}>
    <span slot="title">Dictionaries</span>
  </Nav>

  <CssGrid columns="20% auto">
    <Panel borderRight padBody={false}>
      <svelte:fragment slot="header">
        <SectionTitle>New Dictionary</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <form on:submit|preventDefault={() => uploadDictionaryOrAdaptation(files)}>
          <AlertError class="m-2" error={createDictionaryError} />

          <fieldset>
            <label for="file">AMPCS XML File or Sequence Adaptation</label>
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

    <div class="table-container">
      <Panel>
        <svelte:fragment slot="header">
          <SectionTitle>Command Dictionaries</SectionTitle>
        </svelte:fragment>

        <svelte:fragment slot="body">
          {#if $commandDictionaries.length}
            <SingleActionDataGrid
              columnDefs={commandDictionaryColumnDefs}
              {hasDeletePermission}
              itemDisplayText="Command Dictionaries"
              items={$commandDictionaries}
              user={data.user}
              on:deleteItem={deleteCommandDictionaryContext}
            />
          {:else}
            No Command Dictionaries Found
          {/if}
        </svelte:fragment>
      </Panel>

      <Panel>
        <svelte:fragment slot="header">
          <SectionTitle>Parameter Dictionaries</SectionTitle>
        </svelte:fragment>

        <svelte:fragment slot="body">
          {#if $parameterDictionaries.length}
            <SingleActionDataGrid
              columnDefs={parameterDictionaryColumnDefs}
              {hasDeletePermission}
              itemDisplayText="Parameter Dictionaries"
              items={$parameterDictionaries}
              user={data.user}
              on:deleteItem={deleteParameterDictionaryContext}
            />
          {:else}
            No Parameter Dictionaries Found
          {/if}
        </svelte:fragment>
      </Panel>

      <Panel>
        <svelte:fragment slot="header">
          <SectionTitle>Sequence Adaptations</SectionTitle>
        </svelte:fragment>

        <svelte:fragment slot="body">
          {#if $sequenceAdaptations.length}
            <SingleActionDataGrid
              columnDefs={sequenceColumnDefs}
              {hasDeletePermission}
              itemDisplayText="Sequence Adaptations"
              items={$sequenceAdaptations}
              user={data.user}
              on:deleteItem={deleteSequenceAdaptationContext}
            />
          {:else}
            No Sequence Adaptations Found
          {/if}
        </svelte:fragment>
      </Panel>
    </div>
  </CssGrid>
</CssGrid>

<style>
  .table-container {
    display: grid;
  }
</style>
