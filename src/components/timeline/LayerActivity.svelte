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
  import type { Span } from '../../types/simulation';
  import type { ActivityLayerFilter, ActivityPoint, BoundingBox, QuadtreeRect, TimeRange } from '../../types/timeline';
  import { decomposeActivityDirectiveId, getActivityRootParent, sortActivities } from '../../utilities/activities';
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
  const DEBUG_MODE = false;

  // Cache
  const assets: {
    anchorIcon: HTMLImageElement;
    directiveIcon: HTMLImageElement;
    pattern: HTMLCanvasElement;
  } = { anchorIcon: null, directiveIcon: null, pattern: null };

  $: onBlur(blur);
  $: onFocus(focus);
  $: onMousedown(mousedown);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: onMouseup(mouseup);

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: rowHeight = activityHeight + activityRowPadding;
  $: directiveIconWidth = 16;
  $: directiveIconMarginRight = 2;
  $: spanLabelLeftMargin = 5;
  $: anchorIconWidth = 16;
  $: anchorIconMarginLeft = 4;

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

    const directiveIconSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.64">
    <path d="M12 8L6 11.4641L6 4.5359L12 8Z" fill="#1B1D1E"/>
    <line x1="3" y1="4" x2="3" y2="12" stroke="black" stroke-width="2"/>
    </g>
    </svg>
    `;
    assets.directiveIcon = loadSVG(directiveIconSVG);

    const anchorIconSVG = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_204_151850)">
      <path d="M13 10L6 10C4.89543 10 4 9.10457 4 8L4 3" stroke="#545F64" stroke-width="1.5"/>
      <rect x="8.5" y="8.5" width="7" height="3" rx="0.5" fill="white" stroke="#293137"/>
      <path d="M4 0L7.4641 5.25L0.535898 5.25L4 0Z" fill="#545F64"/>
      </g>
      <defs>
      <clipPath id="clip0_204_151850">
      <rect width="16" height="16" fill="white"/>
      </clipPath>
      </defs>
    </svg>
    `;
    assets.anchorIcon = loadSVG(anchorIconSVG);
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
  function activityToPoint(activity: Activity, _rootDirectiveID?: string): ActivityPoint {
    // Track the root directive ID. If this is a directive, take directive ID, otherwise take it from args.
    const rootDirectiveID = _rootDirectiveID ?? activity.uniqueId;
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
              const childActivityPoint = activityToPoint(childActivity, rootDirectiveID);
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
      rootDirectiveID,
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
    return [...activities].sort(sortActivities).map(activity => activityToPoint(activity, activity.uniqueId));
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

  function isPointPrimaryHighlight(selectedActivityId: string, activityID: string) {
    return selectedActivityId === activityID;
  }

  function isPointSecondaryHighlight(selectedActivityId: string, point: ActivityPoint) {
    // TODO probably not the most efficient
    return (
      getActivityRootParent($activitiesMap, selectedActivityId)?.uniqueId ===
      getActivityRootParent($activitiesMap, point?.uniqueId).uniqueId
    );
  }

  type PointBounds = {
    maxXCanvas: number;
    x: number;
    xCanvas: number;
    xEnd: number;
    xEndCanvas: number;
  };

  /* TODO make a text label size cache since it is unaffected by anything we can change aside from font size which we don't expose to user */

  function getDirectiveBounds(point: ActivityPoint): PointBounds {
    const { textWidth } = setLabelContext(point);
    const xCanvas = xScaleView(point.x);
    let xEndCanvas = xCanvas + textWidth + directiveIconWidth + directiveIconMarginRight;
    if (point.anchor_id) {
      xEndCanvas += anchorIconWidth + anchorIconMarginLeft;
    }
    return {
      maxXCanvas: xEndCanvas,
      x: point.x,
      xCanvas,
      xEnd: point.x + point.duration,
      xEndCanvas,
    };
  }
  function getSpanBounds(span: Span, directive: ActivityPoint): PointBounds {
    const { textWidth } = setLabelContext(directive);
    const startDOY = getDoyTimeFromDuration($plan.start_time, span.start_offset);
    const x = getUnixEpochTime(startDOY);
    const xCanvas = xScaleView(x);
    const xEnd = x + getDurationInMs(span.duration);
    let xEndCanvas = xScaleView(xEnd);
    // TODO should anchor icon show up on only the directive? What about the span and children?
    if (xEndCanvas) {
      return {
        maxXCanvas: Math.max(xEndCanvas, xCanvas + textWidth + spanLabelLeftMargin), // label offset, TODO don't hardcode,
        x,
        xCanvas,
        xEnd,
        xEndCanvas,
      };
    }
  }
  function getChildrenBounds(point: ActivityPoint): BoundingBox {
    return drawChildren(point, 0, true);
  }

  // Determine starting Y position for point, associated span, and any children
  function placeActivityPoint(point: ActivityPoint, maxXPerY: Record<number, number>) {
    // Get sizes of the points spawned by this point
    const directiveBounds = getDirectiveBounds(point); // Directive element
    let spanBounds: PointBounds;
    let childBounds: BoundingBox = null;

    // Get matching span bounds
    const matchingSpan = $spans.find(span => span.id === point.simulated_activity_id);
    if (matchingSpan) {
      // pointBounds.push(getSpanBounds(matchingSpan, point));
      spanBounds = getSpanBounds(matchingSpan, point);

      // Get child bounds
      childBounds = getChildrenBounds(point);
    }

    // Place the elements where they will fit in packed waterfall
    let i = rowHeight;
    let directiveStartY = 0;
    let foundY = false;
    while (!foundY) {
      let maxDirectiveXForY = maxXPerY[i];
      let maxSpanXForY = maxXPerY[i + rowHeight];
      const directiveXForYExists = maxDirectiveXForY !== undefined;
      const directiveFits =
        !directiveXForYExists || (directiveXForYExists && directiveBounds.xCanvas > maxDirectiveXForY);
      const spanXForYExists = maxSpanXForY !== undefined;
      const spanFits = !matchingSpan || !spanXForYExists || (spanXForYExists && spanBounds.xCanvas > maxSpanXForY);

      // Check child bounds if the directive and span fit for their respective Y positions
      if (directiveFits && spanFits) {
        if (!childBounds) {
          foundY = true;
          directiveStartY = i;
        } else {
          // Construct actual child bounds for this Y
          const actualChildBounds = { ...childBounds };
          actualChildBounds.maxY += i + rowHeight;
          // Check child bounds for each y
          let childYCheckIndex = i + rowHeight;
          let childrenFit = true;
          while (childYCheckIndex <= actualChildBounds.maxY) {
            // TODO child bounds could provide a maxXForY instead of absolute corner bounds?
            const maxXForChildY = maxXPerY[childYCheckIndex];
            // If the children bbox is earlier than maxX for that Y we can't fit the bbox
            if (maxXForChildY !== undefined && actualChildBounds.minX < maxXForChildY) {
              childrenFit = false;
              break;
            }
            childYCheckIndex += rowHeight;
          }
          if (childrenFit) {
            foundY = true;
            directiveStartY = i;
          }
        }
      }
      i += rowHeight;
    }

    const newMaxXPerY = { ...maxXPerY };

    // Update maxXForY for directive if no entry exists at that Y or if the directive end x is greater than the existing entry
    if (newMaxXPerY[directiveStartY] === undefined || directiveBounds.maxXCanvas > newMaxXPerY[directiveStartY]) {
      newMaxXPerY[directiveStartY] = directiveBounds.maxXCanvas;
    }

    // Update maxXForY for span if no entry exists at that Y or if the span end x is greater than the existing entry
    let spanStartY = 0;
    if (matchingSpan) {
      spanStartY = directiveStartY + rowHeight;
      if (newMaxXPerY[spanStartY] === undefined || newMaxXPerY[spanStartY] < spanBounds.maxXCanvas) {
        newMaxXPerY[spanStartY] = spanBounds.maxXCanvas;
      }
    }

    // Construct actual child bounds for this final Y
    const actualChildBounds = { ...childBounds };
    actualChildBounds.maxY = spanStartY + rowHeight + actualChildBounds.maxY;
    let childrenYIterator = 0;
    let childStartY = 0;
    if (childBounds) {
      childrenYIterator = spanStartY + rowHeight;
      childStartY = childBounds.maxY + childrenYIterator;
      while (childrenYIterator < childStartY) {
        // TODO child bounds could provide a maxXForY instead of absolute corner bounds?
        const maxXForChildY = maxXPerY[childrenYIterator];
        if (maxXForChildY === undefined || maxXForChildY < childBounds.maxX) {
          newMaxXPerY[childrenYIterator] = childBounds.maxX;
        }
        childrenYIterator += rowHeight;
      }
    }

    return {
      childBounds: actualChildBounds,
      childStartY,
      directiveBounds,
      directiveStartY,
      maxXPerY: newMaxXPerY,
      spanBounds,
      spanStartY,
    };
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
      let maxXPerY: Record<number, number> = {};

      const activityPoints: ActivityPoint[] = activitiesToPoints(activities);
      for (const point of activityPoints) {
        const isParentActivity = !point.parent_id;
        if (isParentActivity && point.x + point.duration >= viewTimeRange.start && point.x <= viewTimeRange.end) {
          const {
            childBounds,
            directiveStartY,
            directiveBounds,
            maxXPerY: newMaxXPerY,
            spanBounds,
            spanStartY,
          } = placeActivityPoint(point, maxXPerY);

          maxXPerY = newMaxXPerY;
          const directiveMoved = !!spanBounds && spanBounds.x !== directiveBounds.x;

          // Draw directive
          const maxCanvasRowY = Math.floor(drawHeight / rowHeight) * rowHeight;
          const constrainedDirectiveY =
            directiveStartY > drawHeight - rowHeight ? (directiveStartY % maxCanvasRowY) + rowHeight : directiveStartY;
          drawActivity(point, directiveBounds.xCanvas, constrainedDirectiveY, directiveBounds.xEndCanvas);

          // Draw span (faking for now)
          if (spanBounds) {
            // const constrainedSpanY = spanStartY % drawHeight;
            const constrainedSpanY =
              spanStartY > drawHeight - rowHeight ? (spanStartY % maxCanvasRowY) + rowHeight : spanStartY;
            drawSpan(point, spanBounds.xCanvas, constrainedSpanY, spanBounds.xEndCanvas, directiveMoved);
          }

          // Draw children
          // TODO get children overdraw working
          // TODO get the children start Y, could be diff from spanStartY
          const childStartY = spanStartY;
          const childHeight = childBounds ? childBounds.maxY - spanStartY : 0;
          const constrainedChildrenY =
            childStartY > drawHeight - childHeight ? (childStartY % maxCanvasRowY) + rowHeight : childStartY;
          drawChildren(point, childStartY, false, directiveMoved);

          if (childBounds) {
            if (DEBUG_MODE) {
              console.log('constrainedChildrenY :>> ', constrainedChildrenY);
              console.log('childBounds.maxY :>> ', childBounds.maxY);
              console.log('childStartY :>> ', childStartY);
              console.log('childHeight :>> ', childHeight);
              // Draw child bbox
              const rect = new Path2D();
              rect.rect(
                childBounds.minX,
                constrainedChildrenY + rowHeight,
                childBounds.maxX - childBounds.minX,
                childBounds.maxY - childStartY - rowHeight,
              );
              ctx.strokeStyle = 'green';
              ctx.stroke(rect);
            }
          }

          totalMaxY = Math.max(totalMaxY, directiveStartY, spanStartY, childBounds?.maxY || 0);
        }
      }
      if (DEBUG_MODE) {
        console.log(maxXPerY);
        Object.keys(maxXPerY).forEach(key => {
          const x = maxXPerY[key];
          const rect = new Path2D();
          rect.rect(x, parseInt(key), 2, rowHeight - 4);
          ctx.fillStyle = 'red';
          ctx.fill(rect);
          ctx.fillText(x, x + 4, parseInt(key) + 8);
        });
      }

      const newHeight = totalMaxY + rowHeight;
      if (newHeight > 0 && drawHeight !== newHeight) {
        dispatch('updateRowHeight', { layerId: id, newHeight });
      }
    }
  }

  function drawActivity(point: ActivityPoint, x: number, y: number, end: number) {
    ctx.save();
    const { uniqueId } = point;
    visiblePointsByUniqueId[uniqueId] = point;

    const primaryHighlight = isPointPrimaryHighlight(selectedActivityId, uniqueId); // TODO names not great
    const secondaryHighlight = isPointSecondaryHighlight(selectedActivityId, point);

    // Handle opacity if a point is selected
    let opacity = 1;
    if (selectedActivityId) {
      if (primaryHighlight) {
        opacity = 1;
      } else {
        opacity = 0.24;
      }
    }

    // TODO share with drawSpan
    if (primaryHighlight) {
      // ctx.fillStyle = activitySelectedColor;
      ctx.fillStyle = `rgba(169, 234, 255,${1})`;
      ctx.strokeStyle = `rgba(128,178,194, ${1})`;
    } else if (secondaryHighlight) {
      // ctx.fillStyle = activitySelectedColor;
      ctx.fillStyle = `rgba(169, 234, 255,${0.24})`;
      ctx.strokeStyle = `rgba(128,178,194, ${0.24})`;
    } else if (point.unfinished) {
      ctx.fillStyle = activityUnfinishedColor;
      ctx.strokeStyle = '#C19065';
    } else {
      ctx.fillStyle = `rgba(254,189,133,${opacity})`;
      ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.2})`;
      // ctx.fillStyle = activityColor;
      ctx.fillStyle = hexToRgba(activityColor, opacity);
    }

    // Draw directive shape TODO split out
    const p1 = new Path2D(
      'M0 0.470589C0 0.21069 0.21069 0 0.470588 0H8C12.4183 0 16 3.58172 16 8V8C16 12.4183 12.4183 16 8 16H0.470589C0.21069 16 0 15.7893 0 15.5294V0.470589Z',
    );
    const p2 = new Path2D('M0.5 15.5V0.5H8C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5H0.5Z');
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
    ctx.fill(p1);
    ctx.stroke(p2);
    ctx.restore();

    // Draw directive icon
    ctx.globalAlpha = selectedActivityId && !primaryHighlight ? 0.4 : opacity;
    ctx.drawImage(assets.directiveIcon, x + 1, y);
    ctx.globalAlpha = 1;

    const color = primaryHighlight || secondaryHighlight ? activitySelectedColor : activityColor;

    let textOpacity = !primaryHighlight ? 0.75 : 1;
    if (selectedActivityId && !primaryHighlight) {
      textOpacity = 0.6;
    }
    const { labelText, textMetrics } = setLabelContext(point, textOpacity, color); // opacity obviously a hack for now
    ctx.fillText(
      labelText,
      x + directiveIconWidth + directiveIconMarginRight,
      y + activityHeight / 2,
      textMetrics.width,
    );
    let hitboxWidth = directiveIconWidth + directiveIconMarginRight + textMetrics.width;

    // Draw anchor icon
    if (point.anchor_id) {
      ctx.globalAlpha = selectedActivityId && !primaryHighlight ? 0.4 : opacity;
      ctx.drawImage(assets.anchorIcon, x + hitboxWidth + 4, y);
      ctx.globalAlpha = 1;
      hitboxWidth += anchorIconWidth + anchorIconMarginLeft;
    }

    if (DEBUG_MODE) {
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

    if (hitboxWidth > maxActivityWidth) {
      maxActivityWidth = hitboxWidth;
    }

    ctx.restore();
  }

  function drawSpan(point: ActivityPoint, x: number, y: number, end: number, ghosted: boolean) {
    ctx.save();
    const { uniqueId } = point;
    visiblePointsByUniqueId[uniqueId] = point;

    const primaryHighlight = isPointPrimaryHighlight(selectedActivityId, uniqueId);
    const secondaryHighlight = isPointSecondaryHighlight(selectedActivityId, point);

    // Compute opacity
    let opacity = 1;
    if (ghosted) {
      opacity = 0.24;
    }
    // Handle opacity if a point is selected
    if (selectedActivityId) {
      if (primaryHighlight) {
        opacity = 1;
      } else {
        opacity = 0.24;
      }
    }

    // Set fill and stroke styles
    if (primaryHighlight) {
      // ctx.fillStyle = activitySelectedColor;
      ctx.fillStyle = 'rgba(169, 234, 255, 1)';
      ctx.strokeStyle = 'rgba(128, 178, 194, 1)';
    } else if (secondaryHighlight) {
      // ctx.fillStyle = activitySelectedColor;
      ctx.fillStyle = `rgba(169, 234, 255,${0.24})`;
      ctx.strokeStyle = `rgba(128,178,194, ${0.24})`;
    } else if (point.unfinished) {
      ctx.fillStyle = activityUnfinishedColor;
      ctx.strokeStyle = '#C19065';
    } else {
      ctx.fillStyle = `rgba(254,189,133,${opacity})`;
      ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.2})`;
      // ctx.fillStyle = activityColor;
      ctx.fillStyle = hexToRgba(activityColor, opacity);
    }

    if (ghosted) {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }

    // Draw span
    const activityWidth = Math.max(4.0, end - x);
    const rect = new Path2D();
    rect.roundRect(x, y, activityWidth, activityHeight, 2);

    // Activity rect stroke
    const strokeRect = new Path2D();
    strokeRect.roundRect(x + 0.5, y + 0.5, activityWidth - 1, activityHeight - 1, 1);

    ctx.fill(rect);
    ctx.stroke(strokeRect);

    // Draw hash marks if requested and if there is room
    if (ghosted && activityWidth > 8) {
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
      ctx.fillStyle = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillRect(0, 0, activityWidth, activityHeight);
      ctx.restore();
    }

    // TODO deprecate point.label.hidden
    let hitboxWidth = activityWidth;
    const color = primaryHighlight || secondaryHighlight ? activitySelectedColor : activityColor;
    let textOpacity = ghosted && !primaryHighlight ? 0.75 : 1;
    if (selectedActivityId && !primaryHighlight) {
      textOpacity = 0.6;
    }

    const { labelText, textMetrics } = setLabelContext(point, textOpacity, color);
    ctx.fillText(labelText, x + spanLabelLeftMargin, y + activityHeight / 2, textMetrics.width);
    hitboxWidth = Math.max(hitboxWidth, textMetrics.width + spanLabelLeftMargin);

    quadtree.add({
      height: activityHeight,
      id: uniqueId,
      width: hitboxWidth,
      x,
      y,
    });

    if (DEBUG_MODE) {
      DEBUG_drawHitbox(x, y, hitboxWidth, activityHeight);
    }
    ctx.restore();
  }

  function DEBUG_drawHitbox(x: number, y: number, width: number, height: number) {
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  function drawChildren(parent: ActivityPoint, parentY: number, skipDraw: boolean = false, ghosted: boolean = false) {
    if (showChildren && parent?.children?.length) {
      const boundingBoxes: BoundingBox[] = [];

      let minX = Number.MAX_SAFE_INTEGER;
      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let y = parentY + rowHeight;

      for (const point of parent.children) {
        const x = xScaleView(point.x);
        const end = xScaleView(point.x + point.duration);
        const { textWidth } = setLabelContext(point);
        let xEnd = Math.max(end, x + textWidth + spanLabelLeftMargin); // TODO make this cleaner

        for (const boundingBox of boundingBoxes) {
          if (x <= boundingBox.maxX) {
            y = boundingBox.maxY + rowHeight;
          }
        }

        if (!skipDraw) {
          drawSpan(point, x, y, end, ghosted);
        }

        if (x < minX) {
          minX = x;
        }
        if (xEnd > maxX) {
          maxX = xEnd;
        }
        if (y > maxY) {
          maxY = y;
        }

        const childrenBoundingBox: BoundingBox = drawChildren(point, y, skipDraw, ghosted);

        if (childrenBoundingBox) {
          if (childrenBoundingBox.minX < minX) {
            minX = childrenBoundingBox.minX;
          }
          if (childrenBoundingBox.maxX > maxX) {
            maxX = childrenBoundingBox.maxX;
          }
          if (childrenBoundingBox.maxY > maxY) {
            maxY = childrenBoundingBox.maxY;
          }
        }

        boundingBoxes.push({ maxX, maxY, minX });
      }

      return { maxX, maxY, minX };
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
