<svelte:options immutable={true} />

<script lang="ts">
  import { parcels, userSequences, userSequencesColumns } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import type { Parcel, UserSequence } from '../../types/sequencing';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import WorkspaceTable from '../workspace/WorkspaceTable.svelte';
  import SequenceEditor from './SequenceEditor.svelte';
  import SequenceTable from './SequenceTable.svelte';

  export let user: User | null;

  let filterText: string = '';
  let parcel: Parcel | null;
  let selectedSequence: UserSequence | null = null;

  $: parcel = $parcels.find(p => p.id === selectedSequence?.parcel_id) ?? null;

  $: if (selectedSequence !== null) {
    const found = $userSequences.findIndex(sequence => sequence.id === selectedSequence?.id);

    if (found === -1) {
      selectedSequence = null;
    }
  }

  function onSequenceSelected(event: CustomEvent<UserSequence>) {
    selectedSequence = event.detail;
  }
</script>

<CssGrid bind:columns={$userSequencesColumns}>
  <WorkspaceTable {user}>
    <SequenceTable {filterText} {user} on:sequenceSelected={onSequenceSelected} />
  </WorkspaceTable>
  <!--<Panel>
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
          New Sequence
        </button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
    </svelte:fragment>
  </Panel>-->

  <CssGridGutter track={1} type="column" />

  <SequenceEditor
    {parcel}
    showCommandFormBuilder={false}
    sequenceDefinition={selectedSequence?.definition ?? ''}
    sequenceName={selectedSequence?.name}
    sequenceOutput={selectedSequence?.seq_json}
    title="Sequence - Definition Editor (Read-only)"
    readOnly={true}
    {user}
  />
</CssGrid>
