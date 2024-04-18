<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { CellEditingStoppedEvent, ValueGetterParams } from 'ag-grid-community';
  import { commandDictionaries } from '../../stores/sequencing';
  import type { User, UserId } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { CommandDictionary, Parcel, ParcelInsertInput } from '../../types/sequencing';
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
  export let mode: 'create' | 'edit' = 'create';
  export let user: User | null;

  let commandDictionaryColumnDefs: DataGridColumnDef[];
  let commandDictionaryDataGrid: DataGrid<CommandDictionary> | undefined = undefined;
  let hasPermission: boolean = false;
  let pageSubtitle: string = '';
  let pageTitle: string = '';
  let parcelModified: boolean = false;
  let parcelCommandDictionaryId: number | null = initialParcelCommandDictionaryId;
  let parcelCreatedAt: string | null = initialParcelCreatedAt;
  let parcelName: string = initialParcelName;
  let parcelId: number | null = initialParcelId;
  let parcelOwner: UserId = initialParcelOwner;
  let permissionError = 'You do not have permission to edit this parcel.';
  let saveButtonClass: 'primary' | 'secondary' = 'primary';
  let saveButtonText: string = '';
  let savedParcelCommandDictionaryId: number | null = parcelCommandDictionaryId;
  let savedParcelName: string = parcelName;
  let savingParcel: boolean = false;

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

  $: saveButtonClass = parcelModified && saveButtonEnabled ? 'primary' : 'secondary';
  $: saveButtonEnabled = parcelCommandDictionaryId !== null && parcelName !== '';
  $: parcelModified = parcelCommandDictionaryId !== savedParcelCommandDictionaryId || parcelName !== savedParcelName;

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

  function onToggleCommandDictionary(event: CustomEvent<CellEditingStoppedEvent<CommandDictionary, boolean>>) {
    const {
      detail: { data, newValue },
    } = event;

    if (data) {
      parcelCommandDictionaryId = newValue ? data.id : null;
    }

    commandDictionaryDataGrid?.redrawRows();
  }

  async function saveParcel() {
    if (saveButtonEnabled) {
      savingParcel = true;

      if (parcelCommandDictionaryId !== undefined && parcelName !== '') {
        if (mode === 'create') {
          const newParcel: ParcelInsertInput = {
            command_dictionary_id: parcelCommandDictionaryId,
            name: parcelName,
          };
          const newParcelId = await effects.createParcel(newParcel, user);

          if (newParcelId !== null) {
            goto(`${base}/parcels/edit/${newParcelId}`);
          }
        } else if (mode === 'edit' && parcelId !== null) {
          const updatedParcel: Partial<Parcel> = {
            command_dictionary_id: parcelCommandDictionaryId,
            name: parcelName,
          };
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
  </div>
</CssGrid>

<style>
  .table-container {
    display: grid;
  }
</style>
