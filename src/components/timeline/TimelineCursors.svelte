<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { getDoyTime, getUnixEpochTime } from '../../utilities/time';
  import TimelineCursor from './TimelineCursor.svelte';

  export let cursorEnabled: boolean = true;
  export let cursorHeaderHeight: number = 20;
  export let drawWidth: number = 0;
  export let marginLeft: number = 50;
  export let mouseOver: MouseOver;
  export let histogramCursorTime: Date | null = null;
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let verticalGuides: VerticalGuide[] = [];
  export let timelineId: number;

  console.log('VERTICAL GUIDES?', timelineId, verticalGuides);

  $: onCursorEnableChange(cursorEnabled);
  $: onMouseOver(mouseOver);
  $: onHistogramCursorTime(histogramCursorTime);
  $: onVerticalGuidesChange(verticalGuides, xScaleView);
  $: if (xScaleView) {
    hideCursor();
  }

  let offsetX: number = -1;
  let cursorX: number = null;
  let computedVerticalGuides: { id: number; label: Label; x: number }[] = [];

  function onVerticalGuidesChange(verticalGuides: VerticalGuide[], xScaleView) {
    computedVerticalGuides = verticalGuides.map(verticalGuide => {
      let unixEpochTime = getUnixEpochTime(verticalGuide.timestamp);
      let x = xScaleView(unixEpochTime) + marginLeft - 0.5;
      return {
        id: verticalGuide.id,
        label: verticalGuide.label,
        x,
      };
    });

    console.log('ON VERTICAL GUIDES CHANGE', computedVerticalGuides);
  }

  function onMouseOver(event: MouseOver | undefined) {
    if (event && xScaleView) {
      offsetX = event.e.offsetX;
      updateCursor();
    } else {
      hideCursor();
    }
  }

  function onHistogramCursorTime(date: Date | undefined) {
    if (!cursorEnabled) {
      return;
    }

    let dateWithinView = true;
    if (!xScaleView) {
      dateWithinView = false;
    }

    const viewStart = xScaleView.domain()[0];
    const viewEnd = xScaleView.domain()[1];

    if (date < viewStart || date > viewEnd) {
      dateWithinView = false;
    }

    if (dateWithinView) {
      updateCursor();
    } else {
      hideCursor();
    }
  }

  function onCursorEnableChange(cursorEnabled: boolean) {
    if (cursorEnabled) {
      updateCursor();
    } else {
      hideCursor();
    }
  }

  function updateCursor() {
    if ((cursorEnabled && offsetX >= 0 && offsetX <= drawWidth) || histogramCursorTime) {
      let unixEpochTime = 0;
      let doyTime = '';
      if (histogramCursorTime) {
        unixEpochTime = histogramCursorTime.getTime();
        doyTime = getDoyTime(new Date(unixEpochTime));
        cursorX = xScaleView(unixEpochTime);
      } else {
        unixEpochTime = xScaleView.invert(offsetX).getTime();
        doyTime = getDoyTime(new Date(unixEpochTime));
        cursorX = offsetX;
      }
      cursorX = cursorX + marginLeft - 1;

      // cursorLabelDiv.textContent = doyTime;
      // const cursorLabelWidth = cursorLabelDiv.getBoundingClientRect().width;
      // if (cursorX + cursorLabelWidth + 10 > drawWidth) {
      //   cursorLabelDiv.style.transform = 'translateX(calc(-100% - 10px))';
      // } else {
      //   cursorLabelDiv.style.transform = 'translateX(10px)';
      // }
    } else {
      hideCursor();
    }
  }

  function hideCursor() {
    // if (!cursorDiv) {
    //   return;
    // }
    // cursorDiv.style.opacity = '0';
  }
</script>

<div class="timeline-cursor-margin" style="height: {cursorHeaderHeight}px" />
<div class="timeline-cursor-container">
  <div class="timeline-cursor-header" />
  <TimelineCursor x={cursorX} />
  {#each computedVerticalGuides as guide}
    <TimelineCursor x={guide.x} />
  {/each}
</div>

<style>
  .timeline-cursor-margin {
    position: relative;
  }

  .timeline-cursor-container {
    height: 100%;
    pointer-events: none;
    position: absolute;
    width: 100%;
  }

  .timeline-cursor-header {
    height: 1rem;
    position: relative;
  }
</style>
