<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { createEventDispatcher } from 'svelte';
  import { activityPoints } from '../../stores/activities';
  import { getDoyTime } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';

  export let constraintViolations: ConstraintViolation[] = [];
  export let drawHeight: number = 39;
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
  let movingSlider = false;
  let resizingSliderLeft = false;
  let resizingSliderRight = false;
  let minWidth = 10;
  let activityHistValues: number[] = [];
  let constraintHistValues: number[] = [];
  let activityHistMax = 0;
  let constraintViolationMax = 0;
  let numBinsMax = 300;
  let numBinsMin = 50;
  let cursorVisible = false;
  let cursorLeft = 0;
  let cursorTooltip = '';
  let timelineHovering = false;
  let drawingRange = false;
  let drawRangeDistance = 0;
  let drawingPivotLeft = 0;
  let filteredActivityPoints: ActivityPoint[] = [];

  $: histogramHeight = (drawHeight / 5) * 2;
  $: selectorHandleHeight = (drawHeight / 1.9).toFixed();

  $: numBins = Math.max(Math.min(numBinsMax, parseInt((drawWidth / 5).toString())), numBinsMin);

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

  // Update histograms if xScaleMax, activities, or constraint violation changes
  $: if (xScaleMax || filteredActivityPoints || constraintViolations) {
    activityHistValues = [];
    const windowStartTime = xScaleMax.invert(windowMax).getTime();
    const windowEndTime = xScaleMax.invert(windowMin).getTime();
    const binSize = (windowEndTime - windowStartTime) / numBins - 1;

    // Compute activity histogram
    activityHistValues = Array(numBins).fill(0);
    filteredActivityPoints.forEach(point => {
      // Filter out points that do not fall within the plan bounds at all
      if (point.x > windowEndTime || point.x + point.duration < windowStartTime) {
        return;
      }

      // Figure out which start bin this is in
      const startBin = Math.floor((point.x - windowStartTime) / binSize);
      activityHistValues[startBin]++;

      // Figure out which other bins this value is in
      const x = Math.floor(point.duration / binSize) + 1;
      for (let i = 1; i < x; i++) {
        if (startBin + i >= activityHistValues.length) {
          return;
        }
        activityHistValues[startBin + i]++;
      }
    });

    activityHistMax = Math.max(...activityHistValues);

    // Compute constraint violations histogram
    constraintHistValues = Array(numBins).fill(0);
    constraintViolations.forEach(violation => {
      violation.windows.forEach(w => {
        const start = w.start;
        const duration = w.end - w.start;

        // Filter out points that do not fall within the plan bounds at all
        if (start > windowEndTime || start + duration < windowStartTime) {
          return;
        }

        // Figure out which start bin this is in
        const startBin = Math.floor((start - windowStartTime) / binSize);
        constraintHistValues[startBin]++;

        // Figure out which other bins this value is in
        const x = Math.floor(duration / binSize) + 1;
        for (let i = 1; i < x; i++) {
          if (startBin + i >= constraintHistValues.length) {
            return;
          }

          constraintHistValues[startBin + i]++;
        }
      });
    });

    constraintViolationMax = Math.max(...constraintHistValues);
  }

  function onTimelineBackgroundMouseDown(e: MouseEvent) {
    drawingRange = true;
    drawRangeDistance = 0;
    drawingPivotLeft = e.offsetX;
  }

  function onTimelineBackgroundClick(e: MouseEvent) {
    // Center the slider on the time
    const offsetX = e.offsetX;
    const unixEpochTime = xScaleMax.invert(offsetX).getTime();
    const startDate = new Date(viewTimeRange.start).getTime();
    const endDate = new Date(viewTimeRange.end).getTime();
    const unixEpochTimeDuration = endDate - startDate;

    // Center slider on user's mouse position
    let newStartTime = unixEpochTime - unixEpochTimeDuration / 2;
    let newEndTime = unixEpochTime + unixEpochTimeDuration / 2;

    // Ensure slider is within bounds
    const windowStartTime = xScaleMax.invert(windowMax).getTime();
    const windowEndTime = xScaleMax.invert(windowMin).getTime();
    if (unixEpochTimeDuration > windowEndTime - windowStartTime) {
      // Cover case where duration could be unexpectedly large
      newStartTime = windowStartTime;
      newEndTime = windowEndTime;
    } else if (newStartTime < windowStartTime) {
      // Case where slider comes before entire window time range
      newStartTime = windowStartTime;
      newEndTime = newStartTime + unixEpochTimeDuration;
    } else if (newEndTime > windowEndTime) {
      // Case where slider comes after entire window time range
      newEndTime = windowEndTime;
      newStartTime = newEndTime - unixEpochTimeDuration;
    }

    const newViewTimeRange = { end: newEndTime, start: newStartTime };
    dispatch('viewTimeRangeChanged', newViewTimeRange);
  }

  function onSelectorMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    movingSlider = true;
    resizingSliderLeft = false;
    resizingSliderRight = false;
  }

  function onHandleMouseDownLeft(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    resizingSliderLeft = true;
    resizingSliderRight = false;
    movingSlider = false;
  }

  function onHandleMouseDownRight(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    resizingSliderLeft = false;
    resizingSliderRight = true;
    movingSlider = false;
  }

  function onMouseMove(e: MouseEvent) {
    const histRect = histogramContainer.getBoundingClientRect();
    const mouseWithinLeftHorizontalHistogramBounds = e.x >= histRect.x;
    const mouseWithinRightHorizontalHistogramBounds = e.x <= histRect.right;
    const mouseWithinHorizontalHistogramBounds =
      mouseWithinLeftHorizontalHistogramBounds && mouseWithinRightHorizontalHistogramBounds;
    const mouseWithinVerticalHistogramBounds = e.y >= histRect.y && e.y <= histRect.bottom;

    // Check if mouse is within histogram position bounds
    if (mouseWithinVerticalHistogramBounds && mouseWithinHorizontalHistogramBounds) {
      // Update hover cursor
      timelineHovering = true;
      cursorLeft = e.x - histRect.left;
      const cursorTime = xScaleMax.invert(cursorLeft);
      cursorTooltip = getDoyTime(cursorTime, false);

      // Only dispatch a cursor change if we're just hovering
      if (!movingSlider && !drawingRange && !resizingSliderLeft && !resizingSliderRight) {
        dispatch('cursorTimeChange', cursorTime);
      }

      // Handle time range drawing
      if (drawingRange) {
        drawRangeDistance += Math.abs(e.movementX);
        // Ensure user has drawn at least a pixel to differentiate between
        // ranges ranges and centering the slider on click
        if (isDrawingRangeInProgress()) {
          // Determine new slider position, allow user to move left or right of the pivot point
          if (cursorLeft - drawingPivotLeft < 0) {
            left = cursorLeft;
            width = Math.abs(cursorLeft - drawingPivotLeft);
          } else {
            left = drawingPivotLeft;
            width = cursorLeft - drawingPivotLeft;
          }
        }
      }
    } else {
      timelineHovering = false;
      dispatch('cursorTimeChange', null);
    }

    // Determine whether or not left and right resize and movement should be allowed
    let allowLeft = false;
    let allowRight = false;
    if (movingSlider || resizingSliderLeft || resizingSliderRight) {
      if (mouseWithinRightHorizontalHistogramBounds && e.movementX < 0) {
        allowLeft = true;
      }
      if (mouseWithinLeftHorizontalHistogramBounds && e.movementX > 0) {
        allowRight = true;
      }
    }

    if (allowLeft || allowRight) {
      const sliderRect = timeSelectorContainer.getBoundingClientRect();
      if (movingSlider) {
        if (sliderRect.left + e.movementX < histRect.left) {
          left = 0;
        } else if (sliderRect.right + e.movementX > histRect.right) {
          left = histRect.width - sliderRect.width;
        } else {
          left += e.movementX;
        }
      } else if (resizingSliderLeft) {
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
      } else if (resizingSliderRight) {
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

  function isDrawingRangeInProgress() {
    return drawRangeDistance > 1;
  }

  function onMouseUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (movingSlider || resizingSliderLeft || resizingSliderRight || (drawingRange && isDrawingRangeInProgress())) {
      const unixEpochTimeMin = xScaleMax.invert(left).getTime();
      const unixEpochTimeMax = xScaleMax.invert(left + width).getTime();
      const doyTimeMin = new Date(unixEpochTimeMin);
      const doyTimeMax = new Date(unixEpochTimeMax);

      const newViewTimeRange = { end: doyTimeMax.getTime(), start: doyTimeMin.getTime() };
      dispatch('viewTimeRangeChanged', newViewTimeRange);
    }

    movingSlider = false;
    resizingSliderLeft = false;
    resizingSliderRight = false;
    drawingRange = false;
  }
</script>

<div
  bind:this={histogramContainer}
  class="timeline-histogram"
  style={`margin-left: ${marginLeft}px; width: ${drawWidth}px; height: ${drawHeight}px;`}
>
  <div
    on:click={onTimelineBackgroundClick}
    on:mousedown={onTimelineBackgroundMouseDown}
    class="timeline-histogram-background"
  />
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

  <div
    class="histogram blue"
    style={`height: ${constraintViolations.length ? histogramHeight : histogramHeight * 2}px`}
  >
    {#each activityHistValues as bin}
      <div class="bin" style={`height: ${(bin / activityHistMax) * 100}%;`} />
    {/each}
  </div>
  {#if constraintViolations.length}
    <div class="histogram red" style={`height: ${histogramHeight}px`}>
      {#each constraintHistValues as bin}
        <div class="bin" style={`height: ${(bin / constraintViolationMax) * 100}%;`} />
      {/each}
    </div>
  {/if}

  {#if drawWidth > 0}
    <div
      bind:this={timeSelectorContainer}
      on:mousedown={onSelectorMouseDown}
      style="left: {left}px; width: {width}px;"
      class="timeline-selector"
      class:dragging={movingSlider}
    >
      <div
        style="height: {selectorHandleHeight}px;"
        class:resizing={resizingSliderLeft}
        on:mousedown={onHandleMouseDownLeft}
        class="time-selector-handle left"
      />
      <div
        style="height: {selectorHandleHeight}px;"
        class:resizing={resizingSliderRight}
        on:mousedown={onHandleMouseDownRight}
        class="time-selector-handle right"
      />
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
    background-color: var(--st-gray-80);
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
    height: 100%;
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
