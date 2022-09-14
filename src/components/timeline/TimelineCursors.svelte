<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { select } from 'd3-selection';
  // import { getDoyTime } from '../../utilities/time';

  export let mouseOver: MouseOver;
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let marginLeft: number = 50;

  $: onMouseOver(mouseOver);

  let raf: number = null;

  function onMouseOver(event: MouseOver | undefined) {
    if (event && xScaleView) {
      const { offsetX } = event.e;
      // const unixEpochTime = xScaleView.invert(offsetX).getTime();
      // const doyTime = getDoyTime(new Date(unixEpochTime));
      cancelAnimationFrame(raf);

      if (offsetX >= 0) {
        raf = window.requestAnimationFrame(() => {
          const cursorDiv = getCursor();
          cursorDiv.style('opacity', 1.0).style('transform', `translateX(${offsetX + marginLeft - 1}px)`);
        });
      } else {
        raf = window.requestAnimationFrame(() => {
          const cursorDiv = getCursor();
          cursorDiv.style('opacity', 0);
        });
      }
    }
  }

  function getCursor() {
    const cursorDiv = select(`.timeline-cursor`);
    if (cursorDiv.empty()) {
      const body = select('body');
      return body.append('div').attr('class', 'timeline-cursor');
    } else {
      return cursorDiv;
    }
  }
</script>

<div class="timeline-cursor-container">
  <div class="timeline-cursor" />
  <slot />
</div>

<style>
  .timeline-cursor-container {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .timeline-cursor {
    background-color: var(--st-gray-50);
    height: 100%;
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    transform: translateX(0);
    width: 1px;
  }
</style>
