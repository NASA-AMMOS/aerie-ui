<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import type { XAxisTick } from '../../types/timeline';

  export let drawHeight: number = 0;
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let xTicksView: XAxisTick[] = [];
</script>

<g class="row-x-axis-ticks">
  {#each xTicksView as tick}
    <g class="tick" opacity="1" transform="translate({xScaleView?.(tick.date)}, 0)">
      <line stroke="rgba(230, 230, 230, 1)" y2={drawHeight} />
    </g>
  {/each}
</g>
