<script lang="ts">
  import Field from '../../form/Field.svelte';
  import type { Layer, LineLayer } from '../../../types';
  import Grid from '../../ui/Grid.svelte';

  export let layer: Layer | null;

  $: lineLayer = layer as LineLayer | null;
</script>

{#if lineLayer && lineLayer.chartType === 'line'}
  <Field>
    <label for="yAxisId">Y-Axis Id</label>
    <input
      class="st-input w-100"
      name="yAxisId"
      type="number"
      value={lineLayer.yAxisId}
      on:input
    />
  </Field>

  <Grid columns="33% 33% 33%">
    <Field>
      <label for="lineColor">Line Color</label>
      <input
        class="w-100"
        name="lineColor"
        type="color"
        value={lineLayer.lineColor}
        on:input
      />
    </Field>
    <Field>
      <label for="lineWidth">Line Width</label>
      <input
        class="st-input w-100"
        name="lineWidth"
        type="number"
        value={lineLayer.lineWidth}
        on:input
      />
    </Field>
    <Field>
      <label for="pointRadius">Point Radius</label>
      <input
        class="st-input w-100"
        name="pointRadius"
        type="number"
        value={lineLayer.pointRadius}
        on:input
      />
    </Field>
  </Grid>
{/if}
