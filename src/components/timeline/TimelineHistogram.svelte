<svelte:options immutable={true} />

<script lang="ts">
  import { bin } from 'd3-array';
  import type { ScaleTime } from 'd3-scale';
  import { createEventDispatcher } from 'svelte';
  import { activityPoints } from '../../stores/activities';

  export let constraintViolations: ConstraintViolation[] = [];
  export let drawWidth: number = 0;
  export let marginLeft: number = 50;
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
  let histogramBinCount = 200;
  let activityHistValues = [];
  let activityHistMin = 0;
  let activityHistMax = 0;
  let constraintViolationValues = [];
  let constraintViolationMin = 0;
  let constraintViolationMax = 0;

  $: windowMax = xScaleMax?.range()[0];
  $: windowMin = xScaleMax?.range()[1];
  $: binTimeRange = drawWidth / (windowMax - windowMin);

  $: if (viewTimeRange) {
    const extent = [new Date(viewTimeRange.start), new Date(viewTimeRange.end)].map(xScaleMax);
    left = extent[0];
    width = extent[1] - extent[0];
  }

  $: if (xScaleMax) {
    const startTime = xScaleMax.invert(windowMax).getTime();
    const endTime = xScaleMax.invert(windowMin).getTime();

    const binSize = (endTime - startTime) / histogramBinCount - 1;
    // console.log('binSize :>> ', binSize, windowMax, windowMin);
    console.log('startTime :>> ', startTime);
    console.log('endTime :>> ', endTime);
    console.log('windowMin :>> ', windowMin);
    console.log('windowMax :>> ', windowMax);

    // Compute bins
    // activityBins = [];
    // for (let i = 0; i < histogramBinCount; i++) {
    //   const binMin = i * binSize;
    //   const binMax = (i + 1) * binSize;
    //   console.log(binMin, binMax);
    // }

    // let c = 0;
    // let binIdx = 0;
    // $activityPoints.forEach(activityPoint => {
    //   // if (activityPoint.x)
    //   console.log(activityPoint.x, '?');
    // });

    const histGenerator = bin()
      .domain([startTime, endTime]) // Set the domain to cover the entire intervall [0,1]
      .thresholds([...Array(200)].map((item, i) => startTime + binSize * i)); // number of thresholds; this will create 19+1 bins
    const activityHist = histGenerator($activityPoints.map(ap => ap.x));
    console.log(activityHist);
    activityHistValues = activityHist.map(x => x.length);
    activityHistMin = Math.min(...activityHistValues);
    activityHistMax = Math.max(...activityHistValues);

    constraintViolationValues = constraintViolations.map(x => x);
    const constraintViolationsHist = histGenerator(
      constraintViolations.map(c => {
        console.log(c.windows.map(w => w));
      }),
    );
    constraintViolationMin = Math.min(...constraintViolationValues);
    constraintViolationMax = Math.max(...constraintViolationValues);
    console.log(constraintViolationMax, constraintViolationMin);

    // // console.log(bins);
    // for (let i = 0; i < histogramBinCount; i++) {
    //   activityBins.push(Math.floor(Math.random() * (16 - 0 + 1) + 0));
    // }

    // constraintViolationBins = activityBins.map(x => {
    //   return Math.random() < 0.5 ? x / 2 : 0;
    // });
  }

  function onSelectorMouseDown() {
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
    if (moving) {
      const histRect = histogramContainer.getBoundingClientRect();
      const sliderRect = timeSelectorContainer.getBoundingClientRect();

      if (sliderRect.left + e.movementX < histRect.left) {
        left = 0;
      } else if (sliderRect.right + e.movementX > histRect.right) {
        left = histRect.width - sliderRect.width;
      } else {
        left += e.movementX;
      }
    } else if (resizingLeft) {
      const histRect = histogramContainer.getBoundingClientRect();
      const sliderRect = timeSelectorContainer.getBoundingClientRect();

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
      const histRect = histogramContainer.getBoundingClientRect();
      const sliderRect = timeSelectorContainer.getBoundingClientRect();

      if (!(sliderRect.right + e.movementX > histRect.right)) {
        if (sliderRect.width + e.movementX >= minWidth) {
          width = sliderRect.width + e.movementX;
        } else {
          width = sliderRect.width;
        }
      }
    }
  }

  function onMouseUp() {
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
  <div class="histogram blue">
    {#each activityHistValues as bin}
      <div class="bin" style={`height: ${(bin / activityHistMax) * 100}%;`} />
    {/each}
  </div>
  <div class="histogram red">
    <!-- {#each constraintViolationBins as height}
      <div class="bin" style={`height: ${height}px;`} />
    {/each} -->
  </div>

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
</div>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
  .timeline-histogram {
    background: var(--st-white);
    display: flex;
    flex-direction: row;
    flex-direction: column;
    gap: 3px;
    height: 40px;
    justify-content: center;
    position: relative;
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
    background: red;
  }

  .time-selector-handle.resizing {
    background: green;
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
