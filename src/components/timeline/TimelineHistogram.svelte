<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { createEventDispatcher } from 'svelte';
  import { activityPoints } from '../../stores/activities';
  import { getDoyTime } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';

  export let constraintViolations: ConstraintViolation[] = [];
  export let drawWidth: number = 0;
  export let marginLeft: number = 50;
  export let mouseOver: MouseOver;
  export let rows: Row[] = [];
  export let viewTimeRange: TimeRange | null = null;
  export let xScaleMax: ScaleTime<number, number> | null = null;
  export let xScaleView: ScaleTime<number, number> | null = null;

  const dispatch = createEventDispatcher();

  let histogramContainer: HTMLDivElement;
  let timeSelectorContainer: HTMLDivElement;
  let left = 0;
  let width = 0;
  let moving = false;
  let resizingLeft = false;
  let resizingRight = false;
  let minWidth = 10;
  let activityHistValues: number[] = [];
  let constraintHistValues: number[] = [];
  let activityHistMin = 0;
  let activityHistMax = 0;
  let constraintViolationMin = 0;
  let constraintViolationMax = 0;
  let numBinsMax = 300;
  let numBinsMin = 50;
  let cursorVisible = false;
  let cursorLeft = 0;
  let cursorTooltip = '';
  let timelineHovering = false;
  let filteredActivityPoints: ActivityPoint[] = [];

  $: numBins = Math.max(Math.min(numBinsMax, parseInt((drawWidth / 5).toString())), numBinsMin);

  // TODO what to do when an activity falls outside of min/max range by dragging? Ex act with a long duration can extend past plan range.
  // Or is this an issue outside of this histogram?

  // Derive activities to render in activity histogram by
  // ORing the regexp filters of all found activity rows
  $: if (rows) {
    filteredActivityPoints = [];
    // Collect all activity layers
    const activityLayers: Layer[] = [];
    rows.forEach(row => {
      row.layers.forEach(layer => {
        if (layer.chartType === 'activity') {
          activityLayers.push(layer);
        }
      });
    });

    // Create an aggregate RegExp using all the filters
    let filters = [];
    activityLayers.forEach(l => {
      if (l.filter && l.filter.activity?.type) {
        filters.push(l.filter.activity?.type);
      } else {
        // TODO chat about what to do here
        filters.push('.*');
      }
    });
    const r = new RegExp(`(${filters.join('|')})`);

    // Bin filtered activities
    for (const point of $activityPoints) {
      // TODO test this more
      const includeActivity = r.test(point?.label?.text);
      if (includeActivity) {
        filteredActivityPoints.push(point);
      }
    }
  }

  $: if (mouseOver && mouseOver.e.offsetX >= 0 && mouseOver.e.offsetX <= drawWidth) {
    const unixEpochTime = xScaleView.invert(mouseOver.e.offsetX).getTime();
    cursorLeft = xScaleMax(unixEpochTime);
    cursorVisible = true;
  } else {
    cursorVisible = false;
  }

  $: windowMax = xScaleMax?.range()[0];
  $: windowMin = xScaleMax?.range()[1];

  $: if (viewTimeRange) {
    const extent = [new Date(viewTimeRange.start), new Date(viewTimeRange.end)].map(xScaleMax);
    left = extent[0];
    width = extent[1] - extent[0];
  }

  $: if (xScaleMax || $activityPoints) {
    activityHistValues = [];
    const startTime = xScaleMax.invert(windowMax).getTime();
    const endTime = xScaleMax.invert(windowMin).getTime();

    const binSize = (endTime - startTime) / numBins - 1;

    activityHistValues = Array(numBins).fill(0);
    filteredActivityPoints.forEach(point => {
      const start = point.x;

      // Figure out which start bin this is in
      const startBin = Math.floor((start - startTime) / binSize);
      activityHistValues[startBin]++;

      // Figure out which other bins this value is in
      const x = Math.floor(point.duration / binSize);
      for (let i = 1; i < x; i++) {
        activityHistValues[startBin + i]++;
      }
    });

    // const histGenerator = bin()
    //   .domain([startTime, endTime]) // Set the domain to cover the entire intervall [0,1]
    //   .thresholds([...Array(numBins)].map((item, i) => startTime + binSize * i)); // number of thresholds; this will create 19+1 bins
    // const activityHist = histGenerator(filteredActivityPoints.map(ap => ap.x));
    // console.log('Act hist', activityHist);
    // activityHistValues = activityHist.map(x => x.length);
    activityHistMin = Math.min(...activityHistValues);
    activityHistMax = Math.max(...activityHistValues);

    constraintHistValues = Array(numBins).fill(0);
    constraintViolations.forEach(violation => {
      violation.windows.forEach(w => {
        console.log(w, 'w');
        const start = w.start;
        const duration = w.end - w.start;

        // Figure out which start bin this is in
        const startBin = Math.floor((start - startTime) / binSize);
        constraintHistValues[startBin]++;

        // Figure out which other bins this value is in
        const x = Math.floor(duration / binSize);
        for (let i = 1; i < x; i++) {
          constraintHistValues[startBin + i]++;
        }
      });
    });

    constraintViolationMin = Math.min(...constraintHistValues);
    constraintViolationMax = Math.max(...constraintHistValues);
  }

  function onTimelineBackgroundMouseDown(e: MouseEvent) {
    // Center the slider on the time
    const offsetX = e.offsetX;
    const unixEpochTime = xScaleMax.invert(offsetX).getTime();
    const startDate = new Date(viewTimeRange.start).getTime();
    const endDate = new Date(viewTimeRange.end).getTime();
    const unixEpochTimeDuration = endDate - startDate;
    let newStartTime = unixEpochTime - unixEpochTimeDuration / 2;
    let newEndTime = unixEpochTime + unixEpochTimeDuration / 2;

    // Ensure slider is within bounds
    const windowStartTime = xScaleMax.invert(windowMax).getTime();
    const windowEndTime = xScaleMax.invert(windowMin).getTime();
    if (unixEpochTimeDuration > windowEndTime - windowStartTime) {
      // Cover case where window could be unexpectedly large
      newStartTime = windowStartTime;
      newEndTime = windowEndTime;
    } else if (newStartTime < windowStartTime) {
      newStartTime = windowStartTime;
      newEndTime = newStartTime + unixEpochTimeDuration;
    } else if (newEndTime > windowEndTime) {
      newEndTime = windowEndTime;
      newStartTime = newEndTime - unixEpochTimeDuration;
    }

    const newViewTimeRange = { end: newEndTime, start: newStartTime };
    dispatch('viewTimeRangeChanged', newViewTimeRange);
  }

  function onSelectorMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    moving = true;
    resizingLeft = false;
    resizingRight = false;
  }

  function onHandleMouseDownLeft(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    resizingLeft = true;
    resizingRight = false;
    moving = false;
  }

  function onHandleMouseDownRight(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    resizingLeft = false;
    resizingRight = true;
    moving = false;
  }

  function onMouseMove(e: MouseEvent) {
    const histRect = histogramContainer.getBoundingClientRect();
    const mouseWithinVerticalHistogramBounds = e.x >= histRect.x && e.x <= histRect.right;
    const mouseWithinHorizontalHistogramBounds = e.y >= histRect.y && e.y <= histRect.bottom;

    if (mouseWithinVerticalHistogramBounds && mouseWithinHorizontalHistogramBounds) {
      timelineHovering = true;
      cursorLeft = e.x - histRect.left;
      cursorTooltip = getDoyTime(xScaleMax.invert(cursorLeft), false);
    } else {
      timelineHovering = false;
    }

    if (mouseWithinVerticalHistogramBounds) {
      const sliderRect = timeSelectorContainer.getBoundingClientRect();
      if (moving) {
        if (sliderRect.left + e.movementX < histRect.left) {
          left = 0;
        } else if (sliderRect.right + e.movementX > histRect.right) {
          left = histRect.width - sliderRect.width;
        } else {
          left += e.movementX;
        }
      } else if (resizingLeft) {
        if (!(sliderRect.left + e.movementX < histRect.left)) {
          if (sliderRect.width - e.movementX > minWidth) {
            if (e.movementX < 0) {
              width = sliderRect.width + Math.abs(e.movementX);
              left -= Math.abs(e.movementX);
            } else {
              width = sliderRect.width - Math.abs(e.movementX);
              left += Math.abs(e.movementX);
            }
          } else {
            width = sliderRect.width;
          }
        }
      } else if (resizingRight) {
        if (!(sliderRect.right + e.movementX > histRect.right)) {
          if (sliderRect.width + e.movementX >= minWidth) {
            width = sliderRect.width + e.movementX;
          } else {
            width = sliderRect.width;
          }
        }
      }
    }
  }

  function onMouseUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (moving || resizingLeft || resizingRight) {
      const unixEpochTimeMin = xScaleMax.invert(left).getTime();
      const unixEpochTimeMax = xScaleMax.invert(left + width).getTime();
      const doyTimeMin = new Date(unixEpochTimeMin);
      const doyTimeMax = new Date(unixEpochTimeMax);

      const newViewTimeRange = { end: doyTimeMax.getTime(), start: doyTimeMin.getTime() };
      dispatch('viewTimeRangeChanged', newViewTimeRange);
    }

    moving = false;
    resizingLeft = false;
    resizingRight = false;
  }
</script>

<div
  bind:this={histogramContainer}
  class="timeline-histogram"
  style={`margin-left: ${marginLeft}px; width: ${drawWidth}px`}
>
  <div on:click={onTimelineBackgroundMouseDown} class="timeline-histogram-background" />
  <div
    use:tooltip={{
      content: cursorTooltip,
      hideOnClick: false,
      placement: 'top',
      showOnInit: true,
      triggerTarget: histogramContainer,
    }}
    class="timeline-histogram-cursor"
    style={`left: ${cursorLeft}px;`}
    hidden={!cursorVisible && !timelineHovering}
  />

  <div class="histogram blue">
    {#each activityHistValues as bin}
      <div class="bin" style={`height: ${(bin / activityHistMax) * 100}%;`} />
    {/each}
  </div>
  <div class="histogram red">
    {#each constraintHistValues as bin}
      <div class="bin" style={`height: ${(bin / constraintViolationMax) * 100}%;`} />
    {/each}
  </div>

  {#if drawWidth > 0}
    <div
      bind:this={timeSelectorContainer}
      on:mousedown={onSelectorMouseDown}
      style="left: {left}px; width: {width}px;"
      class="timeline-selector"
      class:dragging={moving}
    >
      <div class:resizing={resizingLeft} on:mousedown={onHandleMouseDownLeft} class="time-selector-handle left" />
      <div class:resizing={resizingRight} on:mousedown={onHandleMouseDownRight} class="time-selector-handle right" />
    </div>
  {/if}
</div>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
  .timeline-histogram {
    background: var(--st-white);
    display: flex;
    flex-direction: row;
    flex-direction: column;
    gap: 3px;
    height: 39px;
    justify-content: center;
    position: relative;
  }

  .timeline-histogram-background {
    cursor: pointer;
    height: 100%;
    position: absolute;
    width: 100%;
    z-index: 0;
  }

  .timeline-histogram-cursor {
    background-color: var(--st-gray-50);
    cursor: move;
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 1px;
    z-index: 0;
  }

  .timeline-selector {
    align-items: center;
    border: solid 1px gray;
    border-radius: 4px;
    cursor: move;
    display: flex;
    height: 39px;
    justify-content: space-between;
    position: absolute;
    top: 0;
    user-select: none;
    width: 100px;
    z-index: 1;
  }

  .timeline-selector:not(.dragging):hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .dragging {
    background: rgba(0, 0, 0, 0.05);
  }

  .time-selector-handle {
    background: white;
    border: 1px solid black;
    border-radius: 2px;
    border-radius: 4px;
    cursor: col-resize;
    height: 21px;
    width: 5px;
  }

  .time-selector-handle:not(.resizing):hover {
    background: #e0e0e0;
  }

  .time-selector-handle.resizing {
    background: #bdbbbb;
  }

  .time-selector-handle.left {
    margin-left: -3px;
  }

  .time-selector-handle.right {
    margin-right: -3px;
  }

  .histogram {
    align-items: flex-end;
    border-bottom: 1px solid var(--st-gray-20);
    display: flex;
    flex-direction: row;
    gap: 1px;
    height: 16px;
  }

  .histogram.red .bin {
    background: rgba(235, 87, 87, 1);
  }

  .histogram.blue .bin {
    background: rgba(47, 128, 237, 1);
  }

  .bin {
    flex: 1;
    width: 2px;
  }
</style>
