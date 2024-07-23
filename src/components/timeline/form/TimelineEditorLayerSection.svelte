<svelte:options immutable={true} />

<script lang="ts">
  // added to provide reactivity to filter options

  import TrashIcon from '@nasa-jpl/stellar/icons/trash.svg?component';
  import { createEventDispatcher } from 'svelte';
  import { derived } from 'svelte/store';
  import { derivationGroups, selectedPlanDerivationGroupIds } from '../../../stores/external-source';
  import { activityTypes } from '../../../stores/plan';
  import { externalResourceNames, resourceTypes } from '../../../stores/simulation';
  import type { Axis, Layer, XRangeLayerColorScheme } from '../../../types/timeline';
  import { getTarget } from '../../../utilities/generic';
  import { isActivityLayer, isExternalEventLayer, isLineLayer, isXRangeLayer } from '../../../utilities/timeline';
  import { tooltip } from '../../../utilities/tooltip';
  import ColorPresetsPicker from '../../form/ColorPresetsPicker.svelte';
  import ColorSchemePicker from '../../form/ColorSchemePicker.svelte';
  import CssGrid from '../../ui/CssGrid.svelte';
  import TimelineEditorLayerFilter from './TimelineEditorLayerFilter.svelte';
  import TimelineEditorLayerSelectedFilters from './TimelineEditorLayerSelectedFilters.svelte';
  import TimelineEditorLayerSettings from './TimelineEditorLayerSettings.svelte';

  export let layer: Layer;
  export let yAxes: Axis[];

  const dispatch = createEventDispatcher<{
    handleUpdateLayerFilter: { values: string[] };
    handleUpdateLayerProperty: { name: string; value: string | number | boolean | null };
    handleUpdateLayerChartType: { value: string | number | boolean | null };
    handleUpdateLayerColor: { value: string };
    handleUpdateLayerColorScheme: { value: XRangeLayerColorScheme };
    handleDeleteLayerClick: {};
  }>();

  let initialColoring: string | undefined = isActivityLayer(layer)
    ? layer.activityColor
    : isExternalEventLayer(layer)
      ? layer.externalEventColor
      : isLineLayer(layer)
        ? layer.lineColor
        : isXRangeLayer(layer)
          ? layer.colorScheme
          : undefined; // getColorForLayer

  // make this a "derived" so that it reacts to $derivationGroups and $selectedPlanDerivationGroupIds, whenever either changes (i.e. new dg or associated derivation groups change)
  let validEventTypes = derived(
    [derivationGroups, selectedPlanDerivationGroupIds],
    ([$derivationGroups, $selectedPlanDerivationGroupIds]) => {
      return $derivationGroups
        .filter(dg => $selectedPlanDerivationGroupIds.includes(dg.source_type_id))
        .map(dg => dg.event_types)
        .reduce((acc, curr) => acc.concat(curr), []);
    },
  ); //$derivationGroups.filter(dg => $selectedPlanDerivationGroupIds.includes(dg.source_type_id)).map(dg => dg.event_types).reduce((acc, curr) => acc.concat(curr), []);

  let filterOptions: string[] = [];
  let filterValues: string[] = [];

  $: {
    // getFilterOptionsForLayer
    if (isActivityLayer(layer)) {
      filterOptions = $activityTypes.map(t => t.name);
    } else if (isExternalEventLayer(layer)) {
      filterOptions = $validEventTypes;
    } else if (isLineLayer(layer) || isXRangeLayer(layer)) {
      filterOptions = $resourceTypes
        .map(t => t.name)
        .concat($externalResourceNames)
        .sort();
    }
  }

  $: {
    // getFilterValuesForLayer
    if (isActivityLayer(layer)) {
      const activityLayer = layer;
      const activityTypes = activityLayer.filter?.activity?.types ?? [];
      filterValues = [...activityTypes];
    } else if (isExternalEventLayer(layer)) {
      // NOTE: if a derivation group is disabled, this doesn't get invoked and does not update. however, on dissociation it does.
      const externalEventLayer = layer;
      const externalEventTypes =
        externalEventLayer.filter?.externalEvent?.event_types.filter(et => $validEventTypes.includes(et)) ?? [];
      filterValues = [...externalEventTypes];
    } else if (isLineLayer(layer) || isXRangeLayer(layer)) {
      const resourceLayer = layer;
      const resourceNames = resourceLayer.filter?.resource?.names ?? [];
      filterValues = [...resourceNames];
    }
  }

  function handleDeleteLayerFilterValue(value: string) {
    const values = filterValues.filter(i => value !== i);
    dispatch('handleUpdateLayerFilter', { values }); // dispatch update layer filter here with newValues
  }
</script>

<div>
  <CssGrid columns="1fr 0.75fr 24px 24px 24px" gap="8px" class="editor-section-grid">
    <TimelineEditorLayerFilter
      values={filterValues}
      bind:options={filterOptions}
      {layer}
      on:change={event => {
        const { values } = event.detail;
        dispatch('handleUpdateLayerFilter', { values });
      }}
    />
    <select
      class="st-select w-100"
      name="chartType"
      value={layer.chartType}
      on:change={event => dispatch('handleUpdateLayerChartType', { value: getTarget(event).value })}
    >
      <option value="activity">Activity</option>
      <option value="line">Line</option>
      <option value="x-range">X-Range</option>
      <option value="external-event">External Event</option>
    </select>
    <TimelineEditorLayerSettings
      {layer}
      on:input={event => dispatch('handleUpdateLayerProperty', { name: event.detail.name, value: event.detail.value })}
      on:delete={() => dispatch('handleDeleteLayerClick', {})}
      {yAxes}
    />

    {#if isActivityLayer(layer)}
      <ColorPresetsPicker
        presetColors={[
          '#FFD1D2',
          '#FFCB9E',
          '#fcdd8f',
          '#CAEBAE',
          '#C9E4F5',
          '#F8CCFF',
          '#ECE0F2',
          '#E8D3BE',
          '#F5E9DA',
          '#EBEBEB',
        ]}
        tooltipText="Layer Color"
        value={initialColoring}
        on:input={event => dispatch('handleUpdateLayerColor', { value: event.detail.value })}
      />
    {:else if isLineLayer(layer)}
      <ColorPresetsPicker
        presetColors={[
          '#e31a1c',
          '#ff7f0e',
          '#fcbd21',
          '#75b53b',
          '#3C95C9',
          '#8d41b0',
          '#CAB2D6',
          '#a67c52',
          '#E8CAA2',
          '#7f7f7f',
        ]}
        tooltipText="Layer Color"
        value={initialColoring}
        on:input={event => dispatch('handleUpdateLayerColor', { value: event.detail.value })}
      />
    {:else if isXRangeLayer(layer)}
      <ColorSchemePicker
        layout="compact"
        value={initialColoring}
        on:input={event => dispatch('handleUpdateLayerColorScheme', { value: event.detail.value })}
      />
    {:else if isExternalEventLayer(layer)}
      <ColorPresetsPicker
        presetColors={[
          '#FFD1D2',
          '#FFCB9E',
          '#fcdd8f',
          '#CAEBAE',
          '#C9E4F5',
          '#F8CCFF',
          '#ECE0F2',
          '#E8D3BE',
          '#F5E9DA',
          '#EBEBEB',
        ]}
        tooltipText="Layer Color"
        value={initialColoring}
        on:input={event => dispatch('handleUpdateLayerColor', { value: event.detail.value })}
      />
    {/if}

    <button
      on:click={() => dispatch('handleDeleteLayerClick', {})}
      use:tooltip={{ content: 'Delete Layer', placement: 'top' }}
      class="st-button icon"
    >
      <TrashIcon />
    </button>
  </CssGrid>
  <TimelineEditorLayerSelectedFilters
    chartType={layer.chartType}
    filters={filterValues}
    on:remove={event => handleDeleteLayerFilterValue(event.detail.filter)}
  />
</div>

<style>
  :global(.editor-section-grid form) {
    display: grid;
  }

  :global(.editor-section-grid) {
    align-items: center;
    flex: 1;
    position: relative;
    width: 100%;
  }

  :global(.editor-section-grid-labels > *) {
    min-width: 40px;
  }

  :global(.input.input-stacked.editor-input) {
    display: grid;
    min-width: 40px;
    width: auto;
  }

  :global(.input.input-stacked.editor-input label) {
    display: none;
  }

  :global(.input.input-inline.editor-input) {
    grid-template-columns: 60px auto;
    padding: 0;
  }
</style>
