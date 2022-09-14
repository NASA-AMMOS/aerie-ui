<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { expansionSetsColumns, savingExpansionSet } from '../../stores/expansion';
  import { models } from '../../stores/plan';
  import { commandDictionaries } from '../../stores/sequencing';
  import effects from '../../utilities/effects';
  import Chip from '../ui/Chip.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import BulkActionDataGrid from '../ui/DataGrid/BulkActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExpansionLogicEditor from './ExpansionLogicEditor.svelte';

  export let mode: 'create' | 'edit' = 'create';

  interface ActivityExpansionRuleRow {
    activityType: string;
    expansionRule: ExpansionRule;
    ruleId: number;
  }

  let activityTypesExpansionRules: ActivityTypeExpansionRules[] = [];
  let flattendExpansionRules: ActivityExpansionRuleRow[] = [];
  let lastSelectedExpansionRule: ExpansionRule | null = null;
  let lastSelectedExpansionId: number | null = null;
  let logicEditorActivityType: string | null = null;
  let logicEditorRuleLogic: string = 'No Expansion Rule Selected';
  let logicEditorTitle: string = 'Expansion Rule - Logic Editor (Read-only)';
  let saveButtonEnabled: boolean = false;
  let setExpansionRuleIds: number[] = [];
  let setDictionaryId: number | null = null;
  let setModelId: number | null = null;

  $: effects
    .getActivityTypesExpansionRules(setModelId)
    .then(activity_types => (activityTypesExpansionRules = activity_types));

  $: flattendExpansionRules = activityTypesExpansionRules.reduce(
    (totalRules: ActivityExpansionRuleRow[], activityTypeExpansionRule: ActivityTypeExpansionRules) => {
      return [
        ...totalRules,
        ...activityTypeExpansionRule.expansion_rules.map(
          (expansionRule: ExpansionRule): ActivityExpansionRuleRow => ({
            activityType: activityTypeExpansionRule.name,
            expansionRule,
            ruleId: expansionRule.id,
          }),
        ),
      ];
    },
    [],
  );

  $: {
    const ruleIndex = flattendExpansionRules.findIndex(
      activityExpansionRule => activityExpansionRule.ruleId === lastSelectedExpansionId,
    );
    lastSelectedExpansionRule = ruleIndex > -1 ? flattendExpansionRules[ruleIndex].expansionRule : null;
  }
  $: logicEditorActivityType = lastSelectedExpansionRule?.activity_type ?? null;
  $: logicEditorRuleLogic = lastSelectedExpansionRule?.expansion_logic ?? 'No Expansion Rule Selected';
  $: logicEditorTitle = lastSelectedExpansionRule
    ? `Expansion Rule - Logic Editor - ${lastSelectedExpansionRule.activity_type} - Rule ${lastSelectedExpansionRule.id} (Read-only)`
    : 'Expansion Rule - Logic Editor (Read-only)';
  $: saveButtonEnabled = setDictionaryId !== null && setModelId !== null && setExpansionRuleIds.length > 0;

  function onRowSelected(event: CustomEvent<DataGridRowSelection<ActivityExpansionRuleRow>>) {
    const {
      detail: { data: selectedRow, isSelected },
    } = event;

    if (isSelected) {
      lastSelectedExpansionId = selectedRow.ruleId;
    }
  }

  function onSelectionChanged(event: CustomEvent<ActivityExpansionRuleRow[]>) {
    const { detail: selectedRules } = event;

    setExpansionRuleIds = selectedRules.map(rule => rule.ruleId);

    if (!setExpansionRuleIds.length) {
      lastSelectedExpansionId = null;
    }
  }

  async function saveSet() {
    if (mode === 'create') {
      const newSetId = await effects.createExpansionSet(setDictionaryId, setModelId, setExpansionRuleIds);

      if (newSetId !== null) {
        goto(`${base}/expansion/sets`);
      }
    }
  }
</script>

<CssGrid bind:columns={$expansionSetsColumns}>
  <Panel>
    <svelte:fragment slot="header">
      <Chip>New Expansion Set</Chip>

      <div class="right">
        <button class="st-button secondary ellipsis" on:click={() => goto(`${base}/expansion/sets`)}>
          {mode === 'create' ? 'Cancel' : 'Close'}
        </button>
        <button class="st-button secondary ellipsis" disabled={!saveButtonEnabled} on:click={saveSet}>
          {$savingExpansionSet ? 'Saving...' : 'Save'}
        </button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      <fieldset>
        <label for="commandDictionary">Command Dictionary</label>
        <select bind:value={setDictionaryId} class="st-select w-100" name="commandDictionary">
          <option value={null} />
          {#each $commandDictionaries as commandDictionary}
            <option value={commandDictionary.id}>
              {commandDictionary.mission} -
              {commandDictionary.version}
            </option>
          {/each}
        </select>
      </fieldset>

      <fieldset>
        <label for="modelId">Model</label>
        <select
          bind:value={setModelId}
          class="st-select w-100"
          name="modelId"
          on:change={() => (setExpansionRuleIds = [])}
        >
          <option value={null} />
          {#each $models as model}
            <option value={model.id}>
              {model.name}
            </option>
          {/each}
        </select>
      </fieldset>

      <fieldset class="expansion-rules-table">
        <label for="expansionRules" class="mb-2" style:display="block">Expansion Rules</label>

        {#if !activityTypesExpansionRules.length}
          No Expansion Rules Found
        {:else}
          <BulkActionDataGrid
            idKey="ruleId"
            columnDefs={[
              { field: 'activityType', filter: 'text', headerName: 'Activity Type', resizable: true, sortable: true },
              {
                checkboxSelection: true,
                field: 'ruleId',
                filter: 'number',
                headerCheckboxSelection: true,
                headerCheckboxSelectionFilteredOnly: true,
                headerName: 'Expansion Rule',
                resizable: true,
                sortable: true,
                valueFormatter: ({ value }) => {
                  return `Rule ${value}`;
                },
              },
            ]}
            items={flattendExpansionRules}
            selectedItemId={lastSelectedExpansionId}
            showContextMenu={false}
            suppressRowClickSelection={true}
            on:rowSelected={onRowSelected}
            on:selectionChanged={onSelectionChanged}
          />
        {/if}
      </fieldset>
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="column" />

  <ExpansionLogicEditor
    readOnly={true}
    ruleActivityType={logicEditorActivityType}
    ruleDictionaryId={setDictionaryId}
    ruleLogic={logicEditorRuleLogic}
    ruleModelId={setModelId}
    title={logicEditorTitle}
  />
</CssGrid>

<style>
  .expansion-rules-table {
    display: contents;
  }

  .expansion-rules-table :global(.ag-theme-stellar .ag-row.ag-selectable-row) {
    cursor: auto;
  }

  .expansion-rules-table :global(.ag-theme-stellar .ag-row.ag-selectable-row input) {
    cursor: pointer;
  }
</style>
