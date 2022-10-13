<svelte:options immutable={true} />

<script lang="ts">
  import { bisector, tickStep } from 'd3-array';
  import {
    timeHour,
    timeInterval,
    timeMillisecond,
    timeMinute,
    timeMonth,
    timeSecond,
    timeWeek,
    timeYear,
    type CountableTimeInterval,
  } from 'd3-time';
  import { afterUpdate, tick } from 'svelte';
  import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
  import { getDoyTime } from '../..//utilities/time';
  import { selectedActivityId } from '../../stores/activities';
  import { constraintViolations } from '../../stores/constraints';
  import { maxTimeRange, viewTimeRange } from '../../stores/plan';
  import { resources } from '../../stores/simulation';
  import { view, viewUpdateRow, viewUpdateTimeline } from '../../stores/views';
  import { clamp } from '../../utilities/generic';
  import { getXScale, MAX_CANVAS_SIZE } from '../../utilities/timeline';
  import {
    durationDay,
    durationHour,
    durationMinute,
    durationMonth,
    durationSecond,
    durationWeek,
    durationYear,
  } from './duration';
  import TimelineRow from './Row.svelte';
  import TimelineCursors from './TimelineCursors.svelte';
  import TimelineHistogram from './TimelineHistogram.svelte';
  import Tooltip from './Tooltip.svelte';
  import TimelineXAxis from './XAxis.svelte';

  export let gridId: number;
  export let timelineId: number;

  let clientWidth: number = 0;
  let cursorEnabled: boolean = true;
  let cursorHeaderHeight: number = 0;
  // let cursorHeaderHeight: number = 20;
  let histogramCursorTime: Date | null = null;
  let mouseOver: MouseOver;
  let mouseOverViolations: MouseOverViolations;
  let rowDragMoveDisabled = true;
  let rowsMaxHeight: number = 600;
  let rows: Row[] = [];
  let tickCount: number = 20;
  let timeline: Timeline;
  let timelineDiv: HTMLDivElement;
  let timelineHistogramDiv: HTMLDivElement;
  let timelineHistogramDrawHeight: number = 40;
  let xAxisDiv: HTMLDivElement;
  let xAxisDrawHeight: number = 64;
  let xTicksView = [];

  $: timeline = $view?.definition.plan.timelines.find(timeline => timeline.id === timelineId);
  $: rows = timeline?.rows || [];
  $: timeline.gridId = gridId;
  $: drawWidth = clientWidth > 0 ? clientWidth - timeline?.marginLeft - timeline?.marginRight : 0;

  $: if (drawWidth) {
    let ticks = Math.round(drawWidth / 140);
    tickCount = clamp(ticks, 2, 15);
  }

  $: setRowsMaxHeight(timelineDiv, xAxisDiv, timelineHistogramDiv);
  $: xDomainMax = [new Date($maxTimeRange.start), new Date($maxTimeRange.end)];
  $: xDomainView = [new Date($viewTimeRange.start), new Date($viewTimeRange.end)];
  $: xScaleMax = getXScale(xDomainMax, drawWidth);
  $: xScaleView = getXScale(xDomainView, drawWidth); /* .nice(); */

  // Use a custom D3 time day to force equidistant time intervals
  // for days as opposed to D3's non-uniform intervals that can end early
  // on months or years
  // See https://github.com/d3/d3-scale/issues/245
  // And https://observablehq.com/d/906f777c9f2f0701
  const customD3TimeDay = timeInterval(
    date => date.setHours(0, 0, 0, 0),
    (date, step) => date.setDate(date.getDate() + step),
    (start, end) => (end.getTime() - start.getTime()) / durationDay,
    date => Math.floor(date.getTime() / durationDay),
  );

  // From https://github.com/d3/d3-time/blob/main/src/ticks.js
  const customD3TickIntervals: [CountableTimeInterval, number, number][] = [
    [timeSecond, 1, durationSecond],
    [timeSecond, 5, 5 * durationSecond],
    [timeSecond, 15, 15 * durationSecond],
    [timeSecond, 30, 30 * durationSecond],
    [timeMinute, 1, durationMinute],
    [timeMinute, 5, 5 * durationMinute],
    [timeMinute, 15, 15 * durationMinute],
    [timeMinute, 30, 30 * durationMinute],
    [timeHour, 1, durationHour],
    [timeHour, 3, 3 * durationHour],
    [timeHour, 6, 6 * durationHour],
    [timeHour, 12, 12 * durationHour],
    [customD3TimeDay, 1, durationDay],
    [customD3TimeDay, 2, 2 * durationDay],
    [timeWeek, 1, durationWeek],
    [timeMonth, 1, durationMonth],
    [timeMonth, 3, 3 * durationMonth],
    [timeYear, 1, durationYear],
  ];

  // From https://github.com/d3/d3-time/blob/main/src/ticks.js
  function customD3TickInterval(start: number, stop: number, count: number) {
    const target: number = Math.abs(stop - start) / count;
    const i = bisector(([, , step]) => step).right(customD3TickIntervals, target);
    if (i === customD3TickIntervals.length) {
      return timeYear.every(tickStep(start / durationYear, stop / durationYear, count));
    }
    if (i === 0) {
      return timeMillisecond.every(Math.max(tickStep(start, stop, count), 1));
    }
    const [t, step] =
      customD3TickIntervals[
        target / customD3TickIntervals[i - 1][2] < customD3TickIntervals[i][2] / target ? i - 1 : i
      ];
    return t.every(step);
  }

  // From https://github.com/d3/d3-time/blob/main/src/ticks.js
  function customD3Ticks(start, stop, count) {
    const reverse = stop < start;
    if (reverse) {
      [start, stop] = [stop, start];
    }
    const interval = count && typeof count.range === 'function' ? count : customD3TickInterval(start, stop, count);
    const ticks = interval ? interval.range(start, +stop + 1) : []; // inclusive stop
    return reverse ? ticks.reverse() : ticks;
  }

  $: xTicksView = customD3Ticks(xScaleView.domain()[0].getTime(), xScaleView.domain()[1].getTime(), tickCount).map(
    (date: Date) => {
      const doyTimestamp = getDoyTime(date, false);
      const [yearDay, time] = doyTimestamp.split('T');
      return { date, time, yearDay };
    },
  );

  afterUpdate(() => {
    setRowsMaxHeight(timelineDiv, xAxisDiv, timelineHistogramDiv);
  });

  function handleDndConsiderRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    const { info } = detail;
    const { trigger } = info;
    rows = detail.items as Row[];
    if (trigger === TRIGGERS.DRAG_STOPPED) {
      rowDragMoveDisabled = true;
    }
  }

  function handleDndFinalizeRows(e: CustomEvent<DndEvent>) {
    const { detail } = e;
    const { info } = detail;
    const { source } = info;
    rows = detail.items as Row[];
    if (source === SOURCES.POINTER) {
      rowDragMoveDisabled = true;
    }
    viewUpdateTimeline('rows', rows, timelineId);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 't' && event.ctrlKey) {
      cursorEnabled = !cursorEnabled;
    }
  }

  function onMouseDown(event: CustomEvent<MouseDown>) {
    const { detail } = event;
    const { points } = detail;

    if (points.length) {
      const [point] = points; // TODO: Multiselect points?
      if (point.type === 'activity') {
        $selectedActivityId = point.id;
      }
    }
  }

  function onMouseDownRowMove(event: Event) {
    event.preventDefault();
    rowDragMoveDisabled = false;
  }

  function onToggleRowExpansion(event: CustomEvent<{ expanded: boolean; rowId: number }>) {
    const { rowId, expanded } = event.detail;
    viewUpdateRow('expanded', expanded, timelineId, rowId);
  }

  function onUpdateRowHeight(event: CustomEvent<{ newHeight: number; rowId: number }>) {
    const { newHeight, rowId } = event.detail;
    if (timeline.gridId === gridId && newHeight < MAX_CANVAS_SIZE) {
      viewUpdateRow('height', newHeight, timelineId, rowId);
    }
  }

  function onViewTimeRangeChanged(event: CustomEvent<TimeRange>) {
    $viewTimeRange = event.detail;
  }

  function onHistogramViewTimeRangeChanged(event: CustomEvent<TimeRange>) {
    $viewTimeRange = event.detail;
    mouseOver = null;
  }

  function onHistogramCursorTimeChanged(event: CustomEvent<Date>) {
    histogramCursorTime = event.detail;
  }

  async function setRowsMaxHeight(
    timelineDiv: HTMLDivElement,
    xAxisDiv: HTMLDivElement,
    timelineHistogramDiv: HTMLDivElement,
  ) {
    await tick();
    if (timelineDiv && xAxisDiv && timelineDiv.parentElement) {
      const { clientHeight: parentHeight } = timelineDiv.parentElement;
      const offsetTop = xAxisDiv.clientHeight + timelineHistogramDiv.clientHeight;
      const maxHeight = parentHeight - offsetTop - cursorHeaderHeight;
      rowsMaxHeight = maxHeight;
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<div bind:this={timelineDiv} bind:clientWidth class="timeline" id={`timeline-${timelineId}`}>
  <div bind:this={timelineHistogramDiv} style="padding-top: 12px">
    <TimelineHistogram
      constraintViolations={$constraintViolations}
      {cursorEnabled}
      drawHeight={timelineHistogramDrawHeight}
      {drawWidth}
      marginLeft={timeline?.marginLeft}
      {mouseOver}
      {rows}
      viewTimeRange={$viewTimeRange}
      {xScaleView}
      {xScaleMax}
      on:viewTimeRangeChanged={onHistogramViewTimeRangeChanged}
      on:cursorTimeChange={onHistogramCursorTimeChanged}
    />
  </div>
  <div bind:this={xAxisDiv} class="x-axis" style="height: {xAxisDrawHeight}px">
    <TimelineXAxis
      constraintViolations={$constraintViolations}
      drawHeight={xAxisDrawHeight}
      {drawWidth}
      marginLeft={timeline?.marginLeft}
      verticalGuides={timeline?.verticalGuides}
      viewTimeRange={$viewTimeRange}
      {xScaleView}
      {xTicksView}
      on:viewTimeRangeChanged={onViewTimeRangeChanged}
    />
  </div>
  <TimelineCursors
    {mouseOver}
    {histogramCursorTime}
    {xScaleView}
    {drawWidth}
    {cursorHeaderHeight}
    {cursorEnabled}
    marginLeft={timeline?.marginLeft}
  />
  <div
    class="rows"
    style="max-height: {rowsMaxHeight}px"
    on:consider={handleDndConsiderRows}
    on:finalize={handleDndFinalizeRows}
    on:mouseenter={() => (timeline.gridId = gridId)}
    use:dndzone={{
      dragDisabled: rowDragMoveDisabled,
      items: rows,
      type: 'rows',
    }}
  >
    {#each rows as row (row.id)}
      <TimelineRow
        autoAdjustHeight={row.autoAdjustHeight}
        constraintViolations={$constraintViolations}
        drawHeight={row.height}
        {drawWidth}
        expanded={row.expanded}
        horizontalGuides={row.horizontalGuides}
        id={row.id}
        layers={row.layers}
        name={row.name}
        marginLeft={timeline?.marginLeft}
        resources={$resources}
        {rowDragMoveDisabled}
        verticalGuides={timeline?.verticalGuides}
        viewTimeRange={$viewTimeRange}
        {xScaleView}
        {xTicksView}
        yAxes={row.yAxes}
        on:mouseDown={onMouseDown}
        on:mouseDownRowMove={onMouseDownRowMove}
        on:mouseOver={e => (mouseOver = e.detail)}
        on:mouseOverViolations={e => (mouseOverViolations = e.detail)}
        on:toggleRowExpansion={onToggleRowExpansion}
        on:updateRowHeight={onUpdateRowHeight}
      />
    {/each}
  </div>

  <!-- Timeline Tooltip. -->
  <Tooltip {mouseOver} {mouseOverViolations} />
</div>

<style>
  .rows {
    min-height: 100px;
    outline: none !important;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .timeline {
    height: 100%;
    overflow-x: hidden;
    overflow-y: hidden;
    width: 100%;
  }

  .x-axis {
    pointer-events: none;
  }
</style>
