<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { CellEditingStoppedEvent, ValueGetterParams } from 'ag-grid-community';
  import {
    commandDictionaries,
    parameterDictionaries,
    parcel,
    parcelToParameterDictionaries,
    sequenceAdaptations,
  } from '../../stores/sequencing';
  import type { User, UserId } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type {
    CommandDictionary,
    ParameterDictionary,
    Parcel,
    ParcelInsertInput,
    ParcelToParameterDictionary,
    SequenceAdaptation,
  } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import PageTitle from '../app/PageTitle.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  export let initialParcelCommandDictionaryId: number | null = null;
  export let initialParcelCreatedAt: string | null = null;
  export let initialParcelName: string = '';
  export let initialParcelId: number | null = null;
  export let initialParcelOwner: UserId = '';
  export let initialSequenceAdaptationId: number | null = null;
  export let mode: 'create' | 'edit' = 'create';
  export let user: User | null;

  let commandDictionaryColumnDefs: DataGridColumnDef[];
  let commandDictionaryDataGrid: DataGrid<CommandDictionary> | undefined = undefined;
  let hasPermission: boolean = false;
  let pageSubtitle: string = '';
  let pageTitle: string = '';
  let parameterDictionaryColumnDefs: DataGridColumnDef[];
  let parameterDictionaryDataGrid: DataGrid<ParameterDictionary> | undefined = undefined;
  let parcelModified: boolean = false;
  let parcelCommandDictionaryId: number | null = initialParcelCommandDictionaryId;
  let parcelCreatedAt: string | null = initialParcelCreatedAt;
  let parcelName: string = initialParcelName;
  let parcelId: number | null = initialParcelId;
  let parcelOwner: UserId = initialParcelOwner;
  let parcelSequenceAdaptationId: number | null = initialSequenceAdaptationId;
  let permissionError = 'You do not have permission to edit this parcel.';
  let saveButtonClass: 'primary' | 'secondary' = 'primary';
  let saveButtonText: string = '';
  let savedParcelCommandDictionaryId: number | null = parcelCommandDictionaryId;
  let savedParcelName: string = parcelName;
  let savedParameterDictionaryIds: Record<number, boolean> = {};
  let savedSequenceAdaptationId: number | null = parcelSequenceAdaptationId;
  let savingParcel: boolean = false;
  let selectedParmeterDictionaries: Record<number, boolean> = {};
  let sequenceAdaptationColumnDefs: DataGridColumnDef[];
  let sequenceAdaptationDataGrid: DataGrid<SequenceAdaptation> | undefined = undefined;

  const sharedColumnDefs: DataGridColumnDef[] = [
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
  ];

  const createdAtColumnDef: DataGridColumnDef[] = [
    { field: 'created_at', filter: 'text', headerName: 'Created At', resizable: true, sortable: true },
  ];

  const sharedDictionaryColumnDefs: DataGridColumnDef[] = [
    ...sharedColumnDefs,
    { field: 'mission', filter: 'text', headerName: 'Mission', sortable: true, width: 100 },
    { field: 'version', filter: 'text', headerName: 'Version', sortable: true, suppressAutoSize: true, width: 100 },
    ...createdAtColumnDef,
  ];

  $: selectedParmeterDictionaries = savedParameterDictionaryIds = $parcelToParameterDictionaries.reduce(
    (prevBooleanMap: Record<number, boolean>, parcelToParameterDictionary: ParcelToParameterDictionary) => {
      return {
        ...prevBooleanMap,
        [parcelToParameterDictionary.parameter_dictionary_id]: true,
      };
    },
    {},
  );

  $: {
    commandDictionaryColumnDefs = [
      {
        cellDataType: 'boolean',
        editable: hasPermission,
        headerName: '',
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams<CommandDictionary>) => {
          const { data } = params;
          if (data) {
            return parcelCommandDictionaryId === data.id;
          }
          return false;
        },
        width: 35,
      },
      ...sharedDictionaryColumnDefs,
    ];
  }

  $: {
    parameterDictionaryColumnDefs = [
      {
        cellDataType: 'boolean',
        editable: hasPermission,
        headerName: '',
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams<ParameterDictionary>) => {
          const { data } = params;
          if (data) {
            return !!selectedParmeterDictionaries[data.id];
          }
          return false;
        },
        width: 35,
      },
      ...sharedDictionaryColumnDefs,
    ];
  }

  $: if (selectedParmeterDictionaries) {
    parameterDictionaryDataGrid?.redrawRows();
  }

  $: {
    sequenceAdaptationColumnDefs = [
      {
        cellDataType: 'boolean',
        editable: hasPermission,
        headerName: '',
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams<SequenceAdaptation>) => {
          const { data } = params;
          if (data) {
            return parcelSequenceAdaptationId === data.id;
          }
          return false;
        },
        width: 35,
      },
      { field: 'name', filter: 'text', headerName: 'Name', sortable: true, width: 100 },
      ...sharedColumnDefs,
      ...createdAtColumnDef,
    ];
  }

  $: saveButtonClass = parcelModified && saveButtonEnabled ? 'primary' : 'secondary';
  $: saveButtonEnabled = parcelCommandDictionaryId !== null && parcelName !== '';
  $: parcelModified =
    parcelCommandDictionaryId !== savedParcelCommandDictionaryId ||
    parcelName !== savedParcelName ||
    parcelSequenceAdaptationId !== savedSequenceAdaptationId ||
    didParameterDictionariesChange(selectedParmeterDictionaries);

  $: {
    hasPermission =
      mode === 'edit'
        ? featurePermissions.parcels.canUpdate(user, { owner: parcelOwner })
        : featurePermissions.parcels.canCreate(user);
    permissionError = `You do not have permission to ${mode === 'edit' ? 'edit this' : 'create a'} parcel.`;
    pageTitle = mode === 'edit' ? 'Parcel' : 'New Parcel';
    pageSubtitle = mode === 'edit' ? savedParcelName : '';
    saveButtonText = mode === 'edit' && !parcelModified ? 'Saved' : 'Save';
  }

  /**
   * selectedParameterDictionaries keeps track of false values for the table while the saved list doesn't so
   * we need to do a custom comparison.
   */
  function didParameterDictionariesChange(parameterDictionaryMap: Record<number, boolean>): boolean {
    for (const parameterDictionaryIdString of Object.keys(parameterDictionaryMap)) {
      const parameterDictionaryId = parseInt(parameterDictionaryIdString);

      if (
        (selectedParmeterDictionaries[parameterDictionaryId] &&
          !(parameterDictionaryId in savedParameterDictionaryIds)) ||
        (!selectedParmeterDictionaries[parameterDictionaryId] && savedParameterDictionaryIds[parameterDictionaryId])
      ) {
        return true;
      }
    }

    return false;
  }

  function onToggleCommandDictionary(event: CustomEvent<CellEditingStoppedEvent<CommandDictionary, boolean>>) {
    const {
      detail: { data, newValue },
    } = event;

    if (data) {
      parcelCommandDictionaryId = newValue ? data.id : null;
    }

    commandDictionaryDataGrid?.redrawRows();
  }

  function onToggleParameterDictionary(event: CustomEvent<CellEditingStoppedEvent<ParameterDictionary, boolean>>) {
    const {
      detail: { data, newValue },
    } = event;

    if (data && typeof newValue === 'boolean') {
      selectedParmeterDictionaries = {
        ...selectedParmeterDictionaries,
        [data.id]: newValue,
      };
    }

    parameterDictionaryDataGrid?.redrawRows();
  }

  function onToggleSequenceAdaptation(event: CustomEvent<CellEditingStoppedEvent<SequenceAdaptation, boolean>>) {
    const {
      detail: { data, newValue },
    } = event;

    if (data) {
      parcelSequenceAdaptationId = newValue ? data.id : null;
    }

    sequenceAdaptationDataGrid?.redrawRows();
  }

  async function saveParcelToParameterDictionaries(): Promise<void> {
    const parcelToParameterDictionariesToAdd: Omit<ParcelToParameterDictionary, 'id'>[] = [];
    const parcelToParameterDictionaryIdsToDelete: number[] = [];

    Object.keys(selectedParmeterDictionaries).forEach(parameterDictionaryIdString => {
      const parameterDictionaryId = parseInt(parameterDictionaryIdString);
      const isSelected = selectedParmeterDictionaries[parameterDictionaryId];

      if (!isSelected && savedParameterDictionaryIds[parameterDictionaryId]) {
        // Parameter dictionary was removed from the parcel.
        parcelToParameterDictionaryIdsToDelete.push(parameterDictionaryId);
      } else if (isSelected && !savedParameterDictionaryIds[parameterDictionaryId] && parcelId) {
        // Parameter dictionary was freshly added to the parcel and hasn't been saved yet.
        parcelToParameterDictionariesToAdd.push({
          parameter_dictionary_id: parameterDictionaryId,
          parcel_id: parcelId,
        });
      }
    });

    if (parcelToParameterDictionariesToAdd.length > 0) {
      await effects.createParcelToParameterDictionaries(parcelOwner, parcelToParameterDictionariesToAdd, user);
    }

    if (parcelToParameterDictionaryIdsToDelete.length > 0) {
      const idsToDelete = [];

      for (const paramDictionaryId of parcelToParameterDictionaryIdsToDelete) {
        const parcelId: number | undefined = $parcelToParameterDictionaries.find(
          p => p.parameter_dictionary_id === paramDictionaryId && p.parcel_id === initialParcelId,
        )?.id;

        if (parcelId) {
          idsToDelete.push(parcelId);
        }

        if (idsToDelete.length > 0 && $parcel) {
          await effects.deleteParcelToParameterDictionaries(idsToDelete, $parcel, user);
        }
      }
    }
  }

  async function saveParcel() {
    if (saveButtonEnabled) {
      savingParcel = true;

      if (parcelCommandDictionaryId !== null && parcelName !== '') {
        if (mode === 'create') {
          const newParcel: ParcelInsertInput = {
            command_dictionary_id: parcelCommandDictionaryId,
            name: parcelName,
            sequence_adaptation_id: parcelSequenceAdaptationId,
          };
          parcelId = await effects.createParcel(newParcel, user);

          await saveParcelToParameterDictionaries();

          if (parcelId !== null) {
            goto(`${base}/parcels/edit/${parcelId}`);
          }
        } else if (mode === 'edit' && parcelId !== null) {
          const updatedParcel: Partial<Parcel> = {
            command_dictionary_id: parcelCommandDictionaryId,
            name: parcelName,
            sequence_adaptation_id: parcelSequenceAdaptationId,
          };

          saveParcelToParameterDictionaries();

          await effects.updateParcel(parcelId, updatedParcel, parcelOwner, user);
        }
      }

      savingParcel = false;
    }
  }
</script>

<PageTitle subTitle={pageSubtitle} title={pageTitle} />

<CssGrid columns="20% auto">
  <Panel borderRight padBody={false}>
    <svelte:fragment slot="header">
      <SectionTitle>{mode === 'create' ? 'New Parcel' : 'Edit Parcel'}</SectionTitle>

      <div class="right">
        <button class="st-button secondary ellipsis" on:click={() => goto(`${base}/parcels`)}>
          {mode === 'create' ? 'Cancel' : 'Close'}
        </button>
        <button
          class="st-button {saveButtonClass} ellipsis"
          disabled={!saveButtonEnabled}
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
          on:click={saveParcel}
        >
          {savingParcel ? 'Saving...' : saveButtonText}
        </button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      {#if mode === 'edit'}
        <fieldset>
          <label for="parcelId">ID</label>
          <input class="st-input w-100" disabled name="parcelId" value={parcelId} />
        </fieldset>

        <fieldset>
          <label for="createdAt">Created At</label>
          <input class="st-input w-100" disabled name="createdAt" value={parcelCreatedAt} />
        </fieldset>
      {/if}

      <fieldset>
        <label for="sequenceName">Name (required)</label>
        <input
          bind:value={parcelName}
          autocomplete="off"
          class="st-input w-100"
          name="parcelName"
          placeholder="Enter Parcel Name"
          required
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
        />
      </fieldset>
    </svelte:fragment>
  </Panel>

  <div class="table-container">
    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Command Dictionaries</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if $commandDictionaries.length}
          <DataGrid
            bind:this={commandDictionaryDataGrid}
            columnDefs={commandDictionaryColumnDefs}
            rowData={$commandDictionaries}
            on:cellEditingStopped={onToggleCommandDictionary}
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
          <DataGrid
            bind:this={parameterDictionaryDataGrid}
            columnDefs={parameterDictionaryColumnDefs}
            rowData={$parameterDictionaries}
            on:cellEditingStopped={onToggleParameterDictionary}
          />
        {:else}
          No Sequence Adaptations Found
        {/if}
      </svelte:fragment>
    </Panel>

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Sequence Adaptations</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if $sequenceAdaptations.length}
          <DataGrid
            bind:this={sequenceAdaptationDataGrid}
            columnDefs={sequenceAdaptationColumnDefs}
            rowData={$sequenceAdaptations}
            on:cellEditingStopped={onToggleSequenceAdaptation}
          />
        {:else}
          No Sequence Adaptations Found
        {/if}
      </svelte:fragment>
    </Panel>
  </div>
</CssGrid>

<style>
  .table-container {
    display: grid;
  }
</style>
