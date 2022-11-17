<svelte:options immutable={true} />

<script lang="ts">
  import PenIcon from '@nasa-jpl/stellar/icons/pen.svg?component';
  import PlusIcon from '@nasa-jpl/stellar/icons/plus.svg?component';
  import { onMount } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import Input from '../../../components/form/Input.svelte';
  import {
    selectedLayer,
    selectedLayerId,
    selectedRow,
    selectedRowId,
    selectedTimeline,
    selectedTimelineId,
    selectedYAxisId,
    view,
    viewSetSelectedRow,
    viewSetSelectedTimeline,
    viewUpdateLayer,
    viewUpdateRow,
    viewUpdateTimeline,
  } from '../../../stores/views';
  import { getTarget } from '../../../utilities/generic';
  import { tooltip } from '../../../utilities/tooltip';
  import GridMenu from '../../menus/GridMenu.svelte';
  import CssGrid from '../../ui/CssGrid.svelte';
  import Panel from '../../ui/Panel.svelte';
  import LayerLineForm from './LayerLineForm.svelte';
  import LayerXRangeForm from './LayerXRangeForm.svelte';
  import YAxisForm from './YAxisForm.svelte';

  export let gridId: number;

  let rows: Row[] = [];

  $: rows = $selectedTimeline?.rows || [];

  function updateRowEvent(event: Event) {
    event.stopPropagation();
    const { name, value } = getTarget(event);
    viewUpdateRow(name, value);
  }

  function updateTimelineEvent(event: Event) {
    event.stopPropagation();
    const { name, value } = getTarget(event);
    viewUpdateTimeline(name, value);
  }

  function handleDndConsiderRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    rows = detail.items as Row[];
    // viewUpdateTimeline('rows', rows, $selectedTimelineId);
  }

  function handleDndFinalizeRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    rows = detail.items as Row[];
    viewUpdateTimeline('rows', rows, $selectedTimelineId);
  }

  onMount(() => {
    if ($selectedTimelineId === null) {
      const firstTimeline = $view.definition.plan.timelines[0];
      if (firstTimeline) {
        viewSetSelectedTimeline(firstTimeline.id);
      }
    }
  });
</script>

<Panel borderLeft padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridId} title="Timeline Form" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <!-- Select Timeline. -->
    <div class="timeline-select-container">
      <select
        class="st-select w-100"
        data-type="number"
        name="timelines"
        value={$selectedTimelineId}
        on:change={e => {
          const { valueAsNumber: id } = getTarget(e);
          viewSetSelectedTimeline(id);
        }}
      >
        {#each $view.definition.plan.timelines as timeline}
          <option value={timeline.id}>
            Timeline {timeline.id}
          </option>
        {/each}
      </select>
    </div>

    <!-- Timeline -->
    {#if !$selectedTimeline}
      <fieldset class="editor-section">No timeline selected</fieldset>
    {:else}
      <fieldset class="editor-section">
        <div class="st-typography-medium editor-section-header">Margins</div>
        <CssGrid columns="1fr 1fr" gap="8px">
          <Input>
            <label for="marginLeft">Margin Left</label>
            <input
              class="st-input w-100"
              name="marginLeft"
              type="number"
              value={$selectedTimeline.marginLeft}
              on:input={updateTimelineEvent}
            />
          </Input>

          <Input>
            <label for="marginRight">Margin Right</label>
            <input
              class="st-input w-100"
              name="marginRight"
              type="number"
              value={$selectedTimeline.marginRight}
              on:input={updateTimelineEvent}
            />
          </Input>
        </CssGrid>
      </fieldset>

      <fieldset class="editor-section">
        <div class="editor-section-header editor-section-header-with-button">
          <div class="st-typography-medium">Vertical Guides</div>
          <button use:tooltip={{ content: 'New Vertical Guide', placement: 'top' }} class="st-button icon">
            <PlusIcon />
          </button>
        </div>
      </fieldset>

      <fieldset class="editor-section">
        <div class="editor-section-header editor-section-header-with-button">
          <div class="st-typography-medium">Rows</div>
          <button use:tooltip={{ content: 'New Row', placement: 'top' }} class="st-button icon">
            <PlusIcon />
          </button>
        </div>
        <div
          class="rows"
          on:consider={handleDndConsiderRows}
          on:finalize={handleDndFinalizeRows}
          use:dndzone={{
            items: rows,
            type: 'rows',
          }}
        >
          {#each rows as row (row.id)}
            <div class="st-typography-body row">
              {row.name}
              <button use:tooltip={{ content: 'Edit Row', placement: 'top' }} class="st-button icon">
                <PenIcon />
              </button>
            </div>
          {/each}
        </div>
      </fieldset>
    {/if}

    <!-- Timeline OLD. -->
    <fieldset hidden>
      <details open>
        <summary>Timeline</summary>
        {#if !$selectedTimeline}
          <fieldset>No timeline selected</fieldset>
        {:else}
          <div class="details-body">
            <CssGrid columns="1fr 1fr 1fr" gap="16px">
              <Input>
                <label for="marginLeft">Margin Left</label>
                <input
                  class="st-input w-100"
                  name="marginLeft"
                  type="number"
                  value={$selectedTimeline.marginLeft}
                  on:input={updateTimelineEvent}
                />
              </Input>

              <Input>
                <label for="marginRight">Margin Right</label>
                <input
                  class="st-input w-100"
                  name="marginRight"
                  type="number"
                  value={$selectedTimeline.marginRight}
                  on:input={updateTimelineEvent}
                />
              </Input>

              <Input>
                <label for="rows">Rows</label>
                <select
                  class="st-select w-100"
                  data-type="number"
                  name="rows"
                  value={$selectedRowId}
                  on:change={e => {
                    const { valueAsNumber: id } = getTarget(e);
                    viewSetSelectedRow(id);
                  }}
                >
                  {#each $selectedTimeline.rows as row}
                    <option value={row.id}>
                      {row.id}
                    </option>
                  {/each}
                </select>
              </Input>
            </CssGrid>
          </div>
        {/if}
      </details>
    </fieldset>

    <!-- Row. -->
    <fieldset hidden>
      <details open>
        <summary>Row</summary>
        {#if !$selectedRow}
          <fieldset>No row selected</fieldset>
        {:else}
          <div class="details-body">
            <CssGrid columns="1fr 1fr 1fr" gap="16px">
              <!-- Row Height. -->
              <Input>
                <label for="height">Height</label>
                <input
                  class="st-input w-100"
                  name="height"
                  type="number"
                  value={$selectedRow.height}
                  on:input={updateRowEvent}
                />
              </Input>

              <!-- Row Y-Axes. -->
              <Input>
                <label for="yAxes">Y-Axes</label>
                <select
                  bind:value={$selectedYAxisId}
                  class="st-select w-100"
                  disabled={!$selectedRow.yAxes.length}
                  name="yAxes"
                >
                  {#each $selectedRow.yAxes as yAxis}
                    <option value={yAxis.id}>
                      {yAxis.id}
                    </option>
                  {/each}
                </select>
              </Input>

              <!-- Row Layers. -->
              <Input>
                <label for="layers">Layers</label>
                <select
                  bind:value={$selectedLayerId}
                  class="st-select w-100"
                  disabled={!$selectedRow.layers.length}
                  name="layers"
                >
                  {#each $selectedRow.layers as layer}
                    <option value={layer.id}>
                      {layer.id}
                    </option>
                  {/each}
                </select>
              </Input>
            </CssGrid>
          </div>
        {/if}
      </details>
    </fieldset>

    <!-- Y-Axis. -->
    <fieldset hidden>
      <details open>
        <summary>Y-Axis</summary>
        <div class="details-body">
          <YAxisForm />
        </div>
      </details>
    </fieldset>

    <!-- Layer. -->
    <fieldset hidden>
      <details open>
        <summary>Layer</summary>
        {#if !$selectedLayer}
          <fieldset>No layer selected</fieldset>
        {:else}
          <div class="details-body">
            <!-- Layer Chart Type. -->
            <div style="display:block; margin-bottom: 8px">
              <Input>
                <label for="chartType">Chart Type</label>
                <select
                  class="st-select w-100"
                  name="chartType"
                  value={$selectedLayer.chartType}
                  on:change={viewUpdateLayer}
                >
                  <option value="activity"> Activity </option>
                  <option value="line"> Line </option>
                  <option value="x-range"> X-Range </option>
                </select>
              </Input>
            </div>

            <LayerLineForm />

            <LayerXRangeForm />
          </div>
        {/if}
      </details>
    </fieldset>
  </svelte:fragment>
</Panel>

<style>
  .timeline-select-container {
    border-bottom: 1px solid var(--st-gray-20);
    padding: 16px 8px;
  }

  .editor-section {
    border-bottom: 1px solid var(--st-gray-20);
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .editor-section-header {
    user-select: none;
  }

  .editor-section-header .st-button.icon,
  .row .st-button.icon {
    color: var(--st-gray-50);
  }

  .editor-section-header-with-button {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .rows {
    min-height: 100px;
    outline: none !important;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .row {
    align-items: center;
    display: flex;
    height: 40px;
    justify-content: space-between;
    padding: 4px 0px;
  }
</style>
