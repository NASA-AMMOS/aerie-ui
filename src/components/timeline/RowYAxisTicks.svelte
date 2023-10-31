<svelte:options immutable={true} />

<script lang="ts">
  import type { Axis } from '../../types/timeline';
  import { getYAxisTicks, getYScale } from '../../utilities/timeline';

  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let yAxes: Axis[] = [];

  let ticks: number[] = [];
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
        ticks = getYAxisTicks(scaleDomain as number[], tickCount).map(t => scale(t));
      }
    });
  }
</script>

<g class="row-y-axis-ticks">
  {#each ticks as tick}
    <g class="tick" opacity="1" transform="translate(0 {tick})">
      <line stroke-dasharray="4" stroke="rgba(210, 210, 210, 1)" x2={drawWidth} />
    </g>
  {/each}
</g>
