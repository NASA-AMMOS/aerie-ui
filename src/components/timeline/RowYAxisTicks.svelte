<svelte:options immutable={true} />

<script lang="ts">
  import type { Axis, Layer, LineLayer } from '../../types/timeline';
  import { hexToRgba } from '../../utilities/color';
  import { getYAxisTicks, getYScale } from '../../utilities/timeline';

  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let layers: Layer[];
  export let yAxes: Axis[] = [];

  let ticks: { color: string; values: number[] }[] = [];
  $: if (drawHeight && drawWidth) {
    ticks = [];
    yAxes.forEach(axis => {
      const tickCount = axis.tickCount;
      const scaleDomain = axis.scaleDomain;
      if (
        typeof tickCount === 'number' &&
        tickCount > 0 &&
        axis.renderTickLines &&
        scaleDomain &&
        scaleDomain.length === 2 &&
        typeof scaleDomain[0] === 'number' &&
        typeof scaleDomain[1] === 'number'
      ) {
        const scale = getYScale(scaleDomain as number[], drawHeight);

        // TODO this sort of layer / axis / color association is done in many places - could we have this in a store or higher up?
        let color = 'rgba(210, 210, 210, 1)';
        if (yAxes.length > 1) {
          const yAxisLayers = layers.filter(layer => layer.yAxisId === axis.id && layer.chartType === 'line');
          if (yAxisLayers.length === 1) {
            color = hexToRgba((yAxisLayers[0] as LineLayer).lineColor, 0.3);
          }
        }
        ticks.push({
          color,
          values: getYAxisTicks(scaleDomain as number[], tickCount).map(t => scale(t)),
        });
      }
    });
  }
</script>

<g class="row-y-axis-ticks">
  {#each ticks as tick}
    {#each tick.values as value}
      <g class="tick" opacity="1" transform="translate(0 {value})">
        <line stroke-dasharray="4" stroke={tick.color} x2={drawWidth} />
      </g>
    {/each}
  {/each}
</g>
