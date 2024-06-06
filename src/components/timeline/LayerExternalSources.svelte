<svelte:options immutable={true} />

<script lang="ts">
  import ActivityAnchorIconSVG from '@nasa-jpl/stellar/icons/activity_anchor.svg?raw';
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import { type ScaleTime } from 'd3-scale';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { ActivityDirective, ActivityDirectiveId } from '../../types/activity';
  import type { ExternalEvent, ExternalEventId } from '../../types/external-event';
  import type { SpanId } from '../../types/simulation';
  import type {
    ExternalEventDrawItem,
    ExternalEventItem,
    MouseDown,
    MouseOver,
    QuadtreeRect,
    RowMouseOverEvent,
    TimeRange
  } from '../../types/timeline';
  import { hexToRgba, shadeColor } from '../../utilities/color';
  import { isRightClick } from '../../utilities/generic';
  import {
    getDoyTime,
    getUnixEpochTime
  } from '../../utilities/time';
  import {
    TimelineInteractionMode,
    externalEventInView,
    searchQuadtreeRect
  } from '../../utilities/timeline';

  type IdToColorMap = Record<number, string>;
  type IdToColorMaps = { directives: IdToColorMap; spans: IdToColorMap };

  export let externalEvents: ExternalEvent[] = [];
  export let idToColorMaps: IdToColorMaps = { directives: {}, spans: {} };
  export let externalEventRowPadding: number = 4;
  export let externalEventSelectedColor: string = '#a9eaff';
  export let externalEventSelectedTextColor: string = '#0a4c7e';
  export let externalEventDefaultColor = '#cbcbcb';
  export let contextmenu: MouseEvent | undefined;
  export let dblclick: MouseEvent | undefined;
  export let dpr: number = 1;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let labelPaddingLeft: number = 4;
  export let maxPackedExternalEventCount: number = 10000;
  export let mousedown: MouseEvent | undefined;
  export let mousemove: MouseEvent | undefined;
  export let mouseout: MouseEvent | undefined;
  export let planStartTimeYmd: string;
  export let selectedExternalEventId: ActivityDirectiveId | null = null;
  export let selectedSpanId: SpanId | null = null;
  export let showDirectives: boolean = true;
  export let timelineInteractionMode: TimelineInteractionMode;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;

  function convertUTCtoMs(date: string): number {
    var d = new Date(date)
    return d.getTime() + (d.getTimezoneOffset() * 60000);
  }

  const dispatch = createEventDispatcher<{
    contextMenu: MouseOver;
    dblClick: MouseOver;
    deleteActivityDirective: number;
    mouseDown: MouseDown;
    mouseOver: RowMouseOverEvent;
    updateRowHeight: {
      newHeight: number;
    };
  }>();  

  $: console.log(externalEvents)

  let externalEventHeight = 16;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let maxExternalEventWidth: number;
  let minRectSize: number = 4;
  let planStartTimeMs: number;
  let quadtreeSpans: Quadtree<QuadtreeRect>;
  let visibleExternalEventsById: Record<ActivityDirectiveId, ActivityDirective> = {};
  let visibleSpansById: Record<ExternalEventId, ExternalEvent> = {};
  let colorCache: Record<string, string> = {};

  // Asset cache
  const assets: { anchorIcon: HTMLImageElement | null } = { anchorIcon: null };
  const textMetricsCache: Record<string, TextMetrics> = {};

  $: onContextmenu(contextmenu);
  $: onDblclick(dblclick);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: rowHeight = externalEventHeight;
  $: planStartTimeMs = getUnixEpochTime(getDoyTime(new Date(planStartTimeYmd)));

  $: if (
    showDirectives !== undefined &&
    canvasHeightDpr &&
    canvasWidthDpr &&
    ctx &&
    drawHeight &&
    drawWidth &&
    dpr &&
    selectedExternalEventId !== undefined &&
    selectedSpanId !== undefined &&
    viewTimeRange &&
    xScaleView &&
    externalEvents
  ) {
    draw();
  }

  onMount(() => {
    preloadStaticAssets();
  });

  function preloadStaticAssets() {
    if (canvas) {
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }
    assets.anchorIcon = loadSVG(ActivityAnchorIconSVG);
  }

  function loadSVG(svgString: string) {
    var svg64 = window.btoa(svgString);
    var b64Start = 'data:image/svg+xml;base64,';
    // prepend a "header"
    var image64 = b64Start + svg64;
    const image = document.createElement('img');
    image.src = image64;
    return image;
  }

  function getExternalEventsByOffset(offsetX: number, offsetY: number) {
    const externalEvents = searchQuadtreeRect<ExternalEvent>(
      quadtreeSpans,
      offsetX,
      offsetY,
      externalEventHeight,
      maxExternalEventWidth,
      visibleSpansById,
    );
    return { externalEvents };
  }

  function onMousedown(e: MouseEvent | undefined): void {
    // Do not process events if meta/ctrl is pressed to avoid interaction conflicts with zoom/pan
    if (e && timelineInteractionMode === TimelineInteractionMode.Interact && e.button !== 1) { // KEEP THESE.
      const { offsetX, offsetY } = e;
      const { externalEvents } = getExternalEventsByOffset(offsetX, offsetY);

      /**
       * The setTimeout is needed to prevent a race condition with mousedown events and change events.
       * Without the setTimeout, mousedown events happen before change events in the activity directive form.
       * This caused invalid updates to activity parameters.
       * Make sure you understand the linked issue before changing this code!
       * @see https://github.com/NASA-AMMOS/aerie-ui/issues/590
       */
      setTimeout(() => {
        // dispatch('mouseDown', { e, externalEvents });
        // if (!isRightClick(e)) {
        //   dragActivityDirectiveStart(activityDirectives, offsetX);
        // }
      });
    }
  }

  // TODO: KEEP ME FOR THE SAKE OF TOOLTIPS
  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX, offsetY } = e;
      let externalEvents: ExternalEvent[] = [];
      const hits = getExternalEventsByOffset(offsetX, offsetY);
      externalEvents = hits.externalEvents;

      // dispatch('mouseOver', { e, externalEvents });
    }
  }

  function onMouseout(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('mouseOver', { e, externalEvents: [] });
    }
  }

  function onContextmenu(e: MouseEvent | undefined): void {
    // Prevent native context menu from appearing at all
    if (e) {
      e.preventDefault();
    }
    const showContextMenu = !!e && isRightClick(e);
    if (showContextMenu) {
      // Get new selected directive or span in order to ensure that no race condition exists between
      // the selectedActivityDirectiveId and selectedSpanId stores and the dispatching of this event
      // since there is no guarantee that the mousedown event triggering updates to those stores will complete
      // before the context menu event dispatch fires
      const { offsetX, offsetY } = e;
      const {externalEvents } = getExternalEventsByOffset(offsetX, offsetY);

      let newSelectedSpanId = null;
      if (externalEvents.length > 0) {
        newSelectedSpanId = externalEvents[0].id;
      }
      dispatch('contextMenu', {
        e,
        origin: 'layer-external-event',
        selectedExternalEventId: selectedExternalEventId ?? undefined
      });
    }
  }

  function onDblclick(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('dblClick', {
        e,
        selectedExternalEventId: selectedExternalEventId ?? undefined
      });
    }
  }

  // TODO: Revisit this!
  function getLabelForExternalEvent(externalEvent: ExternalEvent): string {
    // Display an arrow to the left of a event label if the span is sticky
    // The label should be sticky if the start of the event is clipped and the event is still in view
    const sticky = externalEvent.startMs < viewTimeRange.start && externalEvent.startMs + externalEvent.durationMs >= viewTimeRange.start;
    return `${sticky ? '← ' : ''}${externalEvent.key}`;
  }

  function drawCompactMode() {
    if (xScaleView !== null) {
      const itemsToDraw: ExternalEventDrawItem[] = [];
      externalEvents.forEach(externalEvent => {
        if (externalEventInView(externalEvent, viewTimeRange)) {
          itemsToDraw.push({
            externalEvent: externalEvent,
            startX: xScaleView(externalEvent.startMs),
          });
        }
      });
      
      // TODO: address this:
      if (itemsToDraw.length > maxPackedExternalEventCount) {
        const text = `External Event drawing limit (${maxPackedExternalEventCount}) exceeded (${itemsToDraw.length})`;
        const { width } = measureText(text, textMetricsCache);
        setLabelContext('black');
        ctx.fillText(text, drawWidth / 2 - width / 2, drawHeight / 2, width);
        return;
      }

      itemsToDraw.sort((a, b) => {
        return a.startX < b.startX ? -1 : 1;
      });

      const rows: Record<number, { items: ExternalEventDrawItem[]; max: number }> = {};
      itemsToDraw.forEach(item => {
        const { startX } = item;
        const itemEndX = getItemEndX(item);
        let row = 0;
        let openRowSpaceFound = false;
        while (!openRowSpaceFound) {
          const maxXForRow = rows[row] ? rows[row].max : Number.MIN_SAFE_INTEGER;
          let minX = startX;
          let maxX = itemEndX;
          if (minX < maxXForRow) {
            row += 1;
          } else {
            openRowSpaceFound = true;
            const existingItemsForRow = rows[row] ? rows[row].items : [];
            rows[row] = {
              items: existingItemsForRow.concat(item),
              max: maxX,
            };
          }
        }
      });

      const extraSpace = Math.max(0, drawHeight - externalEventHeight - externalEventRowPadding);
      const rowCount = Object.keys(rows).length;
      Object.entries(rows).forEach(([_, entry], i) => {
        const { items } = entry;
        let yRow = i * (extraSpace / (rowCount - 1)) || 0;
        // If we can't have at least two rows then draw everything at 0
        if (externalEventHeight * 2 >= drawHeight) {
          yRow = 4;
        }
        if (externalEventHeight) {
          drawRow(yRow, items, idToColorMaps);
        }
      });
    }
  }

  function getItemEndX(item: { externalEvent?: ExternalEvent; startX: number }) {
    const { externalEvent, startX } = item;
    let labelEndX = 0;
    let boxEndX = 0;
    if (externalEvent && xScaleView) {
      const spanEndX = xScaleView(externalEvent.startMs + externalEvent.durationMs);
      boxEndX = Math.max(boxEndX, spanEndX);
      // if (activityOptions.labelVisibility !== 'off') {
      labelEndX = Math.max(
        labelEndX,
        Math.max(minRectSize, startX) + labelPaddingLeft + measureText(getLabelForExternalEvent(externalEvent), textMetricsCache).width,
      );
      // }
    }
    return Math.max(boxEndX, labelEndX);
  }

  function drawRow(y: number, items: ExternalEventItem[], idToColorMaps: IdToColorMaps) {
    /* TODO this is doing unnecessary work in compact mode - should be able to preprocess grouped mode and skip this first part for compact mode */
    // const drawLabels = true; //activityOptions.labelVisibility === 'on' || activityOptions.labelVisibility === 'auto';
    let itemsToDraw: {
      externalEvent?: ExternalEvent;
      externalEventStartX?: number;
    }[] = [];

    items.forEach(item => {
      if (!xScaleView) {
        return;
      }

      const { externalEvent } = item;
      let newItem;

      if (externalEvent && externalEventInView(externalEvent, viewTimeRange)) {
        newItem = { externalEvent, externalEventStartX: xScaleView(externalEvent.startMs) };
      }
      if (newItem) {
        itemsToDraw.push(newItem);
      }
    });

    itemsToDraw.forEach(({ externalEvent, externalEventStartX }, i) => {
      if (!xScaleView) {
        return;
      }
      const nextItem = itemsToDraw[i + 1];

      // Draw span
      if (externalEvent && typeof externalEventStartX === 'number') {
        const spanEndX = xScaleView(externalEvent.startMs+externalEvent.durationMs)
        const spanRectWidth = Math.max(2, Math.min(spanEndX, drawWidth) - externalEventStartX);
        const spanColor = idToColorMaps.spans[externalEvent.id] || externalEventDefaultColor;
        const isSelected = selectedSpanId === externalEvent.id;
        if (isSelected) {
          ctx.fillStyle = externalEventSelectedColor;
        } else {
          const color = getRGBAFromHex(spanColor, 0.5);
          ctx.fillStyle = color;
        }
        ctx.fillRect(externalEventStartX, y, spanRectWidth, rowHeight);

        // Draw label if no directive and the label will fit
        let spanLabelWidth = 0;
        // if (drawLabels && (!directive || !showDirectives)) {
          const label = getLabelForExternalEvent(externalEvent);
          spanLabelWidth = measureText(label, textMetricsCache).width + labelPaddingLeft;
          let shouldDrawLabel = true;
          // if (activityOptions.labelVisibility === 'auto') {
            if (nextItem) {
              const nextX = nextItem.externalEventStartX ?? null;
              if (typeof nextX === 'number' && externalEventStartX + spanLabelWidth >= nextX) {
                shouldDrawLabel = false;
                spanLabelWidth = 0;
              }
            }
          // }
          if (shouldDrawLabel) {
            const spanColor = idToColorMaps.spans[externalEvent.id] || externalEventDefaultColor;
            drawLabel(label, externalEventStartX, y, spanLabelWidth, spanColor, isSelected);
          }
        // }

        // Add to quadtree
        visibleSpansById[externalEvent.id] = externalEvent;
        quadtreeSpans.add({
          height: rowHeight,
          id: externalEvent.id,
          width: Math.max(spanLabelWidth, spanRectWidth),
          x: externalEventStartX,
          y,
        });
      }
    });
  }

  function drawLabel(
    text: string,
    x: number,
    y: number,
    width: number,
    color: string,
    selected = false,
  ) {
    setLabelContext('black');
    if (selected) {
      ctx.fillStyle = externalEventSelectedTextColor;
    } else {
      const opacity = selectedExternalEventId !== null || selectedSpanId !== null ? 0.4 : 1;
      ctx.fillStyle = getRGBAFromHex(shadeColor(color, 2.8), opacity);
    }
    ctx.fillText(text, Math.max(x + labelPaddingLeft, minRectSize), y + rowHeight / 2, width);
  }

  function getRGBAFromHex(color: string, opacity: number = 1) {
    const key = `${color}_${opacity}`;
    let rgba = colorCache[key];
    if (!rgba) {
      rgba = hexToRgba(color, opacity);
      colorCache[key] = rgba;
    }
    return rgba;
  }

  function measureText(text: string, cache: Record<string, TextMetrics>) {
    const cachedMeasurement = cache[text];
    if (cachedMeasurement) {
      return cachedMeasurement;
    }
    const measurement = ctx.measureText(text);
    cache[text] = measurement;
    return measurement;
  }

  function setLabelContext(color = '#000000') {
    const fontSize = 10;
    const fontFace = 'Inter';
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFace}`;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';
  }

  /**
   * Draws activity points to the canvas context.
   * @note Points must be sorted in time ascending order before calling this function.
   */
  async function draw(): Promise<void> {
    if (ctx) {
      await tick();

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, drawWidth, drawHeight);

      quadtreeSpans = d3Quadtree<QuadtreeRect>()
        .x(p => p.x)
        .y(p => p.y)
        .extent([
          [0, 0],
          [drawWidth, drawHeight],
        ]);

      visibleExternalEventsById = {};
      visibleSpansById = {};
      // TODO: Eventually draw grouped. That is a way easier way to read. Offer both options, at least.
      drawCompactMode();
    }
  }
</script>

<canvas
  bind:this={canvas}
  height={canvasHeightDpr}
  style="height: {drawHeight}px; width: {drawWidth}px;"
  width={canvasWidthDpr}
/>

<style>
  canvas {
    position: absolute;
    z-index: -1;
  }
</style>
