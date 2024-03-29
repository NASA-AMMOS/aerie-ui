<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { ICellRendererParams } from 'ag-grid-community';
  import { userSequences, userSequencesColumns } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef, DataGridRowSelection, RowId } from '../../types/data-grid';
  import type { UserSequence } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import Input from '../form/Input.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import SequenceEditor from './SequenceEditor.svelte';

  export let user: User | null;

  type CellRendererParams = {
    deleteSequence: (sequence: UserSequence) => void;
    editSequence: (sequence: UserSequence) => void;
  };
  type SequencesCellRendererParams = ICellRendererParams<UserSequence> & CellRendererParams;

  const baseColumnDefs: DataGridColumnDef[] = [
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
    { field: 'name', filter: 'text', headerName: 'Name', resizable: true, sortable: true },
    {
      field: 'authoring_command_dict_id',
      filter: 'number',
      headerName: 'Command Dictionary ID',
      resizable: true,
      sortable: true,
    },
  ];

  let abortController: AbortController;
  let columnDefs = baseColumnDefs;
  let filterText: string = '';
  let filteredSequences: UserSequence[] = [];
  let selectedSequence: UserSequence | null = null;
  let selectedSequenceSeqJson: string = 'No Sequence Selected';

  $: filteredSequences = $userSequences.filter(sequence => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesId = `${sequence.id}`.includes(filterTextLowerCase);
    const includesName = sequence.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesId || includesName;
  });
  $: if (selectedSequence !== null) {
    const found = $userSequences.findIndex(sequence => sequence.id === selectedSequence?.id);
    if (found === -1) {
      selectedSequence = null;
    }
  }
  $: columnDefs = [
    ...baseColumnDefs,
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: SequencesCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteSequence,
            deleteTooltip: {
              content: 'Delete Sequence',
              placement: 'bottom',
            },
            editCallback: params.editSequence,
            editTooltip: {
              content: 'Edit Sequence',
              placement: 'bottom',
            },
            hasDeletePermission: params.data ? hasDeletePermission(user, params.data) : false,
            hasEditPermission: params.data ? hasEditPermission(user, params.data) : false,
            rowData: params.data,
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        deleteSequence,
        editSequence,
      } as CellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 55,
    },
  ];

  async function deleteSequence(sequence: UserSequence) {
    const success = await effects.deleteUserSequence(sequence, user);

    if (success) {
      userSequences.filterValueById(sequence.id);

      if (sequence.id === selectedSequence?.id) {
        selectedSequence = null;
        selectedSequenceSeqJson = 'No Sequence Selected';
      }
    }
  }

  function deleteSequenceContext(event: CustomEvent<RowId[]>) {
    const id = event.detail[0] as number;
    const sequence = $userSequences.find(s => s.id === id);
    if (sequence) {
      deleteSequence(sequence);
    }
  }

  function editSequence({ id }: Pick<UserSequence, 'id'>) {
    goto(`${base}/sequencing/edit/${id}`);
  }

  function editSequenceContext(event: CustomEvent<RowId[]>) {
    editSequence({ id: event.detail[0] as number });
  }

  async function getUserSequenceSeqJson(): Promise<void> {
    if (selectedSequence !== null) {
      abortController?.abort();
      abortController = new AbortController();
      selectedSequenceSeqJson = 'Generating Seq JSON...';

      const responseMessage = await effects.getUserSequenceSeqJson(
        selectedSequence.authoring_command_dict_id,
        selectedSequence.definition,
        user,
        abortController.signal,
      );

      if (selectedSequence === null) {
        selectedSequenceSeqJson = 'No Sequence Selected';
      } else if (responseMessage === 'The user aborted a request.') {
        selectedSequenceSeqJson = 'Generating Seq JSON...';
      } else {
        selectedSequenceSeqJson = responseMessage;
      }
    }
  }

  function hasDeletePermission(user: User | null, sequence: UserSequence) {
    return featurePermissions.sequences.canDelete(user, sequence);
  }

  function hasEditPermission(user: User | null, sequence: UserSequence) {
    return featurePermissions.sequences.canUpdate(user, sequence);
  }

  async function toggleSequence(event: CustomEvent<DataGridRowSelection<UserSequence>>) {
    const { detail } = event;
    const { data: clickedSequence, isSelected } = detail;

    if (isSelected) {
      selectedSequence = clickedSequence;
      await getUserSequenceSeqJson();
    }
  }
</script>

<CssGrid bind:columns={$userSequencesColumns}>
  <Panel>
    <svelte:fragment slot="header">
      <SectionTitle>Sequences</SectionTitle>

      <Input>
        <input bind:value={filterText} class="st-input" placeholder="Filter sequences" style="width: 100%;" />
      </Input>

      <div class="right">
        <button
          class="st-button secondary ellipsis"
          use:permissionHandler={{
            hasPermission: featurePermissions.sequences.canCreate(user),
            permissionError: 'You do not have permission to create a new sequence',
          }}
          on:click={() => goto(`${base}/sequencing/new`)}
        >
          New
        </button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      {#if filteredSequences.length}
        <SingleActionDataGrid
          {columnDefs}
          hasEdit={true}
          {hasEditPermission}
          {hasDeletePermission}
          itemDisplayText="Sequence"
          items={filteredSequences}
          {user}
          on:deleteItem={deleteSequenceContext}
          on:editItem={editSequenceContext}
          on:rowSelected={toggleSequence}
        />
      {:else}
        <div class="p1 st-typography-label">No Sequences Found</div>
      {/if}
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="column" />

  <SequenceEditor
    sequenceDefinition={selectedSequence?.definition ?? 'No Sequence Selected'}
    sequenceCommandDictionaryId={selectedSequence?.authoring_command_dict_id}
    sequenceName={selectedSequence?.name}
    sequenceSeqJson={selectedSequenceSeqJson}
    readOnly={true}
    title="Sequence - Definition Editor (Read-only)"
    {user}
    on:generate={getUserSequenceSeqJson}
  />
</CssGrid>
