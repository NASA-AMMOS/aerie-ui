<svelte:options immutable={true} />

<script lang="ts">
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import { type ScaleTime } from 'd3-scale';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { ViewDefaultExternalEventOptions } from '../../constants/view';
  import { ViewConstants } from '../../enums/view';
  import type { ExternalEvent } from '../../types/external-event';
  import type {
    ExternalEventDrawItem,
    ExternalEventItem,
    ExternalEventOptions,
    ExternalEventTree,
    ExternalEventTreeNode,
    MouseDown,
    MouseOver,
    QuadtreeRect,
    RowMouseOverEvent,
    TimeRange,
  } from '../../types/timeline';
  import { hexToRgba, shadeColor } from '../../utilities/color';
  import { isRightClick } from '../../utilities/generic';
  import { getRowIdExternalEvent } from '../../utilities/hash';
  import { TimelineInteractionMode, externalEventInView, searchQuadtreeRect } from '../../utilities/timeline';

  type IdToColorMap = Record<number, string>;
  type IdToColorMaps = { directives: IdToColorMap; external_events: IdToColorMap; spans: IdToColorMap };

  export let selectedExternalEventId: number | null = null;
  export let externalEvents: ExternalEvent[] = [];
  export let idToColorMaps: IdToColorMaps = { directives: {}, external_events: {}, spans: {} };
  export let externalEventRowPadding: number = 4;
  export let externalEventSelectedColor: string = '#a9eaff';
  export let externalEventSelectedTextColor: string = '#0a4c7e';
  export let externalEventDefaultColor = '#cbcbcb';
  export let externalEventOptions: ExternalEventOptions = { ...ViewDefaultExternalEventOptions };
  export let externalEventTree: ExternalEventTree = [];
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
  export let showDirectives: boolean = true;
  export let timelineInteractionMode: TimelineInteractionMode;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;

  const dispatch = createEventDispatcher<{
    contextMenu: MouseOver;
    dblClick: MouseOver;
    mouseDown: MouseDown;
    mouseOver: RowMouseOverEvent;
    updateRowHeight: {
      newHeight: number;
    };
  }>();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let maxExternalEventWidth: number;
  let minRectSize: number = 4;
  let quadtreeSpans: Quadtree<QuadtreeRect>;
  let visibleExternalEventsById: Record<number, ExternalEvent> = {};
  let colorCache: Record<string, string> = {};

  // Asset cache
  const textMetricsCache: Record<string, TextMetrics> = {};

  $: onContextmenu(contextmenu);
  $: onDblclick(dblclick);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: rowHeight = externalEventOptions.externalEventHeight + (externalEventOptions.displayMode === 'compact' ? 0 : 0);

  $: if (
    showDirectives !== undefined &&
    canvasHeightDpr &&
    canvasWidthDpr &&
    ctx &&
    drawHeight &&
    drawWidth &&
    dpr &&
    selectedExternalEventId !== undefined &&
    viewTimeRange &&
    xScaleView &&
    externalEventOptions &&
    externalEvents &&
    externalEventTree
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
  }

  function getExternalEventsByOffset(offsetX: number, offsetY: number) {
    const externalEvents = searchQuadtreeRect<ExternalEvent>(
      quadtreeSpans,
      offsetX,
      offsetY,
      externalEventOptions.externalEventHeight,
      maxExternalEventWidth,
      visibleExternalEventsById,
    );
    return { externalEvents };
  }

  function onMousedown(e: MouseEvent | undefined): void {
    // Do not process events if meta/ctrl is pressed to avoid interaction conflicts with zoom/pan
    if (e && timelineInteractionMode === TimelineInteractionMode.Interact && e.button !== 1) {
      // KEEP THESE.
      const { offsetX, offsetY } = e;
      const { externalEvents } = getExternalEventsByOffset(offsetX, offsetY);

      /**
       * The setTimeout is needed to prevent a race condition with mousedown events and change events.
       * Without the setTimeout, mousedown events happen before change events in the external event selection form.
       * Make sure you understand the linked issue before changing this code!
       * @see https://github.com/NASA-AMMOS/aerie-ui/issues/590
       */
      setTimeout(() => {
        dispatch('mouseDown', { e, externalEvents });
      });
    }
  }

  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX, offsetY } = e;
      let externalEvents: ExternalEvent[] = [];
      const hits = getExternalEventsByOffset(offsetX, offsetY);
      externalEvents = hits.externalEvents;

      dispatch('mouseOver', { e, externalEvents });
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
      // Get _new_ selectedExternalEventId in order to ensure that no race condition exists between
      // the selectedExternalEventId stores and the dispatching of this event
      // since there is no guarantee that the mousedown event triggering updates to those stores will complete
      // before the context menu event dispatch fires
      const { offsetX, offsetY } = e;
      const { externalEvents } = getExternalEventsByOffset(offsetX, offsetY);

      let newSelectedExternalEventId: number | null = null;
      if (externalEvents.length > 0) {
        newSelectedExternalEventId = getRowIdExternalEvent(externalEvents[0].pkey);
      }
      dispatch('contextMenu', {
        e,
        origin: 'layer-external-event',
        selectedExternalEventId: newSelectedExternalEventId ?? undefined,
      });
    }
  }

  function onDblclick(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('dblClick', {
        e,
        selectedExternalEventId: selectedExternalEventId ?? undefined,
      });
    }
  }

  function getLabelForExternalEvent(externalEvent: ExternalEvent): string {
    // Display an arrow to the left of a event label if the span is sticky
    // The label should be sticky if the start of the event is clipped and the event is still in view
    const sticky =
      externalEvent.start_ms < viewTimeRange.start &&
      externalEvent.start_ms + externalEvent.duration_ms >= viewTimeRange.start;
    return `${sticky ? '← ' : ''}${externalEvent.pkey.key}`;
  }

  function drawBottomLine(y: number, width: number) {
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--timeline-divider-color');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  function drawGroup(node: ExternalEventTreeNode, y: number, rowHeight: number, drawLine = true) {
    let newY = y;
    if (drawLine) {
      drawBottomLine(newY + rowHeight + 0.5, drawWidth);
    }

    drawRow(newY + externalEventRowPadding, node.items || [], idToColorMaps);
    newY += rowHeight;
    if (node.expanded && node.children.length) {
      node.children.forEach(childNode => {
        newY = drawGroup(childNode, newY, rowHeight, true);
      });
    }
    return newY;
  }

  function drawGroupedMode() {
    if (xScaleView !== null) {
      const collapsedMode = drawHeight <= ViewConstants.MIN_ROW_HEIGHT;
      let y = collapsedMode ? 0 : ViewConstants.MIN_ROW_HEIGHT - 1; // pad starting y with the min row height to align with activity tree
      const expectedRowHeight = rowHeight + externalEventRowPadding;
      externalEventTree.forEach(node => {
        const newY = drawGroup(node, y, expectedRowHeight, !collapsedMode);
        if (!collapsedMode) {
          y = newY;
        }
      });
      const newRowHeight = y + 36; // add padding to the bottom to account for buttons in the activity tree
      if (!collapsedMode && newRowHeight > 0) {
        /* TODO a change from manual to auto height does not take effect until you trigger a redraw on this row, could pass in whether or not to update row height but that might be odd? */
        dispatch('updateRowHeight', { newHeight: newRowHeight });
      }
    }
  }

  function drawCompactMode() {
    if (xScaleView !== null) {
      const itemsToDraw: ExternalEventDrawItem[] = [];
      externalEvents.forEach(externalEvent => {
        if (externalEventInView(externalEvent, viewTimeRange)) {
          itemsToDraw.push({
            externalEvent: externalEvent,
            startX: xScaleView(externalEvent.start_ms),
          });
        }
      });

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

      const extraSpace = Math.max(0, drawHeight - externalEventOptions.externalEventHeight - externalEventRowPadding);
      const rowCount = Object.keys(rows).length;
      Object.entries(rows).forEach(([_, entry], i) => {
        const { items } = entry;
        let yRow = i * (extraSpace / (rowCount - 1)) || 0;
        // If we can't have at least two rows then draw everything at 0
        if (externalEventOptions.externalEventHeight * 2 >= drawHeight) {
          yRow = 4;
        }
        if (externalEventOptions.externalEventHeight) {
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
      const spanEndX = xScaleView(externalEvent.start_ms + externalEvent.duration_ms);
      boxEndX = Math.max(boxEndX, spanEndX);
      if (externalEventOptions.labelVisibility !== 'off') {
        labelEndX = Math.max(
          labelEndX,
          Math.max(minRectSize, startX) +
            labelPaddingLeft +
            measureText(getLabelForExternalEvent(externalEvent), textMetricsCache).width,
        );
      }
    }
    return Math.max(boxEndX, labelEndX);
  }

  function drawRow(y: number, items: ExternalEventItem[], idToColorMaps: IdToColorMaps) {
    /* TODO this is doing unnecessary work in compact mode - should be able to preprocess grouped mode and skip this first part for compact mode */
    const drawLabels = externalEventOptions.labelVisibility === 'on' || externalEventOptions.labelVisibility === 'auto';
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
        newItem = { externalEvent, externalEventStartX: xScaleView(externalEvent.start_ms) };
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

      // Draw external event like a span
      if (externalEvent && typeof externalEventStartX === 'number') {
        const externalEventEndX = xScaleView(externalEvent.start_ms + externalEvent.duration_ms);
        const externalEventRectWidth = Math.max(2, Math.min(externalEventEndX, drawWidth) - externalEventStartX);
        const externalEventColor =
          idToColorMaps.external_events[getRowIdExternalEvent(externalEvent.pkey)] || externalEventDefaultColor;
        const isSelected = selectedExternalEventId === getRowIdExternalEvent(externalEvent.pkey);
        if (isSelected) {
          ctx.fillStyle = externalEventSelectedColor;
        } else {
          const color = getRGBAFromHex(externalEventColor, 0.5);
          ctx.fillStyle = color;
        }
        ctx.fillRect(externalEventStartX, y, externalEventRectWidth, rowHeight);

        // Draw label if no directive and the label will fit
        let spanLabelWidth = 0;
        if (drawLabels) {
          const label = getLabelForExternalEvent(externalEvent);
          spanLabelWidth = measureText(label, textMetricsCache).width + labelPaddingLeft;
          let shouldDrawLabel = true;
          if (externalEventOptions.labelVisibility === 'auto') {
            if (nextItem) {
              const nextX = nextItem.externalEventStartX ?? null;
              if (typeof nextX === 'number' && externalEventStartX + spanLabelWidth >= nextX) {
                shouldDrawLabel = false;
                spanLabelWidth = 0;
              }
            }
          }
          if (shouldDrawLabel) {
            const spanColor = externalEventDefaultColor;
            drawLabel(label, externalEventStartX, y, spanLabelWidth, spanColor, isSelected);
          }
        }

        // Add to quadtree
        visibleExternalEventsById[getRowIdExternalEvent(externalEvent.pkey)] = externalEvent;
        quadtreeSpans.add({
          height: rowHeight,
          id: getRowIdExternalEvent(externalEvent.pkey),
          width: Math.max(spanLabelWidth, externalEventRectWidth),
          x: externalEventStartX,
          y,
        });
      }
    });
  }

  function drawLabel(text: string, x: number, y: number, width: number, color: string, selected = false) {
    setLabelContext('black');
    if (selected) {
      ctx.fillStyle = externalEventSelectedTextColor;
    } else {
      const opacity = selectedExternalEventId !== null ? 0.4 : 1;
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
   * Draws external event points to the canvas context.
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
      if (externalEventOptions.displayMode === 'grouped') {
        drawGroupedMode();
      } else if (externalEventOptions.displayMode === 'compact') {
        drawCompactMode();
      } else {
        console.warn('Unsupported LayerExternalSources displayMode: ', externalEventOptions.displayMode);
      }
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
