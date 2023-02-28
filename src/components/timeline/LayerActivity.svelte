<svelte:options immutable={true} />

<script lang="ts">
  import { browser } from '$app/environment';
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import type { ScaleTime } from 'd3-scale';
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { activitiesMap } from '../../stores/activities';
  import { plan } from '../../stores/plan';
  import { spans } from '../../stores/simulation';
  import { timelineLockStatus } from '../../stores/views';
  import type { Activity, ActivityUniqueId } from '../../types/activity';
  import type { ActivityLayerFilter, ActivityPoint, BoundingBox, QuadtreeRect, TimeRange } from '../../types/timeline';
  import { decomposeActivityDirectiveId, sortActivities } from '../../utilities/activities';
  import { hexToRgba, pSBC } from '../../utilities/color';
  import effects from '../../utilities/effects';
  import { isDeleteEvent } from '../../utilities/keyboardEvents';
  import { getDoyTime, getDoyTimeFromDuration, getDurationInMs, getUnixEpochTime } from '../../utilities/time';
  import { searchQuadtreeRect, TimelineLockStatus } from '../../utilities/timeline';

  export let activities: Activity[] = [];
  export let activityColor: string = '';
  export let activityHeight: number = 16;
  export let activityRowPadding: number = 4;
  export let activitySelectedColor: string = '#81D4FA';
  export let activityUnfinishedColor: string = '#ff7760';
  export let blur: FocusEvent | undefined;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let filter: ActivityLayerFilter | undefined;
  export let id: number;
  export let focus: FocusEvent | undefined;
  export let mousedown: MouseEvent | undefined;
  export let mousemove: MouseEvent | undefined;
  export let mouseout: MouseEvent | undefined;
  export let mouseup: MouseEvent | undefined;
  export let selectedActivityId: ActivityUniqueId | null = null;
  export let showChildren: boolean = true;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let xScaleMax: ScaleTime<number, number> | null = null;

  const dispatch = createEventDispatcher();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let dpr: number = 1;
  let dragCurrentX: number | null = null;
  let dragOffsetX: number | null = null;
  let dragPoint: ActivityPoint | null = null;
  let dragStartX: number | null = null;
  let maxActivityWidth: number;
  let quadtree: Quadtree<QuadtreeRect>;
  let visiblePointsByUniqueId: Record<ActivityUniqueId, ActivityPoint> = {};

  // Debug
  const DRAW_HITBOXES = false;
  const DENSE_MODE = false;

  // Cache
  const assets: {
    directiveIcon: HTMLImageElement;
    pattern: HTMLCanvasElement;
  } = { directiveIcon: null, pattern: null };

  $: onBlur(blur);
  $: onFocus(focus);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: onMouseup(mouseup);

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: rowHeight = activityHeight + activityRowPadding;

  $: timelineLocked = $timelineLockStatus === TimelineLockStatus.Locked;

  $: windowMin = xScaleMax?.range()[1];
  $: windowMax = xScaleMax?.range()[0];
  $: windowStartTime = xScaleMax.invert(windowMax).getTime();
  $: windowEndTime = xScaleMax.invert(windowMin).getTime();

  $: if (
    activities &&
    activityColor &&
    activityHeight &&
    ctx &&
    drawHeight &&
    drawWidth &&
    filter &&
    selectedActivityId !== undefined &&
    viewTimeRange &&
    xScaleView
  ) {
    draw();
  }

  onMount(async () => {
    preloadStaticAssets();
  });

  onDestroy(() => removeKeyDownEvent());

  function preloadStaticAssets() {
    if (canvas) {
      ctx = canvas.getContext('2d');
      dpr = window.devicePixelRatio;

      // Preload font
      new FontFace('Inter', 'url(/Inter-Regular.woff2)').load();
    }

    const svg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.64">
    <path d="M12 8L6 11.4641L6 4.5359L12 8Z" fill="#1B1D1E"/>
    <line x1="3" y1="4" x2="3" y2="12" stroke="black" stroke-width="2"/>
    </g>
    </svg>
    `;
    assets.directiveIcon = loadSVG(svg);

    const hashes = `<svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_239_151857)">
      <line x1="0.387617" y1="-0.315836" x2="22.3876" y2="26.6842" stroke="red" stroke-opacity="1"/>
      <line x1="10.3876" y1="-0.315836" x2="32.3876" y2="26.6842" stroke="red" stroke-opacity="1"/>
      </g>
      <defs>
      <clipPath id="clip0_239_151857">
      <rect width="24" height="16" fill="white"/>
      </clipPath>
      </defs>
      </svg>`;

    const img = loadSVG(hashes);
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 24;
    patternCanvas.height = 16;
    patternCanvas.getContext('2d').drawImage(img, 0, 0);
    assets.pattern = patternCanvas;
  }

  function loadSVG(svgString) {
    var svg64 = window.btoa(svgString);
    var b64Start = 'data:image/svg+xml;base64,';
    // prepend a "header"
    var image64 = b64Start + svg64;
    const image = document.createElement('img');
    image.src = image64;
    return image;
  }

  /**
   * Recursively converts an Activity to an ActivityPoint.
   * Sorts child activity points in start time ascending order.
   */
  function activityToPoint(activity: Activity): ActivityPoint {
    const children = activity?.childUniqueIds
      ? [...activity.childUniqueIds]
          .sort((aId: ActivityUniqueId, bId: ActivityUniqueId): number => {
            const a = $activitiesMap[aId];
            const b = $activitiesMap[bId];

            if (a && b) {
              return sortActivities(a, b);
            }

            return 0;
          })
          .reduce((childActivityPoints, childUniqueId: ActivityUniqueId) => {
            const childActivity = $activitiesMap[childUniqueId];

            if (childActivity) {
              const childActivityPoint = activityToPoint(childActivity);
              childActivityPoints.push(childActivityPoint);
            }

            return childActivityPoints;
          }, [])
      : [];

    let activityLabelText = activity.name;

    if (activity.parent_id !== null) {
      activityLabelText = activity.type;
    }

    if (activity.unfinished) {
      activityLabelText = `${activityLabelText} (Unfinished)`;
    }

    const point: ActivityPoint = {
      anchor_id: activity.anchor_id,
      children,
      duration: getDurationInMs(activity.duration),
      id: activity.id,
      label: {
        color: activity.unfinished ? '#ff7760' : null,
        text: activityLabelText,
      },
      name: activity.name,
      parentUniqueId: activity.parentUniqueId,
      parent_id: activity.parent_id,
      simulated_activity_id: activity.simulated_activity_id,
      type: 'activity',
      unfinished: activity.unfinished,
      uniqueId: activity.uniqueId,
      x: getUnixEpochTime(activity.start_time_doy),
    };

    return point;
  }

  /**
   * Transforms activities to activity points for rendering.
   * Sorts activities in start time ascending order.
   */
  function activitiesToPoints(activities: Activity[]): ActivityPoint[] {
    return [...activities].sort(sortActivities).map(activity => activityToPoint(activity));
  }

  /**
   * @note We only allow dragging parent activities.
   */
  function dragActivityStart(points: ActivityPoint[], offsetX: number): void {
    if (points.length) {
      const [point] = points;
      if (point.parent_id === null) {
        dragOffsetX = offsetX - xScaleView(point.x);
        dragPoint = point;
        dragStartX = dragCurrentX = dragPoint.x;
      }
    }
  }

  function dragActivity(offsetX: number): void {
    // Only update the x position if the timeline is unlocked
    if (!timelineLocked && dragPoint && $activitiesMap[dragPoint.uniqueId]) {
      const x = offsetX - dragOffsetX;
      dragCurrentX = xScaleView.invert(x).getTime();
      const start_time_doy = getDoyTime(new Date(dragCurrentX));
      if (dragCurrentX !== dragPoint.x) {
        let time = start_time_doy;
        if (dragCurrentX < windowStartTime) {
          time = getDoyTime(new Date(windowStartTime));
        } else if (dragCurrentX > windowEndTime) {
          time = getDoyTime(new Date(windowEndTime));
        }
        $activitiesMap[dragPoint.uniqueId].start_time_doy = time;
        draw();
      }
    }
  }

  function dragActivityEnd(): void {
    if (dragPoint && dragStartX !== null && dragCurrentX !== null) {
      if (dragStartX !== dragCurrentX && $activitiesMap[dragPoint.uniqueId]) {
        // Constrain start time to plan bounds
        let start_time = new Date(dragCurrentX);
        if (dragCurrentX > windowEndTime) {
          start_time = new Date(windowEndTime);
        } else if (dragCurrentX < windowStartTime) {
          start_time = new Date(windowStartTime);
        }
        const start_time_doy = getDoyTime(start_time);

        const dragActivity = $activitiesMap[dragPoint.uniqueId];
        const { activityId, planId } = decomposeActivityDirectiveId(dragActivity.uniqueId);
        effects.updateActivityDirective(planId, activityId, { start_time_doy });
      }

      dragOffsetX = null;
      dragPoint = null;
      dragStartX = null;
      dragCurrentX = null;
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
    if (isDeleteEvent(event) && !!selectedActivityId) {
      dispatch('delete', selectedActivityId);
    }
  }

  function onFocus(e: FocusEvent | undefined) {
    if (e) {
      document.addEventListener('keydown', onKeyDown);
    }
  }

  function onMousedown(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX, offsetY } = e;
      const points = searchQuadtreeRect<ActivityPoint>(
        quadtree,
        offsetX,
        offsetY,
        activityHeight,
        maxActivityWidth,
        visiblePointsByUniqueId,
      );
      dispatch('mouseDown', { e, layerId: id, points });
      dragActivityStart(points, offsetX);
    }
  }

  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX, offsetY } = e;
      const points = searchQuadtreeRect<ActivityPoint>(
        quadtree,
        offsetX,
        offsetY,
        activityHeight,
        maxActivityWidth,
        visiblePointsByUniqueId,
      );
      dispatch('mouseOver', { e, layerId: id, points });
      dragActivity(offsetX);
    }
  }

  function onMouseout(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('mouseOver', { e, layerId: id, points: [] });
    }
  }

  function onMouseup(e: MouseEvent | undefined): void {
    if (e) {
      dragActivityEnd();
    }
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

      quadtree = d3Quadtree<QuadtreeRect>()
        .x(p => p.x)
        .y(p => p.y)
        .extent([
          [0, 0],
          [drawWidth, drawHeight],
        ]);
      visiblePointsByUniqueId = {};

      maxActivityWidth = Number.MIN_SAFE_INTEGER;
      let totalMaxY = Number.MIN_SAFE_INTEGER;
      const maxXPerY: Record<number, number> = {};

      const activityPoints: ActivityPoint[] = activitiesToPoints(activities);
      // const boundingBoxes: BoundingBox[] = [];
      for (const point of activityPoints) {
        const isParentActivity = !point.parent_id;

        if (isParentActivity && point.x + point.duration >= viewTimeRange.start && point.x <= viewTimeRange.end) {
          const directiveXCanvas = xScaleView(point.x);
          const { textWidth: directiveTextWidth } = setLabelContext(point);
          const directiveXEndCanvas = directiveXCanvas + 18 + directiveTextWidth; // 18 is directive icon plus 2px padding

          const matchingSpan = $spans.find(span => span.id === point.simulated_activity_id);
          let spanX;
          let spanXCanvas;
          let spanXEnd;
          let opacity = 1;
          let spanXEndCanvas;
          let spanXEndCanvasWithText;
          let directiveMoved = false;
          if (matchingSpan) {
            const spanStartDOY = getDoyTimeFromDuration($plan.start_time, matchingSpan.start_offset);
            // const spanEndDOY = getDoyTimeFromDuration($plan.start_time, matchingSpan.duration);
            spanX = getUnixEpochTime(spanStartDOY);
            spanXCanvas = xScaleView(spanX);
            spanXEnd = spanX + getDurationInMs(matchingSpan.duration);
            spanXEndCanvas = xScaleView(spanXEnd);
            spanXEndCanvasWithText = spanXEndCanvas + directiveTextWidth;
            directiveMoved = spanX !== point.x;
            opacity = directiveMoved ? 0.24 : 1;
          }

          let i = rowHeight;
          let directiveStartY = 0;
          let foundY = false;
          while (!foundY) {
            let maxDirectiveXForY = maxXPerY[i];
            let maxSpanXForY = maxXPerY[i + rowHeight];
            if (maxDirectiveXForY !== undefined) {
              if (directiveXCanvas > maxDirectiveXForY) {
                if (spanXCanvas === undefined || maxSpanXForY === undefined || spanXCanvas > maxSpanXForY) {
                  foundY = true;
                  directiveStartY = i;
                } else {
                  i += rowHeight;
                }
              } else {
                i += rowHeight;
              }
            } else {
              if (maxSpanXForY === undefined || spanXCanvas > maxSpanXForY) {
                foundY = true;
                directiveStartY = i;
              } else {
                i += rowHeight;
              }
            }
          }

          // Draw directive
          const maxCanvasRowY = Math.floor(drawHeight / rowHeight) * rowHeight;
          const constrainedDirectiveY =
            directiveStartY > drawHeight - rowHeight ? (directiveStartY % maxCanvasRowY) + rowHeight : directiveStartY;

          const finalDirectiveY = DENSE_MODE ? 0 : constrainedDirectiveY;

          drawActivity(point, directiveXCanvas, finalDirectiveY, directiveXEndCanvas);

          // Update maxXForY for directive
          if (maxXPerY[directiveStartY] !== undefined) {
            if (maxXPerY[directiveStartY] < directiveXEndCanvas) {
              maxXPerY[directiveStartY] = directiveXEndCanvas;
            }
          } else {
            maxXPerY[directiveStartY] = directiveXEndCanvas;
          }

          let spanStartY = 0;
          if (matchingSpan) {
            spanStartY = directiveStartY + rowHeight;
            // const constrainedSpanY = spanStartY % drawHeight;
            const constrainedSpanY =
              spanStartY > drawHeight - rowHeight ? (spanStartY % maxCanvasRowY) + rowHeight : spanStartY;

            const finalSpanY = DENSE_MODE ? rowHeight : constrainedSpanY;
            drawActivity(point, spanXCanvas, finalSpanY, spanXEndCanvas, {
              dashedStroke: directiveMoved,
              directive: false,
              drawHashes: directiveMoved,
              opacity,
            });
            // Update maxXForY for span
            if (maxXPerY[spanStartY] !== undefined) {
              if (maxXPerY[spanStartY] < spanXEndCanvasWithText) {
                maxXPerY[spanStartY] = spanXEndCanvasWithText;
              }
            } else {
              maxXPerY[spanStartY] = spanXEndCanvasWithText;
            }
          }

          totalMaxY = Math.max(totalMaxY, directiveStartY, spanStartY);
        }
      }

      const newHeight = totalMaxY + rowHeight;
      if (newHeight > 0 && drawHeight !== newHeight) {
        dispatch('updateRowHeight', { layerId: id, newHeight });
      }
    }
  }

  function drawActivity(
    point: ActivityPoint,
    x: number,
    y: number,
    end: number,
    config?: {
      dashedStroke?: boolean;
      directive?: boolean;
      directiveMoved?: boolean;
      drawHashes?: boolean;
      forceHideLabel?: boolean;
      opacity?: number;
    },
  ) {
    const { uniqueId } = point;
    const {
      dashedStroke = false,
      directive = true,
      directiveMoved = false,
      drawHashes = false,
      opacity = 1,
      forceHideLabel = false,
    } = config || {};

    let activityWidth = directive ? 16 : Math.max(4.0, end - x);
    if (DENSE_MODE && directive) {
      activityWidth = directive ? 4 : Math.max(4.0, end - x);
    }

    visiblePointsByUniqueId[uniqueId] = point;

    if (activityWidth > maxActivityWidth) {
      maxActivityWidth = activityWidth;
    }

    if (dashedStroke) {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }

    const finalOpacity = DENSE_MODE ? 0.2 : opacity;

    if (directiveMoved) {
      ctx.fillStyle = 'rgba(235, 236, 236, 1)';
      ctx.strokeStyle = 'rgba(0,0,0,0.24)';
    } else if (selectedActivityId === uniqueId) {
      // ctx.fillStyle = activitySelectedColor;
      ctx.fillStyle = `rgba(169, 234, 255,${finalOpacity})`;
      ctx.strokeStyle = `rgba(128,178,194, ${finalOpacity})`;
    } else if (point.unfinished) {
      ctx.fillStyle = activityUnfinishedColor;
      ctx.strokeStyle = '#C19065';
    } else {
      ctx.fillStyle = `rgba(254,189,133,${finalOpacity})`;
      if (DENSE_MODE) {
        ctx.strokeStyle = `rgba(0,0,0,${0.3})`;
      } else {
        ctx.strokeStyle = `rgba(0,0,0,${finalOpacity * 0.2})`;
      }
      // ctx.fillStyle = activityColor;
      ctx.fillStyle = hexToRgba(activityColor, finalOpacity);
    }

    // ctx.lineWidth = 1;
    if (directive && !DENSE_MODE) {
      const p1 = new Path2D(
        'M0 0.470589C0 0.21069 0.21069 0 0.470588 0H8C12.4183 0 16 3.58172 16 8V8C16 12.4183 12.4183 16 8 16H0.470589C0.21069 16 0 15.7893 0 15.5294V0.470589Z',
      );
      const p2 = new Path2D('M0.5 15.5V0.5H8C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5H0.5Z');
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
      ctx.fill(p1);
      ctx.stroke(p2);
      ctx.restore();
    } else {
      // Activity rect
      if (!DENSE_MODE) {
        const rect = new Path2D();
        rect.roundRect(x, y, activityWidth, activityHeight, 2);

        // Activity rect stroke
        const strokeRect = new Path2D();
        strokeRect.roundRect(x + 0.5, y + 0.5, activityWidth - 1, activityHeight - 1, 1);

        ctx.fill(rect);
        ctx.stroke(strokeRect);
      } else {
        const rect = new Path2D();
        rect.rect(x, y, activityWidth, activityHeight);

        // Activity rect stroke
        const strokeRect = new Path2D();
        strokeRect.rect(x + 0.5, y + 0.5, activityWidth - 1, activityHeight - 1);

        ctx.fill(rect);
        ctx.stroke(strokeRect);
      }
    }

    // Draw hash marks if requested and if there is room
    if (drawHashes && activityWidth > 8) {
      // TODO for some reason caching this before hand is leading to inconsistent loading of these hashes, solve this later
      // and for now draw every time

      const hashes = `<svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_239_151857)">
      <line x1="0.387617" y1="-0.315836" x2="22.3876" y2="26.6842" stroke="rgba(0, 0, 0, 0.1)" stroke-opacity="1"/>
      <line x1="10.3876" y1="-0.315836" x2="32.3876" y2="26.6842" stroke="rgba(0, 0, 0, 0.1)" stroke-opacity="1"/>
      </g>
      <defs>
      <clipPath id="clip0_239_151857">
      <rect width="24" height="16" fill="white"/>
      </clipPath>
      </defs>
      </svg>`;
      const img = loadSVG(hashes);
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 24;
      patternCanvas.height = 16;
      patternCanvas.getContext('2d').drawImage(img, 0, 0);
      // assets.pattern = patternCanvas;

      ctx.save();
      ctx.translate(x, y);
      // const p = ctx.createPattern(assets.pattern, 'repeat');
      const p = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillStyle = 'Red';
      ctx.fillStyle = p;
      ctx.fillRect(0, 0, activityWidth, activityHeight);
      ctx.restore();
    }

    const hideLabel = point.label?.hidden || forceHideLabel || false;
    let labelOffset = directive ? 18 : 5;
    let hitboxWidth = activityWidth;
    if (!hideLabel && !DENSE_MODE) {
      const color =
        selectedActivityId === uniqueId
          ? // ? `rgba(169, 234, 255,${opacity})`
            '#a9eaff'
          : activityColor;
      const { labelText, textMetrics } = setLabelContext(point, opacity !== 1 ? 0.8 : 1, color); // opacity obviously a hack for now
      ctx.fillText(labelText, x + labelOffset, y + activityHeight / 2, textMetrics.width);
      hitboxWidth = Math.max(hitboxWidth, textMetrics.width + labelOffset);
    }

    if (directive && !DENSE_MODE) {
      ctx.drawImage(assets.directiveIcon, x + 1, y);
    }

    if (DRAW_HITBOXES) {
      // Draw hitbox
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, hitboxWidth, activityHeight);
    }

    quadtree.add({
      height: activityHeight,
      id: uniqueId,
      width: hitboxWidth,
      x,
      y,
    });
  }

  function drawChildren(parent: ActivityPoint, parentY: number): BoundingBox | null {
    if (showChildren && parent?.children?.length) {
      const boundingBoxes: BoundingBox[] = [];

      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let y = parentY + rowHeight;

      for (const point of parent.children) {
        const x = xScaleView(point.x);
        const end = xScaleView(point.x + point.duration);
        const { textWidth } = setLabelContext(point);
        const xEnd = end + textWidth;

        for (const boundingBox of boundingBoxes) {
          if (x <= boundingBox.maxX) {
            y = boundingBox.maxY + rowHeight;
          }
        }

        drawActivity(point, x, y, end, { directive: false });

        if (xEnd > maxX) {
          maxX = xEnd;
        }
        if (y > maxY) {
          maxY = y;
        }

        const childrenBoundingBox: BoundingBox = drawChildren(point, y);

        if (childrenBoundingBox) {
          if (childrenBoundingBox.maxX > maxX) {
            maxX = childrenBoundingBox.maxX;
          }
          if (childrenBoundingBox.maxY > maxY) {
            maxY = childrenBoundingBox.maxY;
          }
        }

        boundingBoxes.push({ maxX, maxY });
      }

      return { maxX, maxY };
    }

    return null;
  }

  function setLabelContext(point: ActivityPoint, opacity = 1, color = '#000000') {
    const fontSize = point.label?.fontSize || 12;
    const fontFace = 'Inter';
    ctx.fillStyle = point.label?.color || hexToRgba(pSBC(0.15, '#000000', color, null), opacity);
    ctx.font = `${fontSize}px ${fontFace}`;
    ctx.textAlign = point.label?.align || 'start';
    ctx.textBaseline = point.label?.baseline || 'middle';
    const labelText = point.label?.text || '';
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    return { labelText, textHeight, textMetrics, textWidth };
  }
</script>

<canvas
  bind:this={canvas}
  height={canvasHeightDpr}
  id={`layer-activity-${id}`}
  style="height: {drawHeight}px; width: {drawWidth}px;"
  width={canvasWidthDpr}
/>

<style>
  canvas {
    position: absolute;
    z-index: -1;
  }
</style>
