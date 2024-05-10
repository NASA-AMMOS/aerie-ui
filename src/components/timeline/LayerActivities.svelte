<svelte:options immutable={true} />

<script lang="ts">
  import { browser } from '$app/environment';
  import ActivityAnchorIconSVG from '@nasa-jpl/stellar/icons/activity_anchor.svg?raw';
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import { type ScaleTime } from 'd3-scale';
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { ViewDefaultActivityOptions } from '../../enums/view';
  import type { ActivityDirective, ActivityDirectiveId, ActivityDirectivesMap } from '../../types/activity';
  import type { User } from '../../types/app';
  import type { Plan } from '../../types/plan';
  import type { Span, SpanId, SpansMap, SpanUtilityMaps } from '../../types/simulation';
  import type {
    ActivityOptions,
    MouseDown,
    MouseOver,
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
  import {
    directiveInView,
    searchQuadtreeRect,
    spanInView,
    TimelineInteractionMode,
    TimelineLockStatus,
  } from '../../utilities/timeline';

  export let activityDirectives: ActivityDirective[] = [];
  export let activityGroups = [];
  export let activityOptions: ActivityOptions = { ...ViewDefaultActivityOptions };
  export let idToColorMaps = { directives: {}, spans: {} };
  export let activityDirectivesMap: ActivityDirectivesMap = {};
  export let activityRowPadding: number = 4;
  export let activitySelectedColor: string = '#a9eaff';
  export let activityDefaultColor = '#cbcbcb';
  export let activityUnfinishedSelectedColor: string = '#ff3b19';
  export let activityUnfinishedColor: string = '#fc674d';
  export let blur: FocusEvent | undefined;
  export let contextmenu: MouseEvent | undefined;
  export let dblclick: MouseEvent | undefined;
  export let dpr: number = 1;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let hasUpdateDirectivePermission: boolean = false;
  export let focus: FocusEvent | undefined;
  export let labelPaddingLeft: number = 2;
  export let maxLabelCount: number = 1000;
  export let maxPackedActivityCount: number = 10000;
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
  let dragCurrentX: number | null = null;
  let dragOffsetX: number | null = null;
  let dragPreviousX: number | null = null;
  let dragActivityDirectiveActive: ActivityDirective | null = null;
  let dragStartX: number | null = null;
  let maxActivityWidth: number;
  let planStartTimeMs: number;
  let quadtreeActivityDirectives: Quadtree<QuadtreeRect>;
  let quadtreeSpans: Quadtree<QuadtreeRect>;
  let visibleActivityDirectivesById: Record<ActivityDirectiveId, ActivityDirective> = {};
  let visibleSpansById: Record<SpanId, Span> = {};
  let colorCache: Record<string, string> = {};
  // let xScaleViewRangeMax: number;

  // Asset cache
  const assets: { anchorIcon: HTMLImageElement | null } = { anchorIcon: null };
  const textMetricsCache: Record<string, TextMetrics> = {};

  $: onBlur(blur);
  $: onContextmenu(contextmenu);
  $: onDblclick(dblclick);
  $: onFocus(focus);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: onMouseup(mouseup);

  // TODO bring anchor icon back
  // $: scaleFactor = activityHeight / nativeDirectiveIconWidth;
  // $: anchorIconWidth = directiveIconWidth * scaleFactor;
  // $: anchorIconMarginLeft = 4 * scaleFactor;
  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  // $: directiveIconMarginRight = 2 * scaleFactor;
  $: rowHeight = activityOptions.displayMode === 'compact' ? activityOptions.activityHeight + activityRowPadding : 16;
  // $: spanLabelLeftMargin = 6;
  $: timelineLocked = timelineLockStatus === TimelineLockStatus.Locked;
  $: planStartTimeMs = getUnixEpochTime(getDoyTime(new Date(planStartTimeYmd)));
  // $: if (xScaleView !== null) {
  //   xScaleViewRangeMax = xScaleView.range()[1];
  // }

  $: if (
    activityDirectives &&
    showDirectives !== undefined &&
    showSpans !== undefined &&
    canvasHeightDpr &&
    canvasWidthDpr &&
    ctx &&
    drawHeight &&
    drawWidth &&
    dpr &&
    selectedActivityDirectiveId !== undefined &&
    selectedSpanId !== undefined &&
    spansMap &&
    activityOptions &&
    viewTimeRange &&
    xScaleView &&
    spans &&
    activityGroups
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
        dragActivityDirectiveActive.start_time_ms = getActivityDirectiveStartTimeMs(
          dragActivityDirectiveActive.id,
          planStartTimeYmd,
          planEndTimeDoy,
          activityDirectivesMap,
          spansMap,
          spanUtilityMaps,
        );

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
      activityOptions.activityHeight,
      maxActivityWidth,
      visibleActivityDirectivesById,
    );
    const spans = searchQuadtreeRect<Span>(
      quadtreeSpans,
      offsetX,
      offsetY,
      activityOptions.activityHeight,
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
      const hits = getDirectivesAndSpansForOffset(offsetX, offsetY);
      activityDirectives = hits.activityDirectives;
      spans = hits.spans;

      /* TODO tooltip renders offscreen if there are too many items even when limited to 6 with a +x more */
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

  function getSpanForActivityDirective(activityDirective: ActivityDirective): Span {
    const spanId = spanUtilityMaps.directiveIdToSpanIdMap[activityDirective.id];
    return spansMap[spanId];
  }

  function getLabelForSpan(span: Span): string {
    // Display an arrow to the left of a span label if the span is sticky
    // The label should be sticky if the start of the span is clipped and the span is still in view
    const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;
    return `${sticky ? '← ' : ''}${span.type}${span.duration === null ? ' (Unfinished)' : ''}`;
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

      visibleActivityDirectivesById = {};
      visibleSpansById = {};
      if (activityOptions.displayMode === 'grouped') {
        drawGroupedMode();
      } else if (activityOptions.displayMode === 'compact') {
        drawCompactMode();
      } else {
        console.warn('Unsupported LayerActivity displayMode: ', activityOptions.displayMode);
      }
    }
  }

  function drawCompactMode() {
    if (xScaleView !== null) {
      // Draw all directives and spans (combine)
      const seenSpans = {};
      const itemsToDraw = [];
      if (showDirectives) {
        activityDirectives.forEach(directive => {
          // TODO obviously repetitive (see below), clean all of this up
          const directiveX = directive.start_time_ms || 0;

          // TODO obviously repetitive (see below), clean all of this up
          let childSpanInView = false;
          const childSpan = getSpanForActivityDirective(directive);
          if (childSpan) {
            seenSpans[childSpan.id] = true;
            childSpanInView = spanInView(childSpan, viewTimeRange);
          }
          if (directiveInView(directive, viewTimeRange) || (childSpanInView && showSpans)) {
            itemsToDraw.push({
              startX: xScaleView(directiveX),
              span: childSpan,
              directive,
            });
          }
        });
      }
      if (showSpans) {
        spans.forEach(span => {
          if (seenSpans[span.id]) {
            return;
          }
          if (spanInView(span, viewTimeRange)) {
            itemsToDraw.push({
              span,
              startX: xScaleView(span.startMs),
            });
          }
        });
      }
      if (itemsToDraw.length > maxPackedActivityCount) {
        const text = `Activity drawing limit (${maxPackedActivityCount}) exceeded (${itemsToDraw.length})`;
        const textMetrics = setLabelContext(text);
        ctx.fillText(text, drawWidth / 2 - textMetrics.textWidth / 2, drawHeight / 2, textMetrics.textWidth);
        return;
      }

      itemsToDraw.sort((a, b) => {
        return a.startX < b.startX ? -1 : 1;
      });
      const rows = {};
      itemsToDraw.forEach(item => {
        const { startX } = item;
        const itemEndX = getItemEnd(item);
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
      const extraSpace = drawHeight - activityOptions.activityHeight;
      const rowCount = Object.keys(rows).length;
      Object.entries(rows).forEach(([_, entry], i) => {
        const { items } = entry;
        let yRow = i * (extraSpace / (rowCount - 1)) || 0;
        // If we can't have at least two rows then draw everything at 0
        if (activityOptions.activityHeight * 2 > drawHeight) {
          yRow = 4;
        }
        if (activityOptions.activityHeight) {
          drawRow(yRow, items, idToColorMaps);
        }
      });
    }
  }

  function getItemEnd(item) {
    const { span, directive, startX } = item;
    let labelEndX = 0;
    let boxEndX = 0;
    if (directive && showDirectives) {
      boxEndX = 2;
      if (activityOptions.labelVisibility !== 'off') {
        labelEndX = Math.max(startX, 4) + 4 + measureText(directive.name, textMetricsCache).width; // TODO figure out how to codify the spacing of a directive
      }
    }
    if (span && showSpans) {
      const spanEndX = xScaleView(span.endMs);
      boxEndX = Math.max(boxEndX, spanEndX);
      if (activityOptions.labelVisibility !== 'off') {
        labelEndX = Math.max(
          labelEndX,
          Math.max(4, startX) + 4 + measureText(getLabelForSpan(span), textMetricsCache).width,
        );
      }
    }
    return Math.max(boxEndX, labelEndX);
  }

  function drawRow(y, items, idToColorMaps) {
    const drawLabels = activityOptions.labelVisibility === 'on' || activityOptions.labelVisibility === 'auto';
    let labelsToDraw = [];
    items.forEach(item => {
      if (!xScaleView) {
        return;
      }

      const { span, directive } = item;

      // TODO should we filter out spans in the activityGroups instead of here and in RowHeaderActivityTree?
      if (span && showSpans && spanInView(span, viewTimeRange)) {
        // Draw span
        let spanLabelWidth = 0;
        const unfinished = span.duration === null;
        const spanStartX = xScaleView(span.startMs);
        const spanEndX = xScaleView(span.endMs);
        const spanRectWidth = Math.max(2, Math.min(spanEndX, drawWidth) - spanStartX);
        const spanColor = idToColorMaps.spans[span.id] || activityDefaultColor;
        const isSelected = selectedSpanId === span.id;
        if (isSelected) {
          if (unfinished) {
            ctx.fillStyle = activityUnfinishedSelectedColor;
          } else {
            ctx.fillStyle = activitySelectedColor;
          }
        } else if (unfinished) {
          ctx.fillStyle = shadeColor(activityUnfinishedColor, 1.2);
        } else {
          const color = getRGBAFromHex(spanColor, 0.5);
          ctx.fillStyle = color;
        }
        ctx.fillRect(spanStartX, y, spanRectWidth, rowHeight);

        // Draw label if no directive
        if (drawLabels && (!directive || !showDirectives)) {
          const label = getLabelForSpan(span);
          spanLabelWidth = measureText(label, textMetricsCache).width;
          labelsToDraw.push({
            unfinished,
            color: spanColor,
            isSelected,
            labelText: label,
            x: spanStartX + 4, // TODO sort out label left sticky with packing
            y: y + rowHeight / 2,
            width: spanLabelWidth,
          });
        }

        // Add to quadtree
        visibleSpansById[span.id] = span;
        quadtreeSpans.add({
          height: rowHeight,
          id: span.id,
          width: Math.max(spanLabelWidth, spanRectWidth),
          x: spanStartX,
          y,
        });
      }
      if (directive && showDirectives && directiveInView(directive, viewTimeRange)) {
        // Draw directive
        const directiveColor = idToColorMaps.directives[directive.id] || activityDefaultColor;
        const color = hexToRgba(shadeColor(directiveColor || '#FF0000', 1.2), 1);
        const directiveMs = directive.start_time_ms || 0;
        const directiveStartX = xScaleView(directiveMs);
        const isSelected = selectedActivityDirectiveId === directive.id;
        let directiveLabelWidth = 0;
        if (isSelected) {
          ctx.fillStyle = activitySelectedColor;
        } else {
          ctx.fillStyle = color;
        }
        ctx.fillRect(directiveStartX, y, 2, rowHeight);

        // Draw label
        if (drawLabels) {
          directiveLabelWidth = measureText(directive.name, textMetricsCache).width;
          labelsToDraw.push({
            color: directiveColor,
            isSelected,
            labelText: directive.name,
            x: directiveStartX + 4,
            y: y + rowHeight / 2,
            width: directiveLabelWidth,
          });
        }
        // Add to quadtree
        visibleActivityDirectivesById[directive.id] = directive;
        quadtreeActivityDirectives.add({
          height: rowHeight,
          id: directive.id,
          width: directiveLabelWidth + labelPaddingLeft + 4, // TODO what is 4?
          x: directiveStartX,
          y,
        });
      }
    });

    // TODO guardrail, be smarter than this for activityOptions.labelVisibility="on"
    if (labelsToDraw.length < maxLabelCount) {
      setLabelContext('', 'black');
      labelsToDraw
        .sort((a, b) => (a.x < b.x ? -1 : 1))
        .forEach(({ color, isSelected, labelText, x, y, width, unfinished }, i) => {
          if (activityOptions.labelVisibility === 'auto') {
            const nextX = labelsToDraw[i + 1]?.x;
            if (typeof nextX === 'number' && x + width >= nextX) {
              return;
            }
          }
          if (isSelected) {
            if (unfinished) {
              ctx.fillStyle = activityUnfinishedSelectedColor;
            } else {
              ctx.fillStyle = '#0a4c7e';
            }
          } else if (unfinished) {
            ctx.fillStyle = ctx.fillStyle = shadeColor(activityUnfinishedColor, 1.3);
          } else {
            // TODO what color should we use for the text? Black or a darkened version of layer color?
            // If using shadeColor make sure to cache it
            ctx.fillStyle = shadeColor(color, 2.8);
            // ctx.fillStyle = 'black';
          }
          ctx.fillText(labelText, Math.max(x, 4), y, width);
        });
    }
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

  function drawGroupedMode() {
    if (xScaleView !== null) {
      const collapsedMode = drawHeight < 25;
      let y = collapsedMode ? 0 : 23;
      const expectedRowHeight = 20;
      activityGroups.forEach(group => {
        const newY = drawGroup(group, y, expectedRowHeight, !collapsedMode);
        if (!collapsedMode) {
          y = newY;
        }
      });
      const newRowHeight = y + 36;
      if (!collapsedMode && newRowHeight > 0 && drawHeight !== newRowHeight) {
        /* TODO a change from manual to auto height does not take effect until you trigger a redraw on this row, could pass in whether or not to update row height but that might be odd? */
        dispatch('updateRowHeight', { newHeight: newRowHeight });
      }
    }
  }

  function drawBottomLine(y: number, width: number) {
    ctx.strokeStyle = 'rgba(210, 210, 210, 1)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  function drawGroup(group, y, rowHeight, drawLine = true) {
    let newY = y;
    if (drawLine) {
      drawBottomLine(newY + rowHeight, drawWidth);
    }

    drawRow(newY + 4, group.items || [], idToColorMaps);
    newY += rowHeight;

    if (group.expanded && group.groups.length) {
      group.groups.forEach(childGroup => {
        newY = drawGroup(childGroup, newY, rowHeight, true);
      });
    }
    return newY;
  }

  function measureText(text, cache) {
    const cachedMeasurement = cache[text];
    if (cachedMeasurement) {
      return cachedMeasurement;
    }
    const measurement = ctx.measureText(text);
    cache[text] = measurement;
    return measurement;
  }

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

  function drawAnchorIcon(x: number, y: number, svgOpacity: number) {
    ctx.globalAlpha = svgOpacity;
    if (assets.anchorIcon) {
      ctx.drawImage(assets.anchorIcon, x, y);
    }
    ctx.globalAlpha = 1;
  }

  // function drawPointLabel(
  //   text: string,
  //   x: number,
  //   y: number,
  //   primaryHighlight: boolean,
  //   secondaryHighlight: boolean,
  //   unfinished: boolean = false,
  // ) {
  //   let color = activityColor;
  //   if (unfinished) {
  //     color = activityUnfinishedColor;
  //   }
  //   if (primaryHighlight || secondaryHighlight) {
  //     if (unfinished) {
  //       color = activityUnfinishedSelectedColor;
  //     } else {
  //       color = activitySelectedColor;
  //     }
  //   }

  //   let textOpacity = 1;
  //   if (selectedActivityDirectiveId !== null || selectedSpanId !== null) {
  //     if (!primaryHighlight) {
  //       if (secondaryHighlight) {
  //         textOpacity = 0.8;
  //       } else {
  //         textOpacity = 0.6;
  //       }
  //     }
  //   }

  //   const darkenFactor = unfinished ? 1.1 : 2.5;
  //   color = hexToRgba(shadeColor(color, darkenFactor), textOpacity); // Tint the color to be darker
  //   const { labelText, textMetrics } = setLabelContext(text, color);
  //   ctx.fillText(labelText, x, y, textMetrics.width);
  //   return textMetrics;
  // }

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
