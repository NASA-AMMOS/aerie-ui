<svelte:options immutable={true} />

<script lang="ts">
  import { quadtree as d3Quadtree, type Quadtree } from 'd3-quadtree';
  import { scaleOrdinal, scalePoint, type ScaleTime } from 'd3-scale';
  import {
    schemeAccent,
    schemeCategory10,
    schemeDark2,
    schemePaired,
    schemePastel1,
    schemePastel2,
    schemeSet1,
    schemeSet2,
    schemeSet3,
    schemeTableau10,
  } from 'd3-scale-chromatic';
  import { curveLinear, line as d3Line } from 'd3-shape';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { Resource } from '../../types/simulation';
  import type {
    Axis,
    LinePoint,
    QuadtreePoint,
    QuadtreeRect,
    ResourceLayerFilter,
    TimeRange,
    XRangeLayerColorScheme,
    XRangePoint,
  } from '../../types/timeline';
  import { clamp, filterEmpty } from '../../utilities/generic';
  import { CANVAS_PADDING_Y, searchQuadtreePoint, searchQuadtreeRect } from '../../utilities/timeline';

  export let contextmenu: MouseEvent | undefined;
  export let colorScheme: XRangeLayerColorScheme = 'schemeAccent';
  export let dpr: number = 1;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let filter: ResourceLayerFilter | undefined;
  export let id: number;
  export let mousemove: MouseEvent | undefined;
  export let mouseout: MouseEvent | undefined;
  export let opacity: number = 0.8;
  export let resources: Resource[] = [];
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let showStateLineChart: boolean = false;
  export const yAxes: Axis[] = [];
  export const yAxisId: number | null = null;

  const dispatch = createEventDispatcher();
  const textMeasurementCache: Record<string, { textHeight: number; textWidth: number }> = {};

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let domain: string[] = [];
  let maxXWidth: number;
  let mounted: boolean = false;
  let points: XRangePoint[] = [];
  let pointRadius: number = 2;
  let quadtree: Quadtree<QuadtreeRect>;
  let quadtreePoints: Quadtree<QuadtreePoint>;
  let scaleDomain: Set<string> = new Set();
  let visiblePointsById: Record<number, XRangePoint> = {};
  let visibleLinePointsById: Record<number, LinePoint> = {};

  $: canvasHeightDpr = drawHeight * dpr;
  $: canvasWidthDpr = drawWidth * dpr;
  // If the user wants to see the stateLineChart, split this layer in half horizontally.
  $: if (
    canvasHeightDpr &&
    canvasWidthDpr &&
    drawHeight &&
    drawWidth &&
    dpr &&
    colorScheme &&
    filter &&
    mounted &&
    opacity !== undefined &&
    points &&
    xScaleView
  ) {
    draw();
  }
  $: onContextMenu(contextmenu);
  $: onMousemove(mousemove);
  $: onMouseout(mouseout);
  $: linePoints = resourcesToLinePoints(resources);
  $: points = resourcesToXRangePoints(resources);

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
    }
    mounted = true;
  });

  async function draw(): Promise<void> {
    if (ctx !== null && xScaleView) {
      await tick();

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.globalAlpha = opacity;

      if (showStateLineChart) {
        const fill = '';
        ctx.fillStyle = fill;
        ctx.lineWidth = 1;
        ctx.strokeStyle = fill;

        const domain = Array.from(scaleDomain);
        const yScale = scalePoint()
          .domain(domain.filter(filterEmpty))
          .range([drawHeight - CANVAS_PADDING_Y, CANVAS_PADDING_Y]);
        quadtreePoints = d3Quadtree<QuadtreePoint>()
          .x(p => p.x)
          .y(p => p.y)
          .extent([
            [0, 0],
            [drawWidth, drawHeight],
          ]);
        visibleLinePointsById = {};

        const line = d3Line<LinePoint>()
          .x(d => (xScaleView as ScaleTime<number, number, never>)(d.x))
          .y(d => yScale(d.y.toString()) as number)
          .defined(d => d.y !== null) // Skip any gaps in resource data instead of interpolating
          .curve(curveLinear);
        ctx.beginPath();
        line.context(ctx)(linePoints);
        ctx.stroke();
        ctx.closePath();

        for (const point of linePoints) {
          const { id, radius } = point;

          if (point.x >= viewTimeRange.start && point.x <= viewTimeRange.end) {
            const x = (xScaleView as ScaleTime<number, number, never>)(point.x);
            const y = yScale(point.y.toString()) as number;
            quadtreePoints.add({ id, x, y });
            visibleLinePointsById[id] = point;

            const circle = new Path2D();
            circle.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill(circle);
          }
        }
      } else {
        quadtree = d3Quadtree<QuadtreeRect>()
          .x(p => p.x)
          .y(p => p.y)
          .extent([
            [0, 0],
            [drawWidth, drawHeight],
          ]);
        visiblePointsById = {};

        maxXWidth = Number.MIN_SAFE_INTEGER;
        const colorScale = getColorScale();

        for (let i = 0; i < points.length; ++i) {
          const point = points[i];
          if (point.is_gap) {
            continue;
          }

          // Scan to the next point with a different label than the current point.
          let j = i + 1;
          let nextPoint = points[j];
          while (nextPoint && nextPoint.label.text === point.label.text && nextPoint.is_gap === point.is_gap) {
            j = j + 1;
            nextPoint = points[j];
          }
          i = j - 1; // Minus since the loop auto increments i at the end of the block.

          const xStart = clamp(xScaleView(point.x), 0, drawWidth);
          const xEnd = clamp(xScaleView(nextPoint ? nextPoint.x : points[i].x), 0, drawWidth);

          const xWidth = xEnd - xStart;
          const y = 0;

          if (xWidth > 0) {
            const { id } = point;
            visiblePointsById[id] = point;

            const labelText = point.label.text;
            ctx.fillStyle = colorScale(labelText);
            const rect = new Path2D();
            rect.rect(xStart, y, xWidth, drawHeight);
            ctx.fill(rect);

            quadtree.add({
              height: drawHeight,
              id,
              width: xWidth,
              x: xStart,
              y,
            });

            if (xWidth > maxXWidth) {
              maxXWidth = xWidth;
            }

            // Only draw if text will be visible
            if (newTextWidth > 0) {
              ctx.fillText(
                `${newLabelText}...`,
                xStart + xWidth / 2 - newTextWidth / 2,
                drawHeight / 2 + textHeight / 2,
                newTextWidth,
              );
            }
          }
        }
      }
    }
  }

  function getColorScale() {
    switch (colorScheme) {
      case 'schemeAccent':
        return scaleOrdinal(schemeAccent).domain(domain);
      case 'schemeCategory10':
        return scaleOrdinal(schemeCategory10).domain(domain);
      case 'schemeDark2':
        return scaleOrdinal(schemeDark2).domain(domain);
      case 'schemePaired':
        return scaleOrdinal(schemePaired).domain(domain);
      case 'schemePastel1':
        return scaleOrdinal(schemePastel1).domain(domain);
      case 'schemePastel2':
        return scaleOrdinal(schemePastel2).domain(domain);
      case 'schemeSet1':
        return scaleOrdinal(schemeSet1).domain(domain);
      case 'schemeSet2':
        return scaleOrdinal(schemeSet2).domain(domain);
      case 'schemeSet3':
        return scaleOrdinal(schemeSet3).domain(domain);
      case 'schemeTableau10':
        return scaleOrdinal(schemeTableau10).domain(domain);
      default:
        return scaleOrdinal(schemeTableau10).domain(domain);
    }
  }

  function measureText(text: string) {
    if (textMeasurementCache[text]) {
      return textMeasurementCache[text];
    }
    if (ctx) {
      const textMetrics = ctx.measureText(text);
      const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      const textWidth = textMetrics.width;
      const measurement = { textHeight, textWidth };
      textMeasurementCache[text] = measurement;
      return measurement;
    }
    const measurement = { textHeight: 0, textWidth: 0 };
    return measurement;
  }

  function onContextMenu(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('contextMenu', { e, origin: 'layer-x-range' });
    }
  }

  function onMousemove(e: MouseEvent | undefined): void {
    if (e) {
      const { offsetX: x, offsetY: y } = e;
      let points: LinePoint[] | XRangePoint[];

      // Only check if the user is hovering the line chart if it's showing.
      if (showStateLineChart) {
        points = searchQuadtreePoint<LinePoint>(quadtreePoints, x, y, pointRadius, visibleLinePointsById);
      } else {
        points = searchQuadtreeRect<XRangePoint>(quadtree, x, y, drawHeight, maxXWidth, visiblePointsById);
      }

      // The user will only hover one part of the layer at a time so only dispatch the set of points they're hovering.
      dispatch('mouseOver', { e, layerId: id, points });
    }
  }

  function onMouseout(e: MouseEvent | undefined): void {
    if (e) {
      dispatch('mouseOver', { e, layerId: id, points: [] });
    }
  }

  function resourcesToLinePoints(resources: Resource[]): LinePoint[] {
    const points: LinePoint[] = [];

    for (const resource of resources) {
      const { name, values } = resource;

      for (let i = 0; i < values.length; ++i) {
        const value = values[i];
        const { x } = value;
        const y = value.y as number;
        scaleDomain.add(value.y as string);
        points.push({
          id: id++,
          name,
          radius: pointRadius,
          type: 'line',
          x,
          y,
        });
      }
    }

    return points;
  }

  function resourcesToXRangePoints(resources: Resource[]): XRangePoint[] {
    const points: XRangePoint[] = [];
    let id = 0;

    for (const resource of resources) {
      const { name, schema, values } = resource;

      if (schema.type === 'boolean') {
        domain = ['TRUE', 'FALSE'];
        for (let i = 0; i < values.length; ++i) {
          const { x, y, is_gap } = values[i];
          const text = y ? 'TRUE' : 'FALSE';
          points.push({
            id: id++,
            is_gap,
            label: { text },
            name,
            type: 'x-range',
            x,
          });
        }
      } else if (schema.type === 'string') {
        const domainMap: Record<string, string> = {};
        for (let i = 0; i < values.length; ++i) {
          const { x, y, is_gap } = values[i];
          const text = y as string;
          points.push({
            id: id++,
            is_gap,
            label: { text },
            name,
            type: 'x-range',
            x,
          });
          domainMap[text] = text;
        }
        domain = Object.values(domainMap);
      } else if (schema.type === 'variant') {
        domain = schema.variants.map(({ label }) => label);
        for (let i = 0; i < values.length; ++i) {
          const { x, y, is_gap } = values[i];
          const text = y as string;
          points.push({
            id: id++,
            is_gap,
            label: { text },
            name,
            type: 'x-range',
            x,
          });
        }
      }
    }

    return points;
  }

  function setLabelContext(point: XRangePoint): {
    labelText?: string;
    textHeight: number;
    textWidth: number;
  } {
    const fontSize = point.label?.fontSize || 10;
    const fontFace = point.label?.fontFace || 'Inter';
    if (ctx) {
      ctx.fillStyle = point.label?.color || '#000000';
      ctx.font = `${fontSize}px ${fontFace}`;
    }
    const labelText = point.label.text;
    const { textHeight, textWidth } = measureText(labelText);
    return { labelText, textHeight, textWidth };
  }
</script>

<canvas
  bind:this={canvas}
  height={canvasHeightDpr}
  id={`layer-x-range-${id}`}
  style="height: {drawHeight}px; width: {drawWidth}px;"
  width={canvasWidthDpr}
  on:contextmenu={onContextMenu}
/>

<style>
  canvas {
    position: absolute;
    z-index: -1;
  }
</style>
