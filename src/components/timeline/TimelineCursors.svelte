<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { select } from 'd3-selection';
  import { getDoyTime } from '../../utilities/time';

  export let mouseOver: MouseOver;
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let marginLeft: number = 50;
  export let drawWidth: number = 0;

  $: onMouseOver(mouseOver);

  let raf: number = null;

  function onMouseOver(event: MouseOver | undefined) {
    if (event && xScaleView) {
      const { offsetX } = event.e;
      const unixEpochTime = xScaleView.invert(offsetX).getTime();
      const doyTime = getDoyTime(new Date(unixEpochTime));
      cancelAnimationFrame(raf);

      if (offsetX >= 0 && offsetX <= drawWidth) {
        raf = window.requestAnimationFrame(() => {
          const cursorDiv = getCursor();
          const cursorLabel = cursorDiv.select('.timeline-cursor-label').node() as HTMLElement;
          cursorLabel.textContent = doyTime;
          const cursorLabelWidth = cursorLabel.getBoundingClientRect().width;
          if (offsetX + cursorLabelWidth + 10 > drawWidth) {
            cursorLabel.style.left = 'calc(-100% - 10px)';
          } else {
            cursorLabel.style.left = '10px';
          }
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
  <div class="timeline-cursor-header" />
  <div class="timeline-cursor">
    <div class="timeline-cursor-label" />
  </div>
  <slot />
</div>

<style>
  .timeline-cursor-container {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .timeline-cursor-header {
    height: 1rem;
    position: relative;
  }

  .timeline-cursor {
    height: calc(100% + 0.5rem);
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 0.5rem;
    transform: translateX(0);
  }

  .timeline-cursor::before {
    background-color: var(--st-gray-50);
    border-radius: 100%;
    content: '';
    display: block;
    height: 9px;
    left: -4px;
    position: absolute;
    top: -0.5rem;
    width: 9px;
  }

  .timeline-cursor::after {
    background-color: var(--st-gray-50);
    content: '';
    display: block;
    height: 100%;
    left: 0;
    position: absolute;
    top: -0.5rem;
    width: 1px;
  }

  .timeline-cursor-label {
    font-size: 10px;
    left: 10px;
    position: relative;
    top: -11px;
    white-space: nowrap;
  }
</style>
