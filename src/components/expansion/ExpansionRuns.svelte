<svelte:options immutable={true} />

<script lang="ts">
  import { expansionRuns, expansionSetsColumns } from '../../stores/expansion';
  import type { DataGridColumnDef, DataGridRowSelection } from '../../types/data-grid';
  import type { ExpandedSequence, ExpansionRun } from '../../types/expansion';
  import SequenceEditor from '../sequencing/SequenceEditor.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

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
    { field: 'expansion_set.name', filter: 'text', headerName: 'Expansion Set', resizable: true, sortable: true },
    { field: 'created_at', filter: 'text', headerName: 'Created At', resizable: true, sortable: true },
  ];

  let selectedSequence: ExpandedSequence | null = null;
  let selectedSequenceIds: number[] = [];
  let selectedExpansionRun: ExpansionRun | null = null;

  $: selectedSequenceIds = selectedSequence ? [selectedSequence.id] : [];

  function toggleRun(event: CustomEvent<DataGridRowSelection<ExpansionRun>>) {
    const {
      detail: { data: clickedRun, isSelected },
    } = event;

    selectedSequence = null;

    if (isSelected) {
      selectedExpansionRun = clickedRun;
    } else if (selectedExpansionRun?.id === clickedRun.id) {
      selectedExpansionRun = null;
    }
  }

  function toggleSequence(event: CustomEvent<DataGridRowSelection<ExpandedSequence>>) {
    const {
      detail: { data: clickedSequence, isSelected },
    } = event;

    if (isSelected) {
      selectedSequence = clickedSequence;
    } else if (selectedSequence?.id === clickedSequence.id) {
      selectedSequence = null;
    }
  }
</script>

<CssGrid bind:columns={$expansionSetsColumns}>
  <CssGrid rows="1fr 3px 1fr">
    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Expansion Runs</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if $expansionRuns.length}
          <DataGrid {columnDefs} rowSelection="single" rowData={$expansionRuns} on:rowSelected={toggleRun} />
        {:else}
          No Expansion Runs Found
        {/if}
      </svelte:fragment>
    </Panel>

    <CssGridGutter track={1} type="row" />

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Expanded Sequences</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if selectedExpansionRun}
          <DataGrid
            columnDefs={[
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
              {
                field: 'seq_id',
                filter: 'text',
                headerName: 'Sequence ID',
                resizable: true,
                sortable: true,
              },
            ]}
            rowData={selectedExpansionRun?.expanded_sequences}
            rowSelection="single"
            selectedRowIds={selectedSequenceIds}
            on:rowSelected={toggleSequence}
          />
        {:else}
          No Expansion Run Selected
        {/if}
      </svelte:fragment>
    </Panel>
  </CssGrid>

  <CssGridGutter track={1} type="column" />

  <SequenceEditor
    disableSeqJSONGeneration
    sequenceDefinition={selectedSequence?.edsl_string ?? 'No Sequence Selected'}
    sequenceCommandDictionaryId={selectedExpansionRun?.expansion_set?.command_dict_id}
    sequenceName={selectedSequence?.seq_id}
    sequenceSeqJson={selectedSequence ? JSON.stringify(selectedSequence.expanded_sequence) : null}
    readOnly={true}
    title="Sequence - Definition Editor (Read-only)"
  />
</CssGrid>
