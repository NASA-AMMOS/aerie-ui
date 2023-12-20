<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleLinear, ScalePoint, ScaleTime } from 'd3-scale';
  import { curveLinear, line as d3Line } from 'd3-shape';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { Resource } from '../../types/simulation';
  import type { Axis, LinePoint, ResourceLayerFilter, TimeRange } from '../../types/timeline';
  import { getYScale, minMaxDecimation } from '../../utilities/timeline';

  export let contextmenu: MouseEvent | undefined;
  export let dpr: number = 1;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  // TODO make an issue to remove these unneeded filters from LayerLine, LayerRange, etc
  export let filter: ResourceLayerFilter | undefined;
  export let id: number;
  export let decimate: boolean = false;
  export let interpolateHoverValue: boolean = false;
  export let limitTooltipToLine: boolean = false;
  export let lineColor: string = '';
  export let lineWidth: number = 1;
  export let mousemove: MouseEvent | undefined;
  export let mouseout: MouseEvent | undefined;
  export let pointRadius: number = 2;
  export let resources: Resource[] = [];
  export let showAsLinePlot: boolean = false;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let yAxes: Axis[] = [];
  export let yAxisId: number | null = null;

  const dispatch = createEventDispatcher();
  const WORK_TIME_THRESHOLD = 32; // ms to allow for processing time, beyond which remaining work will be split to a new frame

  let canvas: HTMLCanvasElement;
  let interactionCanvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let interactionCtx: CanvasRenderingContext2D | null;
  let mounted: boolean = false;
  let scaleDomain: Set<string> = new Set();
  let drawPointsRequest: number;
  let stateLinePlotYScale: ScalePoint<string>;
  let yScale: ScaleLinear<number, number, never>;
  let points: LinePoint[];
  let tempPoints: LinePoint[];
  let processingRequest: number;

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  $: if (
    decimate !== undefined &&
    interpolateHoverValue !== undefined &&
    limitTooltipToLine !== undefined &&
    canvasHeightDpr &&
    canvasWidthDpr &&
    drawHeight &&
    drawWidth &&
    dpr &&
    // TODO swap filter out for resources which are recomputed when the view changes (i.e. filter changes)
    filter &&
    lineColor !== undefined &&
    typeof lineWidth === 'number' &&
    typeof pointRadius === 'number' &&
    mounted &&
    showAsLinePlot !== undefined &&
    points &&
    viewTimeRange &&
    xScaleView &&
    yAxes &&
    yAxisId !== undefined
  ) {
    draw();
  }
  $: onContextMenu(contextmenu);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: processResourcesToLinePoints(resources);
  $: offscreenPoint = ctx && generateOffscreenPoint(lineColor, pointRadius);

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
    }
    if (interactionCanvas) {
      interactionCtx = interactionCanvas.getContext('2d');
    }
    mounted = true;
  });

  function computeYScale(yAxes: Axis[]): ScaleLinear<number, number> {
    const [yAxis] = yAxes.filter(axis => yAxisId === axis.id);
    const domain = yAxis?.scaleDomain || [];
    return getYScale(domain, drawHeight);
  }

  function processPoint(point: LinePoint, yScale: ScaleLinear<number, number>) {
    const { id, name, type } = point;
    const x = (xScaleView as ScaleTime<number, number, never>)(point.x);
    const y = yScale(point.y);
    return { id, name, type, x, y };
  }

  async function draw(): Promise<void> {
    if (ctx && xScaleView && interactionCtx) {
      window.cancelAnimationFrame(drawPointsRequest);
      await tick();

      // Clear interaction canvas on every draw since the data
      // or time range may have changed
      interactionCtx.clearRect(0, 0, drawWidth, drawHeight);

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, drawWidth, drawHeight);

      yScale = computeYScale(yAxes);

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      let line;

      // if (showAsLinePlot) {
      //   const domain = Array.from(scaleDomain);
      //   stateLinePlotYScale = scalePoint()
      //     .domain(domain.filter(filterEmpty))
      //     .range([drawHeight - CANVAS_PADDING_Y, CANVAS_PADDING_Y]) as ScalePoint<string>;

        line = d3Line<LinePoint>()
          .x(d => (xScaleView as ScaleTime<number, number, never>)(d.x))
          .y(d => stateLinePlotYScale(d.y?.toString()) as number)
          .defined(d => d.y !== null) // Skip any gaps in resource data instead of interpolating
          .curve(curveLinear);
      } else {
        line = d3Line<LinePoint>()
          .x(d => (xScaleView as ScaleTime<number, number, never>)(d.x))
          .y(d => yScale(d.y) as number)
          .defined(d => d.y !== null) // Skip any gaps in resource data instead of interpolating
          .curve(curveLinear);
      }

      // Collect points and gaps within view
      // Additionally track the two points (if they exist) bounding the
      // time range so they can be drawn to connect the bounding lines
      let finalPoints: LinePoint[] = [];
      const pointsInView: LinePoint[] = [];
      let leftPoint: LinePoint | null = null;
      let rightPoint: LinePoint | null = null;
      let prevPoint: LinePoint | null = null;
      const gapPoints: LinePoint[] = [];
      points.forEach(point => {
        if (point.x >= viewTimeRange.start && !leftPoint && prevPoint) {
          leftPoint = processPoint(prevPoint, yScale);
        }

        if (point.x > viewTimeRange.end && !rightPoint && prevPoint) {
          rightPoint = processPoint(point, yScale);
        }

        if (point.x >= viewTimeRange.start && point.x <= viewTimeRange.end) {
          // Ignore gaps
          if (point.y === null) {
            gapPoints.push(processPoint(point, yScale));
          } else {
            pointsInView.push(processPoint(point, yScale));
          }
        }
        prevPoint = point;
      });

      finalPoints = pointsInView;

      // Perform decimation if requested
      if (pointsInView.length > 0 && decimate) {
        finalPoints = minMaxDecimation<LinePoint>(
          pointsInView as { x: number; y: number }[], // At this point we have filtered out all gaps
          0,
          pointsInView.length,
          drawWidth,
        );
        // Push the last point in view again since decimation does not result in properly sorted points within a time bin
        const lastPoint = pointsInView.at(-1);
        if (lastPoint) {
          finalPoints.push(lastPoint);
        }
      }

      // Add back in gap points since they were not included in the decimation
      // TODO this can result in visual degradation of the signal when there are a significant number of gaps
      gapPoints.forEach(point => {
        // Find first point that comes after the specified point
        const gapRightPointIndex = finalPoints.findIndex(p => {
          return p.x > point.x || (p.x === point.x && p.id > point.id);
        });
        // If a position was found for the gap, insert it into the list
        if (gapRightPointIndex > -1) {
          finalPoints.splice(gapRightPointIndex, 0, point);
        } else {
          // TODO should this case be considered?
        }
      });

      // Add left and right points that are outside of the view only after decimation as to not throw off
      // the min-max binning of decimation since the l/r points could be far away offscreen
      if (leftPoint) {
        finalPoints.unshift(leftPoint);
      }

      if (rightPoint) {
        finalPoints.push(rightPoint);
      }

      // Allow for some wiggle room since we may have added up to 3 extra points – left, right, and last point
      // Also account for gap points that have not been included in pointsInView
      // TODO could also just do this when finalPoints < drawWidth but might be less performant?
      if (!decimate || Math.abs(finalPoints.length - gapPoints.length - pointsInView.length) < 4) {
        drawPointsRequest = window.requestAnimationFrame(() => drawPoints(finalPoints));
      }

      // Draw the line
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      const line = d3Line<LinePoint>()
        .defined(d => d.y !== null) // Skip any gaps in resource data instead of interpolating
        .x(d => d.x)
        .y(d => d.y as number)
        .curve(curveLinear);
      ctx.beginPath();
      line.context(ctx)(finalPoints);
      ctx.stroke();
      ctx.closePath();
    }
  }

  function drawPoints(points: LinePoint[]) {
    if (!ctx || !offscreenPoint) {
      return;
    }

    for (const point of points) {
      if (point.x >= viewTimeRange.start && point.x <= viewTimeRange.end) {
        const x = (xScaleView as ScaleTime<number, number, never>)(point.x);
        let y: number;

        if (showAsLinePlot) {
          y = stateLinePlotYScale(point.y?.toString()) as number;
        } else {
          y = yScale(point.y) as number;
        }

        if (y !== null) {
          ctx.drawImage(offscreenPoint, x - pointRadius, y - pointRadius, pointRadius * 2, pointRadius * 2);
        }
      }
    }
  }

  function onContextMenu(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('contextMenu', { e, origin: 'layer-line' });
    }
  }

  function getClosestPointForXY(
    x: number,
    y: number,
    points: LinePoint[],
    yScale: ScaleLinear<number, number, never>,
  ): LinePoint | null {
    /* TODO this could potentially include some pixel buffer around x? */
    const pointsAtX = points.filter(p => p.y !== null && p.x === x);
    const closest = pointsAtX.reduce((closestPoint: LinePoint | null, nextPoint) => {
      if (closestPoint === null) {
        return nextPoint;
      }
      const distanceA = Math.abs(yScale((closestPoint as LinePoint).y as number) - y);
      const distanceB = Math.abs(yScale((nextPoint as LinePoint).y as number) - y);
      return distanceA < distanceB ? closestPoint : nextPoint;
    }, null);
    return closest;
  }

  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      if (!xScaleView || !interactionCtx) {
        return;
      }

      interactionCtx.resetTransform();
      interactionCtx.scale(dpr, dpr);
      interactionCtx.clearRect(0, 0, drawWidth, drawHeight);

      const { offsetX: x, offsetY: y } = e;
      const xView = xScaleView.invert(x);
      const xDate = xView.getTime();
      let leftPoint: LinePoint | null = null;
      let rightPoint: LinePoint | null = null;
      const yScale = computeYScale(yAxes);

      // Find the points that neighbor mouse x
      points.forEach(point => {
        if (point.x <= xDate) {
          if (!leftPoint) {
            leftPoint = point;
          } else {
            if (Math.abs(point.x - xDate) <= Math.abs(leftPoint.x - xDate)) {
              leftPoint = point;
            }
          }
        } else {
          if (!rightPoint) {
            rightPoint = point;
          } else {
            if (Math.abs(point.x - xDate) < Math.abs(rightPoint.x - xDate)) {
              rightPoint = point;
            }
          }
        }
      });

      let mouseOverPoints: LinePoint[] = [];
      // If a neighboring point to the left exists
      if (leftPoint !== null) {
        // Find the point with the minimum distance to the mouse xy.
        // Unnecessary when interpolating since we will compute a value based on mouse x later.
        if (!interpolateHoverValue && (leftPoint as LinePoint).y !== null) {
          const closestPoint = getClosestPointForXY((leftPoint as LinePoint).x, y, points, yScale);
          if (closestPoint) {
            leftPoint = closestPoint;
          }
        }
        // Push leftPoint to the mouseOverPoint list
        mouseOverPoints.push(leftPoint);
      }

      if (rightPoint !== null) {
        if (!interpolateHoverValue && (rightPoint as LinePoint).y !== null) {
          const closestPoint = getClosestPointForXY((rightPoint as LinePoint).x, y, points, yScale);
          if (closestPoint) {
            rightPoint = closestPoint;
          }
        }
        mouseOverPoints.push(rightPoint);
      }

      // Compute the final point to draw
      let drawPoint: LinePoint | null = null;
      if (mouseOverPoints.length > 0) {
        // If only a single point exists (such as the edge of the data), use that point
        if (mouseOverPoints.length === 1) {
          drawPoint = mouseOverPoints[0];
        } else if (mouseOverPoints.length === 2) {
          const leftX = mouseOverPoints[0].x;
          const rightX = mouseOverPoints[1].x;
          const leftY = mouseOverPoints[0].y;
          const rightY = mouseOverPoints[1].y;
          const percent = (xDate - leftX) / (rightX - leftX);

          // Bail if one of the neighboring values is a gap
          if (leftY === null || rightY === null) {
            return;
          }

          if (interpolateHoverValue) {
            const interpY = (1 - percent) * leftY + percent * rightY;
            drawPoint = {
              ...mouseOverPoints[0],
              x: xDate,
              y: interpY,
            };
          } else {
            // Snap to nearest point
            if (percent < 0.5) {
              drawPoint = mouseOverPoints[0];
            } else {
              drawPoint = mouseOverPoints[1];
            }
          }
        }
      }

      if (drawPoint) {
        if (drawPoint.y === null) {
          return;
        }
        // Distance of mouse y to draw point
        const distance = Math.abs(yScale(drawPoint.y) - y);
        let DELTA_PX = 10;
        if (distance < DELTA_PX || limitTooltipToLine === false) {
          mouseOverPoints = [drawPoint];
          const { x, y, radius } = processPoint(drawPoint, yScale);
          if (y !== null) {
            const fill = lineColor;
            const scalar = radius || 1;

            // Draw the point using 3 circles
            const circle3 = new Path2D();
            circle3.arc(x, y, scalar + 3, 0, 2 * Math.PI);
            interactionCtx.fillStyle = fill;
            interactionCtx.fill(circle3);

            const circle2 = new Path2D();
            circle2.arc(x, y, scalar + 2, 0, 2 * Math.PI);
            interactionCtx.fillStyle = 'white';
            interactionCtx.fill(circle2);

            const circle = new Path2D();
            interactionCtx.fillStyle = fill;
            interactionCtx.lineWidth = lineWidth;
            circle.arc(x, y, scalar + 1, 0, 2 * Math.PI);
            interactionCtx.fill(circle);

            // Draw the triangle
            const path = new Path2D();
            interactionCtx.fillStyle = 'red';

            const maxY = scalar + 3;
            // Do not show triangle if draw height is too small (i.e. collapsed)
            if (drawHeight > 32) {
              const arrowSize = 8;
              let arrowHeadY = y - maxY - 1;
              let arrowTailY = arrowHeadY - arrowSize;
              // Draw arrow downwards if going offscreen
              if (arrowTailY < 0) {
                arrowHeadY = y + maxY + 1;
                arrowTailY = arrowHeadY + arrowSize;
              }
              path.moveTo(x, arrowHeadY);
              path.lineTo(x + arrowSize / 2, arrowTailY);
              path.lineTo(x - arrowSize / 2, arrowTailY);
              interactionCtx.fill(path);
            }
          }
          dispatch('mouseOver', { e, layerId: id, points: mouseOverPoints });
        }
      }
    }
  }

  function onMouseout(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('mouseOver', { e, layerId: id, points: [] });
      if (interactionCtx) {
        interactionCtx.clearRect(0, 0, drawWidth, drawHeight);
      }
    }
  }

  /* TODO this is getting called too often */
  function processResourcesToLinePoints(resources: Resource[]) {
    if (typeof window === 'undefined') {
      return;
    }

    window.cancelAnimationFrame(processingRequest);

    points = [];
    tempPoints = [];

    processingRequest = window.requestAnimationFrame(() => resourcesToLinePoints(resources));
  }

  function resourcesToLinePoints(
    resources: Resource[],
    resourceStartIndex = 0,
    valueStartIndex = 0,
    startId = 0,
  ): void {
    const startTime = performance.now();
    let resourceIndex = resourceStartIndex;
    let valueIndex = valueStartIndex;
    let id = startId;

    for (resourceIndex; resourceIndex < resources.length; ++resourceIndex) {
      const resource = resources[resourceIndex];
      const { name, schema, values } = resource;

      if (schema.type === 'boolean') {
        for (valueIndex; valueIndex < values.length; ++valueIndex) {
          const value = values[valueIndex];
          const { x, y: yBoolean } = value;
          const y = yBoolean ? 1 : 0;
          tempPoints.push({
            id: id++,
            name,
            type: 'line',
            x,
            y,
          });

          if (performance.now() - startTime > WORK_TIME_THRESHOLD) {
            processingRequest = window.requestAnimationFrame(() =>
              resourcesToLinePoints(resources, resourceIndex, valueIndex + 1, id),
            );
            return;
          }
        }

        valueIndex = 0;
      } else if (
        schema.type === 'int' ||
        schema.type === 'real' ||
        (schema.type === 'struct' && schema?.items?.rate?.type === 'real' && schema?.items?.initial?.type === 'real')
      ) {
        for (valueIndex; valueIndex < values.length; ++valueIndex) {
          const value = values[valueIndex];
          const { x } = value;
          const y = value.y as number;
          tempPoints.push({
            id: id++,
            name,
            type: 'line',
            x,
            y,
          });

          if (performance.now() - startTime > WORK_TIME_THRESHOLD) {
            processingRequest = window.requestAnimationFrame(() =>
              resourcesToLinePoints(resources, resourceIndex, valueIndex + 1, id),
            );
            return;
          }
        }
        valueIndex = 0;
      } else if (schema.type === 'string' || schema.type === 'variant') {
        for (let i = 0; i < values.length; ++i) {
          const value = values[i];
          const { x } = value;
          const y = value.y as number;
          scaleDomain.add(value.y as string);
          tempPoints.push({
            id: id++,
            name,
            type: 'line',
            x,
            y,
          });

          if (performance.now() - startTime > WORK_TIME_THRESHOLD) {
            processingRequest = window.requestAnimationFrame(() =>
              resourcesToLinePoints(resources, resourceIndex, valueIndex + 1, id),
            );
            return;
          }
        }
        valueIndex = 0;
      }
    }

    points = tempPoints;
  }

  function generateOffscreenPoint(lineColor: string, radius: number): OffscreenCanvas | HTMLCanvasElement | null {
    if (!radius) {
      return null;
    }

    let tempCanvas: OffscreenCanvas | HTMLCanvasElement;
    let tempCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if ('OffscreenCanvas' in window) {
      tempCanvas = new OffscreenCanvas(radius * 2 * dpr, radius * 2 * dpr);
    } else {
      tempCanvas = document.createElement('canvas');
      tempCanvas.height = radius * 2 * dpr;
      tempCanvas.width = radius * 2 * dpr;
      tempCanvas.style.height = `${radius * 2}px`;
      tempCanvas.style.width = `${radius * 2}px`;
    }

    tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      return null;
    }

    tempCtx.resetTransform();
    tempCtx.scale(dpr, dpr);
    tempCtx.fillStyle = lineColor;

    const circle = new Path2D();
    circle.arc(radius, radius, radius, 0, 2 * Math.PI);
    tempCtx.fill(circle);

    return tempCanvas;
  }
</script>

<canvas
  bind:this={canvas}
  height={canvasHeightDpr}
  id={`layer-line-${id}`}
  style="height: {drawHeight}px; width: {drawWidth}px;"
  width={canvasWidthDpr}
  on:contextmenu={onContextMenu}
/>
<canvas
  bind:this={interactionCanvas}
  height={canvasHeightDpr}
  id={`layer-line-interaction-${id}`}
  style="height: {drawHeight}px; pointer-events: none; width: {drawWidth}px;"
  width={canvasWidthDpr}
/>

<style>
  canvas {
    position: absolute;
    z-index: -1;
  }
</style>
