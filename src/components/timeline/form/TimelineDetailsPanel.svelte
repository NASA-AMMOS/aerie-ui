<svelte:options immutable={true} />

<script lang="ts">
  import ArrowLeftIcon from '@nasa-jpl/stellar/icons/arrow_left.svg?component';
  import PenIcon from '@nasa-jpl/stellar/icons/pen.svg?component';
  import PlusIcon from '@nasa-jpl/stellar/icons/plus.svg?component';
  import TrashIcon from '@nasa-jpl/stellar/icons/trash.svg?component';
  import GripVerticalIcon from 'bootstrap-icons/icons/grip-vertical.svg?component';
  import { onMount } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { get } from 'svelte/store';
  import DatePickerField from '../../../components/form/DatePickerField.svelte';
  import Field from '../../../components/form/Field.svelte';
  import Input from '../../../components/form/Input.svelte';
  import { field } from '../../../stores/form';
  import { maxTimeRange, viewTimeRange } from '../../../stores/plan';
  import {
    selectedRow,
    selectedRowId,
    selectedTimeline,
    selectedTimelineId,
    view,
    viewSetSelectedRow,
    viewSetSelectedTimeline,
    viewUpdateRow,
    viewUpdateTimeline,
  } from '../../../stores/views';
  import { getTarget } from '../../../utilities/generic';
  import { getDoyTime } from '../../../utilities/time';
  import { createHorizontalGuide, createRow, createVerticalGuide } from '../../../utilities/timeline';
  import { tooltip } from '../../../utilities/tooltip';
  import { required, timestamp } from '../../../utilities/validators';
  import GridMenu from '../../menus/GridMenu.svelte';
  import CssGrid from '../../ui/CssGrid.svelte';
  import Panel from '../../ui/Panel.svelte';

  export let gridId: number;

  type HorizontalGuideFieldsMap = {
    color: FieldStore<string>;
    label: FieldStore<string>;
    y: FieldStore<number>;
    yAxisId: FieldStore<number>;
  };
  type VerticalGuideFieldsMap = {
    label: FieldStore<string>;
    timestamp: FieldStore<string>;
  };

  let rows: Row[] = [];
  let horizontalGuideFieldsMap: Record<number, HorizontalGuideFieldsMap> = {};
  let verticalGuideFieldsMap: Record<number, VerticalGuideFieldsMap> = {};

  $: rows = $selectedTimeline?.rows || [];
  $: verticalGuides = $selectedTimeline?.verticalGuides || [];
  $: horizontalGuides = $selectedRow?.horizontalGuides || [];
  $: rowHasNonActivityChartLayer = !!$selectedRow?.layers.find(layer => layer.chartType !== 'activity') || false;

  $: if (verticalGuides) {
    verticalGuideFieldsMap = verticalGuides.reduce((map, guide) => {
      if (!map[guide.id]) {
        map[guide.id] = {
          label: field<string>(guide.label.text, [required, timestamp]),
          timestamp: field<string>(guide.timestamp, [required, timestamp]),
        };
      }
      return map;
    }, {});
  }

  $: if (horizontalGuides) {
    horizontalGuideFieldsMap = horizontalGuides.reduce((map, guide) => {
      if (!map[guide.id]) {
        map[guide.id] = {
          color: field<string>(guide.label.color),
          label: field<string>(guide.label.text),
          y: field<number>(guide.y, [required]),
          yAxisId: field<number>(guide.yAxisId, [required]),
        };
      }
      return map;
    }, {});
  }

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

  function updateYAxisScaleDomain(event: Event, yAxis: Axis) {
    const { name, value: v } = getTarget(event);
    const numberValue = v as number;
    const value = isNaN(numberValue) ? null : numberValue;
    let scaleDomain = [...yAxis.scaleDomain];

    if (name === 'domainMin') {
      scaleDomain[0] = value;
      scaleDomain[1] = scaleDomain[1] ?? null;
    } else if (name === 'domainMax') {
      scaleDomain[0] = scaleDomain[0] ?? null;
      scaleDomain[1] = value;
    }

    const [min, max] = scaleDomain;
    if (min === null && max === null) {
      scaleDomain = [];
    }

    const newRowYAxes = $selectedRow.yAxes.map(axis => {
      if (axis.id === yAxis.id) {
        axis.scaleDomain = scaleDomain;
      }
      return axis;
    });
    viewUpdateRow('yAxes', newRowYAxes);
  }

  function updateYAxisTickCount(event: Event, yAxis: Axis) {
    const { value: v } = getTarget(event);
    const numberValue = v as number;
    const value = isNaN(numberValue) ? null : numberValue;

    const newRowYAxes = $selectedRow.yAxes.map(axis => {
      if (axis.id === yAxis.id) {
        axis.tickCount = value;
      }
      return axis;
    });
    viewUpdateRow('yAxes', newRowYAxes);
  }

  function addTimelineRow() {
    if (!$selectedTimeline) {
      return;
    }

    const row = createRow($selectedTimeline.rows);
    rows = [...rows, row];
    viewUpdateTimeline('rows', rows);
  }

  function handleDndConsiderRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    rows = detail.items as Row[];
  }

  function handleDndFinalizeRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    rows = detail.items as Row[];
    viewUpdateTimeline('rows', rows, $selectedTimelineId);
  }

  function handleDeleteVerticalGuideClick(verticalGuide: VerticalGuide) {
    const filteredVerticalGuides = verticalGuides.filter(guide => guide.id !== verticalGuide.id);
    viewUpdateTimeline('verticalGuides', filteredVerticalGuides, $selectedTimelineId);
  }

  function handleDeleteHorizontalGuideClick(horizontalGuide: HorizontalGuide) {
    const filteredHorizontalGuides = horizontalGuides.filter(guide => guide.id !== horizontalGuide.id);
    viewUpdateRow('horizontalGuides', filteredHorizontalGuides);
  }

  function handleUpdateVerticalGuide(verticalGuide: VerticalGuide) {
    const newVerticalGUides = verticalGuides.map(guide => {
      if (guide.id === verticalGuide.id) {
        const fields = verticalGuideFieldsMap[guide.id];
        guide.timestamp = get(fields.timestamp).value;
        guide.label.text = get(fields.label).value;
      }
      return guide;
    });
    viewUpdateTimeline('verticalGuides', newVerticalGUides, $selectedTimelineId);
  }

  function handleUpdateHorizontalGuide(horizontalGuide: HorizontalGuide) {
    const filteredHorizontalGuides = horizontalGuides.map(guide => {
      if (guide.id === horizontalGuide.id) {
        const fields = horizontalGuideFieldsMap[guide.id];
        guide.label.color = get(fields.color).value;
        guide.label.text = get(fields.label).value;
        guide.y = get(fields.y).value;
        guide.yAxisId = get(fields.yAxisId).value;
      }
      return guide;
    });
    viewUpdateRow('horizontalGuides', filteredHorizontalGuides);
  }

  function handleNewHorizontalGuideClick() {
    if (!$selectedRow) {
      return;
    }

    const newHorizontalGuide = createHorizontalGuide($selectedRow.yAxes, horizontalGuides);
    viewUpdateRow('horizontalGuides', [...horizontalGuides, newHorizontalGuide]);
  }

  function handleNewVerticalGuideClick() {
    if (typeof $selectedTimelineId !== 'number' || !$viewTimeRange) {
      return;
    }

    // Place the cursor in the middle of the timeline
    const centerTime = $viewTimeRange.start + ($viewTimeRange.end - $viewTimeRange.start) / 2;
    const centerDateDoy = getDoyTime(new Date(centerTime));

    const newVerticalGuide = createVerticalGuide(centerDateDoy, verticalGuides);
    viewUpdateTimeline('verticalGuides', [...verticalGuides, newVerticalGuide], $selectedTimelineId);
  }

  function handleHorizontalGuideColorInputChange(event: Event, horizontalGuide: HorizontalGuide) {
    console.log('input');
    const { name, value } = getTarget(event);
    const color = value as string;
    // handleUpdateHorizontalGuide(horizontalGuide);
    // const q = horizontalGuideFieldsMap[horizontalGuide.id].color.set();
  }

  // This is the JS way to style the dragged element, notice it is being passed into the dnd-zone
  function transformDraggedElement(draggedEl: Element) {
    const el = draggedEl.querySelector('.row') as HTMLElement;
    el.style.background = 'var(--st-gray-10)';
    el.classList.add('test');
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
    <GridMenu {gridId} title="Timeline Details" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    {#if !$selectedRow}
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

      <!-- Timeline editing -->
      {#if !$selectedTimeline}
        <fieldset class="editor-section">No timeline selected</fieldset>
      {:else}
        <fieldset class="editor-section">
          <div class="st-typography-medium editor-section-header">Margins</div>
          <CssGrid columns="1fr 1fr" gap="8px">
            <Input>
              <label for="marginLeft">Margin Left</label>
              <input
                min={0}
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
                min={0}
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
            <button
              on:click={handleNewVerticalGuideClick}
              use:tooltip={{ content: 'New Vertical Guide', placement: 'top' }}
              class="st-button icon"
            >
              <PlusIcon />
            </button>
          </div>
          {#if verticalGuides.length}
            <div class="guides">
              {#each verticalGuides as verticalGuide (verticalGuide.id)}
                <div class="guide">
                  <Field
                    field={verticalGuideFieldsMap[verticalGuide.id].label}
                    on:change={() => handleUpdateVerticalGuide(verticalGuide)}
                  >
                    <input
                      on:keyup={() => handleUpdateVerticalGuide(verticalGuide)}
                      autocomplete="off"
                      class="st-input w-100"
                      name="label"
                      placeholder="Guide label"
                    />
                  </Field>
                  <DatePickerField
                    minDate={new Date($maxTimeRange.start)}
                    maxDate={new Date($maxTimeRange.end)}
                    field={verticalGuideFieldsMap[verticalGuide.id].timestamp}
                    on:change={() => handleUpdateVerticalGuide(verticalGuide)}
                    on:keydown={() => handleUpdateVerticalGuide(verticalGuide)}
                  />
                  <button
                    on:click={() => handleDeleteVerticalGuideClick(verticalGuide)}
                    use:tooltip={{ content: 'Delete Guide', placement: 'top' }}
                    class="st-button icon"
                  >
                    <TrashIcon />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </fieldset>

        <fieldset class="editor-section editor-section-rows">
          <div class="editor-section-header editor-section-header-with-button">
            <div class="st-typography-medium">Rows</div>
            <button
              on:click={addTimelineRow}
              use:tooltip={{ content: 'New Row', placement: 'top' }}
              class="st-button icon"
            >
              <PlusIcon />
            </button>
          </div>
          <div
            class="rows"
            on:consider={handleDndConsiderRows}
            on:finalize={handleDndFinalizeRows}
            use:dndzone={{
              items: rows,
              transformDraggedElement,
              type: 'rows',
            }}
          >
            {#each rows as row (row.id)}
              <div>
                <div class="st-typography-body row">
                  <span class="drag-icon">
                    <GripVerticalIcon />
                  </span>
                  {row.name}
                  <button
                    use:tooltip={{ content: 'Edit Row', placement: 'top' }}
                    class="st-button icon"
                    on:click={() => {
                      viewSetSelectedRow(row.id);
                    }}
                  >
                    <PenIcon />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </fieldset>
      {/if}
    {:else}
      <!-- Row editing -->
      <button
        on:click={() => {
          viewSetSelectedRow(null);
        }}
        class="st-button tertiary section-back-button"
      >
        <ArrowLeftIcon />
        Back to Timeline {$selectedTimelineId}
      </button>
      <div class="timeline-select-container">
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
          {#each rows as row (row.id)}
            <option value={row.id}>
              {row.name}
            </option>
          {/each}
        </select>
      </div>
      <fieldset class="editor-section">
        <div class="st-typography-medium editor-section-header">Details</div>
        <div style="display: grid">
          <Input>
            <label for="name">Row Name</label>
            <input
              class="st-input w-100"
              name="name"
              autocomplete="off"
              type="string"
              value={$selectedRow.name}
              on:input={updateRowEvent}
            />
          </Input>
        </div>
        <CssGrid columns="1fr 1fr" gap="8px">
          <Input>
            <label for="marginLeft">Row Height</label>
            <input
              disabled={$selectedRow.autoAdjustHeight}
              class="st-input w-100"
              name="height"
              type="number"
              value={$selectedRow.height}
              on:input={updateRowEvent}
            />
          </Input>
          <Input class="row-height-select-wrapper">
            <select
              class="st-select w-100"
              data-type="bool"
              name="autoAdjustHeight"
              value={$selectedRow.autoAdjustHeight}
              on:change={e => {
                const { value } = getTarget(e);
                viewUpdateRow('autoAdjustHeight', value === 'true');
              }}
            >
              <option value={false}>Manual</option>
              <option value={true}>Auto</option>
            </select>
          </Input>
        </CssGrid>
      </fieldset>

      {#if rowHasNonActivityChartLayer}
        <fieldset class="editor-section">
          <div class="editor-section-header editor-section-header-with-button">
            <div class="st-typography-medium">Horizontal Guides</div>
            <button
              on:click={handleNewHorizontalGuideClick}
              use:tooltip={{ content: 'New Horizontal Guide', placement: 'top' }}
              class="st-button icon"
            >
              <PlusIcon />
            </button>
          </div>
          {#if horizontalGuides.length}
            <div class="guides">
              {#each horizontalGuides as horizontalGuide (horizontalGuide.id)}
                <div class="guide">
                  <div class="w-100">
                    <Field
                      field={horizontalGuideFieldsMap[horizontalGuide.id].label}
                      on:change={() => handleUpdateHorizontalGuide(horizontalGuide)}
                    >
                      <input
                        on:keyup={() => handleUpdateHorizontalGuide(horizontalGuide)}
                        autocomplete="off"
                        class="st-input w-100"
                        name="label"
                        placeholder="Label"
                      />
                    </Field>
                  </div>
                  <Field
                    field={horizontalGuideFieldsMap[horizontalGuide.id].y}
                    on:change={() => handleUpdateHorizontalGuide(horizontalGuide)}
                  >
                    <!-- TODO decimal input isn't working correctly.. -->
                    <input autocomplete="off" class="st-input w-100" name="y" placeholder="Y value" type="number" />
                  </Field>
                  <Field
                    field={horizontalGuideFieldsMap[horizontalGuide.id].color}
                    on:change={() => {
                      handleUpdateHorizontalGuide(horizontalGuide);
                    }}
                    on:input={() => {
                      console.log('AAA');
                      handleUpdateHorizontalGuide(horizontalGuide);
                    }}
                  >
                    <input
                      class="editor-color-input"
                      on:input={event => {
                        // console.log('input');
                        // const { name, value } = getTarget(event);
                        // const color = value.toString();
                        // // handleUpdateHorizontalGuide(horizontalGuide);
                        // horizontalGuideFieldsMap[horizontalGuide.id].color.set(color);
                        handleHorizontalGuideColorInputChange(event, horizontalGuide);
                      }}
                      type="color"
                      name="color"
                    />
                  </Field>

                  <Field
                    field={horizontalGuideFieldsMap[horizontalGuide.id].yAxisId}
                    on:change={() => handleUpdateHorizontalGuide(horizontalGuide)}
                  >
                    <!-- <label for="yAxisId" slot="label">Y Axis</label> -->
                    <select
                      class="st-select w-100"
                      data-type="number"
                      name="yAxisId"
                      value={get(horizontalGuideFieldsMap[horizontalGuide.id].yAxisId).value}
                    >
                      {#each $selectedRow.yAxes as axis}
                        <option value={axis.id}>
                          Y Axis {axis.id}
                        </option>
                      {/each}
                    </select>
                  </Field>
                  <button
                    on:click={() => handleDeleteHorizontalGuideClick(horizontalGuide)}
                    use:tooltip={{ content: 'Delete Guide', placement: 'top' }}
                    class="st-button icon"
                  >
                    <TrashIcon />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </fieldset>

        <fieldset class="editor-section">
          <div class="editor-section-header">
            <div class="st-typography-medium">Y Axis Labels</div>
          </div>
          {#if $selectedRow.yAxes.length}
            {#each $selectedRow.yAxes as yAxis (yAxis.id)}
              <div class="yAxisLabel">
                <div class="w-100">
                  <input
                    autocomplete="off"
                    placeholder="Axis label"
                    class="st-input w-100"
                    name="label"
                    type="string"
                    value={yAxis.label.text}
                    on:input={event => {
                      const { value } = getTarget(event);
                      const newRowYAxes = $selectedRow.yAxes.map(axis => {
                        if (axis.id === yAxis.id) {
                          axis.label.text = value.toString();
                        }
                        return axis;
                      });
                      viewUpdateRow('yAxes', newRowYAxes);
                    }}
                  />
                </div>
                <Input>
                  <label for="domainMin">Min</label>
                  <input
                    class="st-input w-100"
                    name="domainMin"
                    type="number"
                    value={yAxis.scaleDomain[0]}
                    on:input={event => updateYAxisScaleDomain(event, yAxis)}
                  />
                </Input>
                <Input>
                  <label for="domainMax">Max</label>
                  <input
                    class="st-input w-100"
                    name="domainMax"
                    type="number"
                    value={yAxis.scaleDomain[1]}
                    on:input={event => updateYAxisScaleDomain(event, yAxis)}
                  />
                </Input>
                <Input>
                  <label for="tickCount">Ticks</label>
                  <input
                    class="st-input w-100"
                    name="tickCount"
                    type="number"
                    value={yAxis.tickCount}
                    on:input={event => updateYAxisTickCount(event, yAxis)}
                  />
                </Input>
              </div>
            {/each}
          {/if}
        </fieldset>
      {/if}
    {/if}
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
  .row .st-button.icon,
  .guide .st-button.icon {
    color: var(--st-gray-50);
  }

  .editor-section-header-with-button {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .editor-section-rows {
    padding: 0;
  }

  .editor-section-rows .editor-section-header {
    padding: 16px 16px 0;
  }

  .rows {
    min-height: 100px;
    outline: none !important;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 16px;
  }

  .row {
    align-items: center;
    display: flex;
    height: 40px;
    justify-content: space-between;
    padding: 0px 16px;
  }

  .drag-icon {
    color: var(--st-gray-50);
    display: none;
    margin-left: -15px;
    margin-top: 0px;
    position: absolute;
  }

  .row:hover,
  .row:active {
    background: var(--st-gray-10);
  }

  .row:hover .drag-icon,
  :global(.test) .drag-icon {
    display: flex;
  }

  .guides {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .guide,
  .yAxisLabel {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .guide :global(fieldset) {
    display: flex;
    padding: 0;
  }
  .guide :global(fieldset select) {
    flex-shrink: 0;
    min-width: max-content;
  }

  .guide :global(fieldset input[type='number']) {
    flex-shrink: 0;
    min-width: 80px;
  }

  .guide :global(.date-picker-field) {
    flex: 1;
  }

  .yAxisLabel :global(.input-stacked) {
    min-width: 80px;
    width: auto;
  }

  .yAxisLabel :global(.input-stacked input) {
    min-width: 32px;
  }

  .section-back-button {
    border-radius: 0;
    gap: 8px;
    height: 32px;
    justify-content: flex-start;
  }

  :global(.input.input-stacked.row-height-select-wrapper) {
    align-items: flex-end;
    display: flex;
  }

  :global(.input.input-stacked.row-height-select-wrapper) {
    align-items: flex-end;
    display: flex;
  }
  .editor-color-input {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: transparent;
    border: none;
    cursor: pointer;
    height: 24px;
    margin: 0;
    padding: 0;
    position: relative;
    width: 24px;
  }
  .editor-color-input:after {
    border: 1px inset rgb(0 0 0 / 25%);
    border-radius: 4px;
    content: ' ';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
  .editor-color-input::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
  .editor-color-input::-moz-color-swatch {
    border: none;
    border-radius: 4px;
  }
  .editor-color-input::-webkit-color-swatch-wrapper {
    border: none;
    border-radius: 4px;
    padding: 0;
  }
</style>
