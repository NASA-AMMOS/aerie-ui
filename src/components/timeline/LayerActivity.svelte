<svelte:options immutable={true} />

<script lang="ts">
  import { browser } from '$app/environment';
  import ActivityAnchorIconSVG from '@nasa-jpl/stellar/icons/activity_anchor.svg?raw';
  import ActivityDirectiveIconSVG from '@nasa-jpl/stellar/icons/activity_directive.svg?raw';
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import { type ScaleTime } from 'd3-scale';
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import SpanHashMarksSVG from '../../assets/span-hash-marks.svg?raw';
  import type { ActivityDirective, ActivityDirectiveId, ActivityDirectivesMap } from '../../types/activity';
  import type { User } from '../../types/app';
  import type { Plan } from '../../types/plan';
  import type { SimulationDataset, Span, SpanId, SpansMap, SpanUtilityMaps } from '../../types/simulation';
  import type {
    BoundingBox,
    MouseDown,
    MouseOver,
    PointBounds,
    QuadtreeRect,
    RowMouseOverEvent,
    TimeRange,
  } from '../../types/timeline';
  import { hexToRgba, shadeColor } from '../../utilities/color';
  import effects from '../../utilities/effects';
  import { isRightClick } from '../../utilities/generic';
  import { isDeleteEvent } from '../../utilities/keyboardEvents';
  import {
    getActivityDirectiveStartTimeMs,
    getDoyTime,
    getIntervalUnixEpochTime,
    getUnixEpochTime,
    getUnixEpochTimeFromInterval,
  } from '../../utilities/time';
  import { searchQuadtreeRect, TimelineInteractionMode, TimelineLockStatus } from '../../utilities/timeline';

  export let activityDirectives: ActivityDirective[] = [];
  export let activityLayerGroups = [];
  export let idToColorMaps = { directives: {}, spans: {} };
  export let activityDirectivesMap: ActivityDirectivesMap = {};
  // export let activityColor: string = '';
  export let activityHeight: number = 16;
  export let activityRowPadding: number = 4;
  export let activitySelectedColor: string = '#a9eaff';
  export let activityUnfinishedSelectedColor: string = '#ff3b19';
  export let activityUnfinishedColor: string = '#fc674d';
  export let blur: FocusEvent | undefined;
  export let contextmenu: MouseEvent | undefined;
  export let debugMode: boolean = false;
  export let dblclick: MouseEvent | undefined;
  export let dpr: number = 1;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  // export let filter: ActivityLayerFilter | undefined;
  export let hasUpdateDirectivePermission: boolean = false;
  export let focus: FocusEvent | undefined;
  export let labelMode: 'on' | 'auto' | 'off' = 'on';
  export let mode: 'packed' | 'grouped' = 'packed';
  export let mousedown: MouseEvent | undefined;
  export let mousemove: MouseEvent | undefined;
  export let mouseout: MouseEvent | undefined;
  export let mouseup: MouseEvent | undefined;
  export let planEndTimeDoy: string;
  export let plan: Plan | null = null;
  export let planStartTimeYmd: string;
  export let selectedActivityDirectiveId: ActivityDirectiveId | null = null;
  export let selectedSpanId: SpanId | null = null;
  export let showDirectives: boolean = true;
  export let showSpans: boolean = true;
  export let simulationDataset: SimulationDataset | null = null;
  export let spanUtilityMaps: SpanUtilityMaps;
  export let spansMap: SpansMap = {};
  export let timelineInteractionMode: TimelineInteractionMode;
  export let timelineLockStatus: TimelineLockStatus;
  export let user: User | null;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let spans: Span[] = [];

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

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let nativeDirectiveIconWidth: number = 16;
  let dragCurrentX: number | null = null;
  let dragOffsetX: number | null = null;
  let dragPreviousX: number | null = null;
  let dragActivityDirectiveActive: ActivityDirective | null = null;
  let dragStartX: number | null = null;
  let maxActivityWidth: number;
  let planStartTimeMs: number;
  let quadtreeActivityDirectives: Quadtree<QuadtreeRect>;
  let quadtreeSpans: Quadtree<QuadtreeRect>;
  let quadtreeHeatmap: Quadtree<QuadtreeRect>;
  // let spanTimeBoundCache: Record<SpanId, SpanTimeBounds> = {};
  let visibleActivityDirectivesById: Record<ActivityDirectiveId, ActivityDirective> = {};
  let visibleSpansById: Record<SpanId, Span> = {};
  let visibleHeatmapBoxesById: Record<ActivityDirectiveId, ActivityDirective> = {};
  let xScaleViewRangeMax: number;

  let activityDirectiveTimeCache = {};

  // Asset cache
  const assets: {
    anchorIcon: HTMLImageElement | null;
    directiveIcon: HTMLImageElement | null;
    directiveIconShape: Path2D | null;
    directiveIconShapeStroke: Path2D | null;
    hashMarks: HTMLImageElement | null;
    pattern: HTMLCanvasElement | null;
  } = {
    anchorIcon: null,
    directiveIcon: null,
    directiveIconShape: null,
    directiveIconShapeStroke: null,
    hashMarks: null,
    pattern: null,
  };
  const textMetricsCache: Record<string, TextMetrics> = {};

  $: onBlur(blur);
  $: onContextmenu(contextmenu);
  $: onDblclick(dblclick);
  $: onFocus(focus);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: onMouseup(mouseup);

  $: scaleFactor = activityHeight / nativeDirectiveIconWidth;
  $: directiveIconWidth = nativeDirectiveIconWidth * scaleFactor;
  $: anchorIconWidth = directiveIconWidth * scaleFactor;
  $: anchorIconMarginLeft = 4 * scaleFactor;
  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: directiveIconMarginRight = 2 * scaleFactor;
  $: rowHeight = activityHeight + activityRowPadding;
  $: spanLabelLeftMargin = 6;
  $: timelineLocked = timelineLockStatus === TimelineLockStatus.Locked;
  $: planStartTimeMs = getUnixEpochTime(getDoyTime(new Date(planStartTimeYmd)));
  $: if (xScaleView !== null) {
    xScaleViewRangeMax = xScaleView.range()[1];
  }

  $: if (
    activityDirectives &&
    // activityColor &&
    activityHeight &&
    showDirectives !== undefined &&
    showSpans !== undefined &&
    canvasHeightDpr &&
    canvasWidthDpr &&
    ctx &&
    drawHeight &&
    drawWidth &&
    dpr &&
    // filter &&
    selectedActivityDirectiveId !== undefined &&
    selectedSpanId !== undefined &&
    spansMap &&
    mode &&
    viewTimeRange &&
    xScaleView &&
    spans &&
    labelMode &&
    activityLayerGroups
  ) {
    draw();
  }

  onMount(() => {
    preloadStaticAssets();
  });

  onDestroy(() => removeKeyDownEvent());

  function preloadStaticAssets() {
    if (canvas) {
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }
    assets.directiveIcon = loadSVG(ActivityDirectiveIconSVG);
    assets.anchorIcon = loadSVG(ActivityAnchorIconSVG);
    assets.hashMarks = loadSVG(SpanHashMarksSVG);
    assets.directiveIconShape = new Path2D(
      'M0 0.470589C0 0.21069 0.21069 0 0.470588 0H8C12.4183 0 16 3.58172 16 8V8C16 12.4183 12.4183 16 8 16H0.470589C0.21069 16 0 15.7893 0 15.5294V0.470589Z',
    );
    assets.directiveIconShapeStroke = new Path2D(
      'M0.5 15.5V0.5H8C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5H0.5Z',
    );
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

  function dragActivityDirectiveStart(activityDirectives: ActivityDirective[], offsetX: number): void {
    if (activityDirectives.length) {
      const [activityDirective] = activityDirectives; // Select just the first one for now.

      const x = getUnixEpochTimeFromInterval(planStartTimeYmd, activityDirective.start_offset);
      if (xScaleView !== null) {
        dragOffsetX = offsetX - xScaleView(x);
      }
      dragActivityDirectiveActive = activityDirective; // Pointer of the active drag activity.
      dragStartX = x;
      dragCurrentX = x;
      dragPreviousX = x;
    }
  }

  function dragActivityDirective(offsetX: number): void {
    if (!timelineLocked && dragActivityDirectiveActive && dragOffsetX !== null && xScaleView !== null) {
      const x = offsetX - dragOffsetX;
      const xMs = xScaleView.invert(x).getTime();
      dragCurrentX = typeof dragActivityDirectiveActive.anchor_id === 'number' ? xMs : Math.max(xMs, planStartTimeMs);
      if (dragCurrentX !== dragPreviousX) {
        const start_offset = getIntervalUnixEpochTime(planStartTimeMs, dragCurrentX);
        dragActivityDirectiveActive.start_offset = start_offset; // Update activity in memory.
        dragPreviousX = dragCurrentX;
        draw();
      }
    }
  }

  function dragActivityEnd(): void {
    if (dragActivityDirectiveActive !== null && dragStartX !== null && dragCurrentX !== null) {
      if (dragStartX !== dragCurrentX && plan) {
        const start_offset = getIntervalUnixEpochTime(planStartTimeMs, dragCurrentX);
        effects.updateActivityDirective(plan, dragActivityDirectiveActive.id, { start_offset }, null, user);
      }

      dragActivityDirectiveActive = null;
      dragCurrentX = null;
      dragOffsetX = null;
      dragStartX = null;
      dragPreviousX = null;
    }
  }

  function removeKeyDownEvent() {
    if (browser) {
      document.removeEventListener('keydown', onKeyDown);
    }
  }

  function onBlur(e: FocusEvent | undefined) {
    if (e) {
      removeKeyDownEvent();
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (isDeleteEvent(event) && !!selectedActivityDirectiveId && hasUpdateDirectivePermission) {
      dispatch('deleteActivityDirective', selectedActivityDirectiveId);
    }
  }

  function onFocus(e: FocusEvent | undefined) {
    if (e) {
      document.addEventListener('keydown', onKeyDown);
    }
  }

  function getDirectivesAndSpansForOffset(offsetX: number, offsetY: number) {
    const activityDirectives = searchQuadtreeRect<ActivityDirective>(
      quadtreeActivityDirectives,
      offsetX,
      offsetY,
      activityHeight,
      maxActivityWidth,
      visibleActivityDirectivesById,
    );
    const spans = searchQuadtreeRect<Span>(
      quadtreeSpans,
      offsetX,
      offsetY,
      activityHeight,
      maxActivityWidth,
      visibleSpansById,
    );
    return { activityDirectives, spans };
  }

  function onMousedown(e: MouseEvent | undefined): void {
    // Do not process events if meta/ctrl is pressed to avoid interaction conflicts with zoom/pan
    if (e && timelineInteractionMode === TimelineInteractionMode.Interact && e.button !== 1) {
      const { offsetX, offsetY } = e;
      const { activityDirectives, spans } = getDirectivesAndSpansForOffset(offsetX, offsetY);

      /**
       * The setTimeout is needed to prevent a race condition with mousedown events and change events.
       * Without the setTimeout, mousedown events happen before change events in the activity directive form.
       * This caused invalid updates to activity parameters.
       * Make sure you understand the linked issue before changing this code!
       * @see https://github.com/NASA-AMMOS/aerie-ui/issues/590
       */
      setTimeout(() => {
        dispatch('mouseDown', { activityDirectives, e, spans });
        if (!isRightClick(e)) {
          dragActivityDirectiveStart(activityDirectives, offsetX);
        }
      });
    }
  }

  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX, offsetY } = e;
      let activityDirectives: ActivityDirective[] = [];
      let spans: Span[] = [];
      if (mode === 'grouped') {
        const hits = getDirectivesAndSpansForOffset(offsetX, offsetY);
        activityDirectives = hits.activityDirectives;
        spans = hits.spans;
      } else {
        activityDirectives = searchQuadtreeRect<ActivityDirective>(
          quadtreeHeatmap,
          offsetX,
          offsetY,
          activityHeight,
          maxActivityWidth,
          visibleHeatmapBoxesById,
        );
        spans = activityDirectives
          .map(directive => {
            const rootSpan = getSpanForActivityDirective(directive);
            if (rootSpan) {
              const spanChildren = (spanUtilityMaps.spanIdToChildIdsMap[rootSpan.id] || []).map(id => spansMap[id]);
              return [rootSpan].concat(spanChildren);
            }
            return [];
          })
          .flat();
      }

      /* TODO tooltip renders offscreen if there are too many items, maybe show a more compact tooltip summary in heatmap mode hover? */
      dispatch('mouseOver', { activityDirectives, e, spans });
      dragActivityDirective(offsetX);
    }
  }

  function onMouseout(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('mouseOver', { activityDirectives: [], e, spans: [] });
    }
  }

  function onMouseup(e: MouseEvent | undefined): void {
    if (e) {
      dragActivityEnd();
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
      const { activityDirectives, spans } = getDirectivesAndSpansForOffset(offsetX, offsetY);

      let newSelectedActivityDirectiveId = null;
      let newSelectedSpanId = null;
      if (activityDirectives.length > 0) {
        newSelectedActivityDirectiveId = activityDirectives[0].id;
      } else if (spans.length > 0) {
        newSelectedSpanId = spans[0].id;
      }
      dispatch('contextMenu', {
        e,
        origin: 'layer-activity',
        selectedActivityDirectiveId: newSelectedActivityDirectiveId ?? undefined,
        selectedSpanId: newSelectedSpanId ?? undefined,
      });
    }
  }

  function onDblclick(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('dblClick', {
        e,
        selectedActivityDirectiveId: selectedActivityDirectiveId ?? undefined,
        selectedSpanId: selectedSpanId ?? undefined,
      });
    }
  }

  function getXForDirective(activityDirective: ActivityDirective) {
    return getActivityDirectiveStartTimeMs(
      activityDirective.id,
      planStartTimeYmd,
      planEndTimeDoy,
      activityDirectivesMap,
      spansMap,
      spanUtilityMaps,
    );
  }

  function getSpanForActivityDirective(activityDirective: ActivityDirective): Span {
    const spanId = spanUtilityMaps.directiveIdToSpanIdMap[activityDirective.id];
    return spansMap[spanId];
  }

  function getDirectiveBounds(activityDirective: ActivityDirective): PointBounds {
    const { textWidth } = setLabelContext(activityDirective.name);
    const x = getXForDirective(activityDirective);
    const xCanvas = xScaleView?.(x) ?? 0;
    let xEndCanvas = xCanvas + textWidth + directiveIconWidth + directiveIconMarginRight;
    if (activityDirective.anchor_id !== null) {
      xEndCanvas += anchorIconWidth + anchorIconMarginLeft;
    }
    return {
      maxXCanvas: xEndCanvas,
      x,
      xCanvas,
      xEnd: x,
      xEndCanvas,
    };
  }

  function getSpanBounds(span: Span): BoundingBox | null {
    return drawSpans([span], 0, false);
  }

  function getLabelForSpan(span: Span, sticky: boolean = false): string {
    // Display an arrow to the left of a span label if the span is sticky
    return `${sticky ? '← ' : ''}${span.type}${span.duration === null ? ' (Unfinished)' : ''}`;
  }

  // Determine starting Y position for the activity directive, taking into account any associated spans
  // function placeActivityDirective(
  //   maxXPerY: Record<number, number>,
  //   directiveBounds: PointBounds,
  //   initialSpanBounds: BoundingBox | null,
  //   showDirectives: boolean = true,
  // ) {
  //   // Place the elements where they will fit in packed waterfall
  //   const directiveRowHeight = showDirectives ? rowHeight : 0;
  //   let i = directiveRowHeight;
  //   let directiveStartY = 0;
  //   let foundY = false;
  //   while (!foundY) {
  //     let maxDirectiveXForY = maxXPerY[i];
  //     const directiveXForYExists = maxDirectiveXForY !== undefined;
  //     const directiveFits =
  //       !directiveXForYExists || (directiveXForYExists && directiveBounds.xCanvas > maxDirectiveXForY);
  //     if (directiveFits) {
  //       if (!initialSpanBounds) {
  //         foundY = true;
  //         directiveStartY = i;
  //       } else {
  //         // Construct actual span bounds for this Y
  //         const adjustedSpanBounds = { ...initialSpanBounds };
  //         adjustedSpanBounds.maxY += i + rowHeight;
  //         // Check span bounds for each y
  //         let spanYCheckIndex = i + rowHeight;
  //         let allSpansFit = true;
  //         while (spanYCheckIndex <= adjustedSpanBounds.maxY) {
  //           // TODO span bounds could provide a maxXForY instead of absolute corner bounds?
  //           const maxXForSpanY = maxXPerY[spanYCheckIndex];
  //           // If the spans bbox is earlier than maxX for that Y we can't fit the bbox
  //           if (maxXForSpanY !== undefined && adjustedSpanBounds.minX < maxXForSpanY) {
  //             allSpansFit = false;
  //             break;
  //           }
  //           spanYCheckIndex += rowHeight;
  //         }
  //         if (allSpansFit) {
  //           foundY = true;
  //           directiveStartY = i;
  //         }
  //       }
  //     }
  //     // If the directive does not fit, try the next row
  //     i += rowHeight;
  //   }
  //   const newMaxXPerY = { ...maxXPerY };
  //   // Update maxXForY for directive if no entry exists at that Y or if the directive end x is greater than the existing entry
  //   if (newMaxXPerY[directiveStartY] === undefined || directiveBounds.maxXCanvas > newMaxXPerY[directiveStartY]) {
  //     newMaxXPerY[directiveStartY] = directiveBounds.maxXCanvas;
  //   }

  //   // Construct actual span bounds for this final Y
  //   const adjustedSpanBounds = initialSpanBounds
  //     ? { ...initialSpanBounds }
  //     : {
  //         maxX: 0,
  //         maxY: 0,
  //         minX: 0,
  //       };
  //   adjustedSpanBounds.maxY = directiveStartY + rowHeight + adjustedSpanBounds.maxY;
  //   let childrenYIterator = 0;
  //   let spanStartY = 0;
  //   if (initialSpanBounds) {
  //     childrenYIterator = directiveStartY + directiveRowHeight;
  //     spanStartY = initialSpanBounds.maxY + childrenYIterator;
  //     while (childrenYIterator < spanStartY) {
  //       // TODO span bounds could provide a maxXForY instead of absolute corner bounds?
  //       const maxXForSpanY = maxXPerY[childrenYIterator];
  //       if (maxXForSpanY === undefined || maxXForSpanY < initialSpanBounds.maxX) {
  //         newMaxXPerY[childrenYIterator] = initialSpanBounds.maxX;
  //       }
  //       childrenYIterator += rowHeight;
  //     }
  //   }
  //   return {
  //     directiveStartY,
  //     maxXPerY: newMaxXPerY,
  //     spanBounds: adjustedSpanBounds,
  //   };
  // }

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

      activityDirectiveTimeCache = {};
      quadtreeActivityDirectives = d3Quadtree<QuadtreeRect>()
        .x(p => p.x)
        .y(p => p.y)
        .extent([
          [0, 0],
          [drawWidth, drawHeight],
        ]);
      quadtreeSpans = d3Quadtree<QuadtreeRect>()
        .x(p => p.x)
        .y(p => p.y)
        .extent([
          [0, 0],
          [drawWidth, drawHeight],
        ]);
      quadtreeHeatmap = d3Quadtree<QuadtreeRect>()
        .x(p => p.x)
        .y(p => p.y)
        .extent([
          [0, 0],
          [drawWidth, drawHeight],
        ]);
      visibleActivityDirectivesById = {};
      visibleSpansById = {};
      visibleHeatmapBoxesById = {};
      if (mode === 'grouped') {
        drawGroupedMode();
      } else {
        drawPackedMode();
      }
    }
  }

  function drawPackedMode() {
    if (xScaleView !== null) {
      // Draw all directives and spans (combine)
      const directivesInView = [];
      const seenSpans = {};
      const itemsToDraw = [];
      if (showDirectives) {
        activityDirectives.forEach(directive => {
          // TODO obviously repetitive (see below), clean all of this up
          const directiveX = getXForDirective(directive);
          const directiveInBounds = directiveX >= viewTimeRange.start && directiveX < viewTimeRange.end;

          // TODO obviously repetitive (see below), clean all of this up
          let childSpanInBounds = false;
          const childSpan = getSpanForActivityDirective(directive);
          let spanTextMetrics;
          if (childSpan) {
            seenSpans[childSpan.id] = true;
            if (childSpan) {
              spanTextMetrics = textMetricsCache[childSpan.type] ?? ctx.measureText(childSpan.type);
            }
            // TODO store whether span is in view in the activityGroupTree thing? Maybe?
            const sticky =
              childSpan.startMs < viewTimeRange.start &&
              childSpan.startMs + childSpan.durationMs >= viewTimeRange.start;
            childSpanInBounds =
              sticky || (childSpan.startMs >= viewTimeRange.start && childSpan.startMs < viewTimeRange.end);

            // TODO mark span as seen and do not draw it after
          }
          if (directiveInBounds || (childSpanInBounds && showSpans)) {
            directivesInView.push(directive);
            let textMetrics = textMetricsCache[directive.name] ?? ctx.measureText(directive.name);
            itemsToDraw.push({
              startX: xScaleView(directiveX),
              span: childSpan,
              directive,
              directiveLabelWidth: textMetrics.width,
              ...(spanTextMetrics ? { spanLabelWidth: spanTextMetrics.width } : null),
            });
          }
        });
      }
      if (showSpans) {
        spans.forEach(span => {
          if (seenSpans[span.id]) {
            return;
          }
          const spanInBounds = span.startMs >= viewTimeRange.start && span.startMs < viewTimeRange.end;
          const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;
          if (sticky || spanInBounds) {
            let textMetrics = textMetricsCache[span.type] ?? ctx.measureText(span.type);
            itemsToDraw.push({
              span,
              startX: xScaleView(span.startMs),
              spanLabelWidth: textMetrics.width,
            });
          }
        });
      }
      if (itemsToDraw.length > 10000) {
        const text = `Draw limit (5000) exceeded (${itemsToDraw.length})`;
        const textMetrics = setLabelContext(text);
        ctx.fillText(text, drawWidth / 2 - textMetrics.textWidth / 2, drawHeight / 2, textMetrics.textWidth);
        return;
      }

      itemsToDraw.sort((a, b) => {
        // let aMs = a.span ? a.span.spanMs : a.directive ? a.directiveX : 0;
        // let bMs = b.span ? b.span.spanMs : b.directive ? b.directiveX : 0;
        return a.startX < b.startX ? -1 : 1;
      });
      const rows = {};
      itemsToDraw.forEach(item => {
        const { startX, directiveLabelWidth, span, spanLabelWidth, directive } = item;
        // let itemCanvasX = span ? spanCanvasX : directive ? directiveCanvasX : 0;
        const itemEndX = getItemEnd(item);
        console.log('itemEndX :>> ', itemEndX, item);
        // if (span) {
        //   itemEndX = Math.max(spanCanvasXEnd, labelMode === 'on' ? 4 + spanCanvasX + textMetrics.width : 0);
        // } else if (directive) {
        //   itemEndX = Math.max(directiveCanvasX + 2, labelMode === 'on' ? 4 + directiveCanvasX + textMetrics.width : 0);
        // }
        // span ? spanCanvasXEnd : directive ? directiveCanvasX : 0;
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
              max: maxX,
              items: existingItemsForRow.concat(item),
            };
          }
        }
      });
      const extraSpace = drawHeight - activityHeight;
      const rowCount = Object.keys(rows).length;
      Object.entries(rows).forEach(([_, entry], i) => {
        const { items } = entry;
        let yRow = i * (extraSpace / (rowCount - 1)) || 0;
        // If we can't have at least two rows then draw everything at 0
        if (activityHeight * 2 > drawHeight) {
          yRow = 4;
        }
        if (activityHeight) {
          drawRow(yRow, items, idToColorMaps);
        }
      });

      //   Object.entries(rows).forEach(([i, entry]) => {
      //     const { items } = entry;
      //     const yRow = i * (extraSpace / (rowCount - 1)) || 0;
      //     items.forEach(item => {
      //       const { span, directive, spanCanvasX, spanCanvasXEnd, directiveX, directiveCanvasX, label, textMetrics } =
      //         item;
      //       if (span) {
      //         const width = Math.max(1, spanCanvasXEnd - spanCanvasX);
      //         ctx.fillStyle = hexToRgba(idToColorMaps.spans[span.id] || 'red', 0.5);
      //         ctx.fillRect(spanCanvasX, yRow, width, rectHeight);
      //       }
      //       if (directive) {
      //         ctx.fillStyle = hexToRgba(shadeColor(idToColorMaps.directives[directive.id] || '#FF0000', 1.2), 1);
      //         ctx.fillRect(directiveCanvasX, yRow, 2, rectHeight);
      //       }
      //       if (labelMode === 'on') {
      //         // const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      //         // TODO optimize not measure the text?
      //         const { textMetrics } = setLabelContext(label, 'black');
      //         ctx.fillText(
      //           label,
      //           Math.max((spanCanvasX ?? directiveCanvasX) + 4, 2),
      //           yRow + activityHeight / 2,
      //           textMetrics.width,
      //         );
      //       }
      //     });
      //   });
      //   return;
    }
  }

  function getItemEnd(item) {
    let labelEndX = 0;
    let boxEndX = 0;
    if (item.directive && showDirectives) {
      boxEndX = 2;
      if (labelMode !== 'off') {
        labelEndX = item.startX + 4 + item.directiveLabelWidth; // TODO figure out how to codify the spacing of a directive
      }
    }
    if (item.span && showSpans) {
      const spanEndX = xScaleView(item.span.endMs);
      boxEndX = Math.max(boxEndX, spanEndX);
      if (labelMode !== 'off') {
        labelEndX = Math.max(labelEndX, item.startX + 4 + item.spanLabelWidth);
      }
    }
    return Math.max(boxEndX, labelEndX);
  }

  function drawRow(y, items, idToColorMaps, defaultColor = '#cbcbcb') {
    // Determine label visibility
    let labelsToDraw = [];
    let newDefaultColor = '';
    let lastTextEnd = Number.NEGATIVE_INFINITY;
    // TODO maybe hide all labels at some point? Experiment with this.
    items.forEach(item => {
      if (!xScaleView) {
        return;
      }

      const { directiveLabelWidth, spanLabelWidth, startX, span, directive } = item;

      let endX = startX + 2 + directiveLabelWidth; // directive
      // TODO move to arg
      const height = rowHeight - 4;
      // TODO should we filter out spans in the activityLayerGroups instead of here and in RowHeaderActivityTree?
      if (span && showSpans) {
        // Draw span
        const spanStartX = xScaleView(span.startMs);
        const spanEndX = xScaleView(span.endMs); // TODO store in item
        const spanRectWidth = Math.max(2, Math.min(spanEndX, drawWidth) - spanStartX);
        const spanColor = idToColorMaps.spans[span.id] || defaultColor;
        newDefaultColor = spanColor;
        // if (spanColor) {
        //   defaultChildrenColor = spanColor;
        // }
        if (selectedSpanId === span.id) {
          ctx.fillStyle = activitySelectedColor;
        } else {
          const color = hexToRgba(spanColor, 0.5);
          ctx.fillStyle = color;
        }
        ctx.fillRect(spanStartX, y, spanRectWidth, height);
        endX = Math.max(endX, spanEndX);

        // Draw label if no directive
        if (!directive || !showDirectives) {
          if (labelMode === 'on' || (labelMode === 'auto' && spanStartX > lastTextEnd)) {
            const { labelText } = setLabelContext(span.type, 'black');
            labelsToDraw.push({
              labelText,
              x: spanStartX + 4,
              y: y + activityHeight / 2,
              width: spanLabelWidth,
            });
            lastTextEnd = spanStartX + spanLabelWidth;
          }
        }

        // Add to quadtree
        visibleSpansById[span.id] = span;
        quadtreeSpans.add({
          height,
          id: span.id,
          width: Math.max(spanLabelWidth, spanRectWidth),
          x: spanStartX,
          y,
        });
      }
      if (directive && showDirectives) {
        // Draw directive
        const directiveColor = idToColorMaps.directives[directive.id] || defaultColor;
        const color = hexToRgba(shadeColor(directiveColor || '#FF0000', 1.2), 1);
        newDefaultColor = color;
        const directiveMs = getXForDirective(directive); // Rename getDirectiveStartTime
        const directiveStartX = xScaleView(directiveMs);
        if (selectedActivityDirectiveId === directive.id) {
          ctx.fillStyle = activitySelectedColor;
        } else {
          ctx.fillStyle = color;
        }
        ctx.fillRect(directiveStartX, y, 2, rowHeight - 4);

        // Draw label
        if (labelMode === 'on' || (labelMode === 'auto' && directiveStartX > lastTextEnd)) {
          const { labelText } = setLabelContext(directive.type, 'black');
          labelsToDraw.push({
            labelText,
            x: directiveStartX + 4,
            y: y + activityHeight / 2,
            width: directiveLabelWidth,
          });
          lastTextEnd = directiveStartX + directiveLabelWidth;
        }
        // Add to quadtree
        visibleActivityDirectivesById[directive.id] = directive;
        quadtreeActivityDirectives.add({
          height,
          id: directive.id,
          width: directiveLabelWidth + 2 + 4,
          x: directiveStartX,
          y,
        });
      }
    });
    setLabelContext('whatever', 'black');
    // console.log('labelsToDraw.length :>> ', labelsToDraw.length);

    // TODO guardrail, be smarter than this for labelMode="on"
    if (labelsToDraw.length < 1000) {
      labelsToDraw.forEach(({ labelText, x, y, width }) => {
        ctx.fillText(labelText, x, y, width);
      });
    }
  }

  function drawGroupedMode() {
    if (xScaleView !== null) {
      const collapsedMode = drawHeight < 25;
      let y = collapsedMode ? 0 : 23;
      const expectedRowHeight = 20;
      activityLayerGroups.forEach(group => {
        const newY = drawGroup(group, y, expectedRowHeight, !collapsedMode);
        if (!collapsedMode) {
          y = newY;
        }
      });
      const newRowHeight = y + 36;
      if (!collapsedMode && newRowHeight > 0 && drawHeight !== newRowHeight) {
        dispatch('updateRowHeight', { newHeight: newRowHeight });
      }
    }
  }

  function drawGroup(group, y, rowHeight, drawLine = true, color = '#FF0000') {
    let newY = y;
    if (drawLine) {
      ctx.strokeStyle = '#bec0c2';
      ctx.beginPath();
      ctx.moveTo(0, newY + rowHeight);
      ctx.lineTo(drawWidth, newY + rowHeight);
      ctx.stroke();
    }

    const directivesInView = [];
    const spansInView = [];
    const seenSpans = {};
    const items = [];
    (group.directives || []).forEach(directive => {
      const directiveX = getXForDirective(directive);
      const directiveInBounds = directiveX >= viewTimeRange.start && directiveX < viewTimeRange.end;

      // TODO obviously repetitive (see below), clean all of this up
      let childSpanInBounds = false;
      let childSpan;
      if (showSpans) {
        childSpan = getSpanForActivityDirective(directive);
        if (childSpan) {
          seenSpans[childSpan.id] = true;
          // const spanX = xScaleView(childSpan.startMs);
          // const spanXEnd = xScaleView(childSpan.endMs);
          // TODO store whether span is in view in the activityGroupTree thing? Maybe?
          const sticky =
            childSpan.startMs < viewTimeRange.start && childSpan.startMs + childSpan.durationMs >= viewTimeRange.start;
          childSpanInBounds =
            sticky || (childSpan.startMs >= viewTimeRange.start && childSpan.startMs < viewTimeRange.end);
        }
      }
      if (directiveInBounds || childSpanInBounds) {
        directivesInView.push(directive);
        let directiveTextMetrics = textMetricsCache[directive.name] ?? ctx.measureText(directive.name);
        let spanTextMetrics;
        if (childSpan) {
          spanTextMetrics = textMetricsCache[childSpan.type] ?? ctx.measureText(childSpan.type);
        }
        const directiveStartTime = getActivityDirectiveStartTimeMs(
          directive.id,
          planStartTimeYmd,
          planEndTimeDoy,
          activityDirectivesMap,
          spansMap,
          spanUtilityMaps,
          activityDirectiveTimeCache,
        );
        items.push({
          startX: xScaleView(directiveStartTime),
          directive,
          span: childSpan,
          directiveLabelWidth: directiveTextMetrics.width,
          ...(spanTextMetrics ? { spanLabelWidth: spanTextMetrics.width } : null),
        });
      }
    });
    // TODO add the spans that were not associated with directives
    if (group.spans) {
      group.spans.forEach(span => {
        if (seenSpans[span.id]) {
          return;
        }
        const spanInBounds = span.startMs >= viewTimeRange.start && span.startMs < viewTimeRange.end;
        const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;
        if (sticky || spanInBounds) {
          let spanTextMetrics = textMetricsCache[span.type] ?? ctx.measureText(span.type);
          items.push({
            span,
            startX: xScaleView(span.startMs),
            spanLabelWidth: spanTextMetrics.width,
          });
        }
      });
    }
    let defaultChildrenColor = '';
    // if (group.directives) {
    //   const directivesInViewTextLength = directivesInView.reduce((total, directive) => {
    //     // TODO stop measuring if we've already exceeded limit?
    //     let textMetrics = textMetricsCache[directive.name] ?? ctx.measureText(directive.name);
    //     return total + textMetrics.width;
    //   }, 0);
    //   let lastDirectiveTextEnd = -1;
    //   directivesInView.forEach(directive => {
    //     // TODO directive start time needs to use this function to take anchors into account, use this in Row and elsewhere
    //     // can pass the cache down?
    //     if (xScaleView) {
    //       // Draw bounds of child span
    //       if (showSpans) {
    //         const childSpan = getSpanForActivityDirective(directive);
    //         if (childSpan) {
    //           const spanX = xScaleView(childSpan.startMs);
    //           const spanXEnd = xScaleView(childSpan.endMs);
    //           const width = Math.max(1, spanXEnd - spanX);

    //           ctx.save();
    //           if (selectedSpanId === childSpan.id) {
    //             ctx.fillStyle = activitySelectedColor;
    //           } else {
    //             // TODO need to pass in the parent color for decomposition when the activity isn't included in the idToColorMap
    //             const spanColor = idToColorMaps.spans[childSpan.id] || color;
    //             if (spanColor) {
    //               defaultChildrenColor = spanColor;
    //             }
    //             const color = hexToRgba(spanColor || '#FF0000', 0.5);
    //             ctx.fillStyle = color;
    //           }
    //           ctx.fillRect(spanX, newY + 4, width, rowHeight - 4);
    //           ctx.restore();

    //           visibleSpansById[childSpan.id] = childSpan;
    //           quadtreeSpans.add({
    //             height: rowHeight - 4,
    //             id: childSpan.id,
    //             width: width,
    //             x: spanX,
    //             y: newY + 4,
    //           });
    //         }
    //       }

    //       if (showDirectives) {
    //         const directiveColor = idToColorMaps.directives[directive.id] || color;
    //         if (directiveColor) {
    //           defaultChildrenColor = directiveColor;
    //         }
    //         const color = hexToRgba(shadeColor(directiveColor || '#FF0000', 1.2), 1);
    //         ctx.fillStyle = color;
    //         // if (ctx.fillStyle !== color) {
    //         // }
    //         const directiveX = getXForDirective(directive);
    //         const directiveXCanvas = xScaleView(directiveX);
    //         if (selectedActivityDirectiveId === directive.id) {
    //           ctx.fillStyle = activitySelectedColor;
    //         }
    //         ctx.fillRect(directiveXCanvas, newY + 4, 2, rowHeight - 4);

    //         let directiveWidth = 2;
    //         // TODO save labels and draw them on top after rectangles are drawn
    //         if (directivesInViewTextLength <= drawWidth && lastDirectiveTextEnd < directiveXCanvas) {
    //           // ctx.save();
    //           const { labelText, textMetrics, textHeight } = setLabelContext(directive.name, 'black');
    //           ctx.fillText(
    //             labelText,
    //             directiveXCanvas + 4,
    //             newY + textHeight + (rowHeight - 4 - textHeight) / 2,
    //             textMetrics.width,
    //           );
    //           // ctx.restore();
    //           lastDirectiveTextEnd = directiveXCanvas + textMetrics.width;
    //           directiveWidth += textMetrics.width;
    //         }
    //         visibleActivityDirectivesById[directive.id] = directive;
    //         quadtreeActivityDirectives.add({
    //           height: rowHeight - 4,
    //           id: directive.id,
    //           width: directiveWidth,
    //           x: directiveXCanvas,
    //           y: newY + 4,
    //         });
    //       }
    //     }
    //   });
    // }
    if (group.spans && showSpans) {
      // TODO not an else if
      // Draw bounds of each child span
      // console.log('group.spans :>> ', group.spans);
      group.spans.forEach(span => {
        // TODO store whether span is in view in the activityGroupTree thing? Maybe?
        const spanInBounds = span.startMs >= viewTimeRange.start && span.startMs < viewTimeRange.end;
        const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;
        if (sticky || spanInBounds) {
          spansInView.push(span);
        }
      });
      let spansInViewTextLength = 0;
      // for (let i = 0; i < spansInView.length; i++) {
      //   const span = spansInView[i];
      //   let textMetrics = textMetricsCache[span.type] ?? ctx.measureText(span.type);
      //   spansInViewTextLength += textMetrics.width;
      //   // Break early if no text can be drawn
      //   if (spansInViewTextLength > drawWidth) {
      //     break;
      //   }
      // }
      // let lastTextEnd = -1;
      // // TODO fix this, obviously bad
      // // const spanColor = spansInView.length > 0 ? hexToRgba(spansInView[0].color, 0.5) : '#FFFFFF';
      // spansInView.forEach((span, i) => {
      //   const spanX = xScaleView(span.startMs);
      //   const spanXEnd = xScaleView(span.endMs);
      //   const width = Math.max(1, spanXEnd - spanX);
      //   const y = newY + 4;

      //   const spanColor = idToColorMaps.spans[span.id] || color;
      //   if (spanColor) {
      //     defaultChildrenColor = spanColor;
      //   }

      //   if (selectedSpanId === span.id) {
      //     ctx.fillStyle = activitySelectedColor;
      //   } else {
      //     ctx.fillStyle = hexToRgba(spanColor, 0.5);
      //   }
      //   ctx.fillRect(spanX, y, width, rowHeight - 4);

      //   if (spansInViewTextLength <= drawWidth && spanX > lastTextEnd) {
      //     ctx.save();
      //     const { labelText, textMetrics, textHeight } = setLabelContext(span.type, 'black');
      //     ctx.fillText(labelText, spanX + 4, newY + textHeight + (rowHeight - 4 - textHeight) / 2, textMetrics.width);
      //     ctx.restore();
      //     lastTextEnd = spanX + textMetrics.width;
      //   }

      //   visibleSpansById[span.id] = span;
      //   quadtreeSpans.add({
      //     height: rowHeight - 4,
      //     id: span.id,
      //     width: width,
      //     x: spanX,
      //     y: newY + 4,
      //   });
      // });
    }
    drawRow(newY + 4, items, idToColorMaps);
    newY += rowHeight;
    if (group.expanded && group.groups.length) {
      group.groups.forEach(childGroup => {
        newY = drawGroup(childGroup, newY, rowHeight, true, defaultChildrenColor);
      });
    }
    return newY;
  }

  // function drawActivityDirective(activityDirective: ActivityDirective, x: number, y: number) {
  //   visibleActivityDirectivesById[activityDirective.id] = activityDirective;

  //   const primaryHighlight = activityDirective.id === selectedActivityDirectiveId;
  //   const spanRootParent = getSpanRootParent(spansMap, selectedSpanId);
  //   const secondaryHighlight =
  //     selectedSpanId !== null && spanRootParent
  //       ? spanUtilityMaps.spanIdToDirectiveIdMap[spanRootParent.id] === activityDirective.id
  //       : false;

  //   // Handle opacity if a point is selected
  //   let opacity = 1;
  //   if (selectedActivityDirectiveId !== null || selectedSpanId !== null) {
  //     if (primaryHighlight) {
  //       opacity = 1;
  //     } else {
  //       opacity = 0.24;
  //     }
  //   }

  //   const svgIconOpacity = selectedActivityDirectiveId !== null && !primaryHighlight ? 0.4 : opacity;

  //   // Draw directive icon
  //   setActivityRectContext(primaryHighlight, secondaryHighlight, opacity);
  //   drawDirectiveIcon(x, y, svgIconOpacity);

  //   // Draw label
  //   const textMetrics = drawPointLabel(
  //     activityDirective.name,
  //     x + directiveIconWidth + directiveIconMarginRight,
  //     y + activityHeight / 2,
  //     primaryHighlight,
  //     secondaryHighlight,
  //   );
  //   let hitboxWidth = directiveIconWidth + directiveIconMarginRight + textMetrics.width;

  //   // Draw anchor icon
  //   if (activityDirective.anchor_id !== null) {
  //     drawAnchorIcon(x + hitboxWidth + 4, y, svgIconOpacity);
  //     hitboxWidth += anchorIconWidth + anchorIconMarginLeft;
  //   }

  //   quadtreeActivityDirectives.add({
  //     height: activityHeight,
  //     id: activityDirective.id,
  //     width: hitboxWidth,
  //     x,
  //     y,
  //   });

  //   // Update maxActivityWidth
  //   if (hitboxWidth > maxActivityWidth) {
  //     maxActivityWidth = hitboxWidth;
  //   }

  //   if (debugMode) {
  //     drawDebugHitbox(x, y, hitboxWidth, activityHeight);
  //   }
  // }

  // function drawSpan(span: Span, x: number, y: number, end: number, ghosted: boolean = false, sticky = false) {
  //   ctx.save();
  //   visibleSpansById[span.id] = span;
  //   const primaryHighlight = span.id === selectedSpanId;
  //   let secondaryHighlight = false;
  //   const unfinished = span.duration === null;
  //   const rootSpan = getSpanRootParent(spansMap, span.id);
  //   if (rootSpan && selectedActivityDirectiveId !== null) {
  //     const spanDirectiveId = spanUtilityMaps.spanIdToDirectiveIdMap[rootSpan.id];
  //     if (spanDirectiveId === selectedActivityDirectiveId) {
  //       secondaryHighlight = true;
  //     }
  //   }
  //   if (selectedSpanId) {
  //     const rootSelectedSpan = getSpanRootParent(spansMap, selectedSpanId);
  //     if (rootSelectedSpan && rootSelectedSpan.id === rootSpan?.id) {
  //       secondaryHighlight = true;
  //     }
  //   }
  //   // Handle opacity if a point is selected
  //   let opacity = 1;
  //   if (selectedActivityDirectiveId !== null || selectedSpanId !== null) {
  //     if (primaryHighlight) {
  //       opacity = 1;
  //     } else {
  //       opacity = 0.24;
  //     }
  //   }
  //   if (ghosted) {
  //     opacity = 0.24;
  //   }

  //   setActivityRectContext(primaryHighlight, secondaryHighlight, opacity, unfinished);

  //   // Draw span rect
  //   const activityWidth = Math.max(4.0, end - x);

  //   // Check for roundRect support, Firefox does not yet support this as of 3/21/2023
  //   const rect = new Path2D();
  //   if (rect.roundRect) {
  //     rect.roundRect(x, y, activityWidth, activityHeight, 2);
  //   } else {
  //     rect.rect(x, y, activityWidth, activityHeight);
  //   }

  //   // Draw span rect stroke
  //   if (ghosted) {
  //     ctx.setLineDash([3, 3]);
  //     ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.6})`;
  //   } else {
  //     ctx.setLineDash([]);
  //   }
  //   const strokeRect = new Path2D();
  //   // Check for roundRect support, Firefox does not yet support this as of 3/21/2023
  //   if (strokeRect.roundRect) {
  //     strokeRect.roundRect(x + 0.5, y + 0.5, activityWidth - 1, activityHeight - 1, 1);
  //   } else {
  //     strokeRect.rect(x + 0.5, y + 0.5, activityWidth - 1, activityHeight - 1);
  //   }
  //   ctx.fill(rect);
  //   ctx.stroke(strokeRect);

  //   // Draw hash marks if requested and if there is room
  //   if (ghosted && activityWidth > 8) {
  //     const patternCanvas = document.createElement('canvas');
  //     patternCanvas.width = 20;
  //     patternCanvas.height = 16;
  //     if (assets.hashMarks !== null) {
  //       patternCanvas?.getContext('2d')?.drawImage(assets.hashMarks, 0, 0);
  //     }
  //     ctx.save();
  //     ctx.translate(x, y);
  //     const pattern = ctx.createPattern(patternCanvas, 'repeat');
  //     if (pattern !== null) {
  //       ctx.fillStyle = pattern;
  //     }
  //     ctx.fillRect(0, 0, activityWidth, activityHeight);
  //     ctx.restore();
  //   }

  //   // TODO deprecate point.label.hidden
  //   // Draw label
  //   const textMetrics = drawPointLabel(
  //     getLabelForSpan(span, sticky),
  //     sticky ? Math.max(spanLabelLeftMargin, x + spanLabelLeftMargin) : x + spanLabelLeftMargin,
  //     y + activityHeight / 2,
  //     primaryHighlight,
  //     secondaryHighlight,
  //     unfinished,
  //   );

  //   const hitboxWidth = Math.max(activityWidth, textMetrics.width + spanLabelLeftMargin);
  //   quadtreeSpans.add({
  //     height: activityHeight,
  //     id: span.id,
  //     width: hitboxWidth,
  //     x,
  //     y,
  //   });

  //   if (hitboxWidth > maxActivityWidth) {
  //     maxActivityWidth = hitboxWidth;
  //   }

  //   if (debugMode) {
  //     drawDebugHitbox(x, y, hitboxWidth, activityHeight);
  //   }

  //   ctx.restore();
  // }

  // function drawSpans(spans: Span[], parentY: number, draw = true, ghosted = false): BoundingBox | null {
  //   console.log('drawing spans', spans.length);
  //   if (spans && xScaleView !== null) {
  //     const boundingBoxes: BoundingBox[] = [];

  //     let maxX = Number.MIN_SAFE_INTEGER;
  //     let maxTimeX = Number.MIN_SAFE_INTEGER;
  //     let maxY = Number.MIN_SAFE_INTEGER;
  //     let minX = Number.MAX_SAFE_INTEGER;
  //     let y = parentY + rowHeight;

  //     for (const span of spans) {
  //       // const { start, duration } = getSpanTimeBounds(span);
  //       const x = xScaleView(span.startMs);
  //       const endTimeX = xScaleView(span.startMs + span.durationMs);

  //       // The label should be sticky if the start of the span is clipped and the span is still in view
  //       const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;

  //       // Consider the span to be in view if the rect and label are in view or if the label should be sticky
  //       const rectWithLabelInView = x + spanLabelLeftMargin + setLabelContext(getLabelForSpan(span)).textWidth > 0;
  //       const spanInView = rectWithLabelInView || sticky;

  //       // Get the final text width now that we know if we're in sticky mode
  //       const { textWidth } = setLabelContext(getLabelForSpan(span, sticky));
  //       const textXEnd = Math.max(spanLabelLeftMargin, x + spanLabelLeftMargin) + textWidth;
  //       const xEnd = Math.max(endTimeX, textXEnd);

  //       for (const boundingBox of boundingBoxes) {
  //         if (x <= boundingBox.maxX) {
  //           y = boundingBox.maxY + (spanInView ? rowHeight : 0);
  //         }
  //       }

  //       // Only add to bounds if the span is in view
  //       if (spanInView) {
  //         if (draw) {
  //           drawSpan(span, x, y, endTimeX, ghosted, sticky);
  //         }
  //         if (x < minX) {
  //           minX = x;
  //         }
  //         if (xEnd > maxX) {
  //           maxX = xEnd;
  //         }
  //         if (endTimeX > maxTimeX) {
  //           maxTimeX = endTimeX;
  //         }
  //         if (y > maxY) {
  //           maxY = y;
  //         }
  //       }

  //       const spanChildren = spanUtilityMaps.spanIdToChildIdsMap[span.id].map(id => spansMap[id]);
  //       if (spanChildren) {
  //         const childrenBoundingBox: BoundingBox | null = drawSpans(spanChildren, y, draw, ghosted);

  //         if (childrenBoundingBox) {
  //           if (childrenBoundingBox.minX < minX) {
  //             minX = childrenBoundingBox.minX;
  //           }
  //           if (childrenBoundingBox.maxX > maxX) {
  //             maxX = childrenBoundingBox.maxX;
  //           }
  //           if (childrenBoundingBox.maxY > maxY) {
  //             maxY = childrenBoundingBox.maxY;
  //           }
  //           if (childrenBoundingBox.maxTimeX > maxTimeX) {
  //             maxTimeX = childrenBoundingBox.maxTimeX;
  //           }
  //         }
  //       }

  //       boundingBoxes.push({ maxTimeX, maxX, maxY, minX });
  //     }

  //     return { maxTimeX, maxX, maxY, minX };
  //   }

  //   return null;
  // }

  function setLabelContext(labelText: string, color = '#000000') {
    const fontSize = 10;
    const fontFace = 'Inter';
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFace}`;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';
    let textMetrics = textMetricsCache[labelText] ?? ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    textMetricsCache[labelText] = textMetrics; // Cache to avoid recomputing this measurement
    return { labelText, textHeight, textMetrics, textWidth };
  }

  // function setActivityRectContext(
  //   primaryHighlight: boolean,
  //   secondaryHighlight: boolean,
  //   opacity: number,
  //   unfinished: boolean = false,
  // ) {
  //   // Set fill and stroke styles
  //   ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.2})`;
  //   if (unfinished) {
  //     ctx.fillStyle = hexToRgba(activityUnfinishedColor, opacity);
  //   } else if (primaryHighlight) {
  //     ctx.fillStyle = activitySelectedColor;
  //   } else if (secondaryHighlight) {
  //     ctx.fillStyle = hexToRgba(activitySelectedColor, 0.24);
  //   } else {
  //     ctx.fillStyle = hexToRgba(activityColor, opacity);
  //   }
  // }

  // function drawDirectiveIcon(x: number, y: number, svgOpacity: number) {
  //   // Draw the shape
  //   ctx.save();
  //   ctx.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
  //   ctx.scale(scaleFactor, scaleFactor);
  //   if (assets.directiveIconShape) {
  //     ctx.fill(assets.directiveIconShape);
  //   }
  //   if (assets.directiveIconShapeStroke) {
  //     ctx.stroke(assets.directiveIconShapeStroke);
  //   }
  //   ctx.restore();

  //   // Draw the icon
  //   ctx.globalAlpha = svgOpacity;
  //   if (assets.directiveIcon) {
  //     ctx.drawImage(assets.directiveIcon, x + 1, y, activityHeight, activityHeight);
  //   }
  //   ctx.globalAlpha = 1;
  // }

  function drawAnchorIcon(x: number, y: number, svgOpacity: number) {
    ctx.globalAlpha = svgOpacity;
    if (assets.anchorIcon) {
      ctx.drawImage(assets.anchorIcon, x, y);
    }
    ctx.globalAlpha = 1;
  }

  function drawPointLabel(
    text: string,
    x: number,
    y: number,
    primaryHighlight: boolean,
    secondaryHighlight: boolean,
    unfinished: boolean = false,
  ) {
    let color = activityColor;
    if (unfinished) {
      color = activityUnfinishedColor;
    }
    if (primaryHighlight || secondaryHighlight) {
      if (unfinished) {
        color = activityUnfinishedSelectedColor;
      } else {
        color = activitySelectedColor;
      }
    }

    let textOpacity = 1;
    if (selectedActivityDirectiveId !== null || selectedSpanId !== null) {
      if (!primaryHighlight) {
        if (secondaryHighlight) {
          textOpacity = 0.8;
        } else {
          textOpacity = 0.6;
        }
      }
    }

    const darkenFactor = unfinished ? 1.1 : 2.5;
    color = hexToRgba(shadeColor(color, darkenFactor), textOpacity); // Tint the color to be darker
    const { labelText, textMetrics } = setLabelContext(text, color);
    ctx.fillText(labelText, x, y, textMetrics.width);
    return textMetrics;
  }

  // function drawDebugHitbox(x: number, y: number, width: number, height: number) {
  //   ctx.save();
  //   ctx.strokeStyle = 'red';
  //   ctx.strokeRect(x, y, width, height);
  //   ctx.restore();
  // }

  // function drawDebugInfo(maxXPerY: Record<number, number>, height: number) {
  //   ctx.save();
  //   Object.keys(maxXPerY).forEach(key => {
  //     const x = parseFloat(`${maxXPerY[parseInt(key)]}`);
  //     const rect = new Path2D();
  //     rect.rect(x, parseInt(key), 2, rowHeight - 4);
  //     ctx.fillStyle = 'red';
  //     ctx.fill(rect);
  //     ctx.fillText(x.toFixed(2), x + 4, parseInt(key) + 8);
  //   });

  //   for (let i = 0; i < height; i += rowHeight) {
  //     ctx.strokeStyle = '#ff00002e';
  //     ctx.beginPath();
  //     ctx.moveTo(0, i);
  //     ctx.lineTo(canvasWidthDpr, i);
  //     ctx.stroke();
  //     ctx.fillText(i.toString(), 0, i, 20);
  //   }
  //   ctx.restore();
  // }
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
