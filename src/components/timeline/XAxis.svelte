<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import ConstraintViolations from './ConstraintViolations.svelte';
  import XAxisVerticalGuides from './XAxisVerticalGuides.svelte';

  export let constraintViolations: ConstraintViolation[] = [];
  export let drawHeight: number = 70;
  export let drawWidth: number = 0;
  export let marginLeft: number = 50;
  export let verticalGuides: VerticalGuide[] = [];
  export let viewTimeRange: TimeRange | null = null;
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let xTicksView: XAxisTick[] = [];

  let axisOffset = 12;
  let violationsOffset = 16;
  let verticalGuidesOffset = 10;
  // let timeInterval = 31556952000; // 1 year in MS
  // let duration = xScaleView.domain()[1].getTime() - xScaleView.domain()[0].getTime();

  // $: if (xTicksView) {
  //   if (xTicksView.length > 1) {
  //     console.log(xTicksView[1].date.getTime() - xTicksView[0].date.getTime());
  //   }
  // }

  // let g1: SVGGElement;
  // let g2: SVGGElement;

  // $: if (drawWidth && viewTimeRange) {
  //   axis1(xScaleView).ticks(10, '%H:%S').tickSize(0).render();
  //   axis2(xScaleView).ticks(10, '%Y:%S').tickSize(0).render();
  // }

  // function axis1(scale) {
  //   return Object.assign(axisBottom(scale.range([0, drawWidth])), {
  //     render() {
  //       return select(g1).attr('viewBox', [0, -10, drawWidth, 33]).call(this).node();
  //     },
  //   });
  // }
  // function axis2(scale) {
  //   return Object.assign(axisBottom(scale.range([0, drawWidth])), {
  //     render() {
  //       return select(g2).attr('viewBox', [0, -10, drawWidth, 33]).call(this).node();
  //     },
  //   });
  // }
</script>

<svg style="height: {drawHeight}px;">
  <g transform="translate({marginLeft}, 0)">
    <g transform="translate(0, {violationsOffset})">
      <ConstraintViolations
        {constraintViolations}
        mousemove={undefined}
        mouseout={undefined}
        {drawHeight}
        {drawWidth}
        {viewTimeRange}
        {xScaleView}
      />
    </g>
    <g transform="translate(0, {verticalGuidesOffset})">
      <XAxisVerticalGuides {drawHeight} {drawWidth} {verticalGuides} {viewTimeRange} {xScaleView} />
    </g>
    <g transform="translate(0, {axisOffset})">
      <!-- <g class="axis test" bind:this={g1} />
      <g class="axis test2" bind:this={g2} /> -->
      <g fill="none" class="ticks" text-anchor="left">
        {#if drawWidth > 0}
          {#each xTicksView as tick, index}
            {#if index % 5 === 0}
              <g class="tick st-typography-label" transform="translate({xScaleView(tick.date)}, 0)">
                <text fill="currentColor" dy="0.5em">{tick.yearDay}</text>
              </g>
            {/if}
            <g class="tick st-typography-body" transform="translate({xScaleView(tick.date)}, 20)">
              <text fill="currentColor" dy="0.5em">{tick.time}</text>
            </g>
          {/each}
        {/if}
      </g>
    </g>
  </g>
</svg>

<style>
  svg {
    height: 100%;
    width: 100%;
  }

  text {
    pointer-events: none;
    user-select: none;
  }

  .ticks {
    font-family: Inter, Helvetica, Sans-Serif;
    font-size: 11px;
  }

  /* .axis :global(.domain) {
    display: none;
  }

  .test2 {
    transform: translateY(-20px);
  } */
</style>
