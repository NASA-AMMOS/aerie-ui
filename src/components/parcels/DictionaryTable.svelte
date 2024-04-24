<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef, RowId } from '../../types/data-grid';
  import type { DictionaryType } from '../../types/sequencing';
  import { featurePermissions } from '../../utilities/permissions';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  export let dictionaries: DictionaryType[];
  export let type: string;
  export let user: User | null;

  const dispatch = createEventDispatcher<{
    delete: { id: number };
  }>();

  type dCellRendererParams = {
    deleteDictionary?: (dictionary: DictionaryType) => void;
  };
  type DictionaryCellRendererParams = ICellRendererParams<DictionaryType> & dCellRendererParams;

  $: isSequenceAdaptation = type === 'Sequence';
  $: displayText = isSequenceAdaptation ? `${type} Adaptation` : `${type} Dictionary`;
  $: displayTextPlural = isSequenceAdaptation ? `${type} Adaptations` : `${type} Dictionaries`;
  $: hasDeletePermission = featurePermissions.commandDictionary.canDelete(user);

  const dictionaryColumnDefs: DataGridColumnDef[] = [
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

  const sequenceAdaptationColumDefs: DataGridColumnDef[] = [
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
  ];

  $: columnDefs = [
    ...(isSequenceAdaptation ? sequenceAdaptationColumDefs : dictionaryColumnDefs),
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: DictionaryCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteDictionary,
            deleteTooltip: {
              content: `Delete ${displayText}`,
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
        deleteDictionary,
      } as dCellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
  ];

  function deleteDictionary({ id }: Pick<DictionaryType, 'id'>) {
    dispatch('delete', { id });
  }

  function deleteDictionaryContext(event: CustomEvent<RowId[]>) {
    deleteDictionary({ id: event.detail[0] as number });
  }
</script>

<Panel>
  <svelte:fragment slot="header">
    <SectionTitle>{displayTextPlural}</SectionTitle>
  </svelte:fragment>

  <svelte:fragment slot="body">
    {#if dictionaries.length}
      <SingleActionDataGrid
        {columnDefs}
        {hasDeletePermission}
        itemDisplayText={displayText}
        items={dictionaries}
        {user}
        on:deleteItem={deleteDictionaryContext}
      />
    {:else}
      No {displayTextPlural} Found
    {/if}
  </svelte:fragment>
</Panel>
