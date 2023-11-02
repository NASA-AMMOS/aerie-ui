<svelte:options immutable={true} />

<script lang="ts">
  import { axisLeft as d3AxisLeft } from 'd3-axis';
  import { select } from 'd3-selection';
  import { createEventDispatcher, tick } from 'svelte';
  import type { Axis, Layer, LineLayer } from '../../types/timeline';
  import { getYAxisTicks, getYScale } from '../../utilities/timeline';

  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let resourcesByViewLayerId: Record<number, Resource[]> = {}; /* TODO give this a type */
  export let layers: Layer[] = [];
  export let yAxes: Axis[] = [];

  /* TODO add color to axis numbers */

  const dispatch = createEventDispatcher();
  // const MAX_ITERATIONS = 5;

  let g: SVGGElement;

  $: if (drawHeight && g && yAxes && resourcesByViewLayerId && layers) {
    draw();
  }

  // function fitTextToWidth(
  //   textSelection: Selection<SVGTextElement, unknown, null, undefined>,
  //   text: string,
  //   width: number,
  // ) {
  //   textSelection.text(text);
  //   let textLength = textSelection?.node()?.getComputedTextLength() ?? 0;

  //   // If text is longer than total allowed width,
  //   // split the string in half and reduce the character length of each half by the ratio
  //   // of how much longer the string is than the width.
  //   // Iterate this process until "[start]...[end]" fits within the width.
  //   // (One pass is not necessarily good enough, due to variance in character widths,
  //   // but this should take at most 2 or 3 iterations)
  //   if (textLength > width) {
  //     let start = text.substring(0, text.length * 0.5);
  //     let end = text.substring(text.length * 0.5);
  //     let i = 0;
  //     let reduction: number;

  //     while (textLength > width && i < MAX_ITERATIONS) {
  //       i++;
  //       reduction = 1 - width / textLength;
  //       start = start.substring(0, start.length * (1 - reduction));
  //       end = end.substring(Math.ceil(end.length * reduction));
  //       textSelection.text(start + '...' + end);
  //       textLength = textSelection?.node()?.getComputedTextLength() ?? 0;
  //     }
  //   }
  // }

  async function draw() {
    if (g) {
      await tick();

      const gSelection = select(g);

      let totalWidth = 0;
      let marginWidth = 0;
      const axisClass = 'y-axis';
      gSelection.selectAll(`.${axisClass}`).remove();

      for (let i = 0; i < yAxes.length; ++i) {
        const axis = yAxes[i];

        // Get color for axis by examining associated layers. If more than one layer is associated,
        // use the default axis color, otherwise use the color from the layer.
        // TODO we don't expose y-axis color and this refactor would elimate need to store it in view.
        // That is unless we want to allow user override of this behavior?
        let color = axis.color;
        const yAxisLayers = layers.filter(layer => layer.yAxisId === axis.id && layer.chartType === 'line');
        if (yAxisLayers.length === 1) {
          color = (yAxisLayers[0] as LineLayer).lineColor;
        }

        // TODO deprecate these view properties?
        // const labelColor = axis.label?.color || 'black';
        // const labelFontFace = axis.label?.fontFace || 'sans-serif';
        // const labelFontSize = axis.label?.fontSize || 12;
        // const labelText = axis.label.text;
        const tickCount = axis.tickCount || 1;
        const axisG = gSelection.append('g').attr('class', axisClass);
        axisG.selectAll('*').remove();
        if (
          tickCount > 0 &&
          axis.scaleDomain &&
          axis.scaleDomain.length === 2 &&
          typeof axis.scaleDomain[0] === 'number' &&
          typeof axis.scaleDomain[1] === 'number'
        ) {
          const domain = axis.scaleDomain;
          const scale = getYScale(domain, drawHeight);
          const tickValues = getYAxisTicks(axis.scaleDomain as number[], tickCount);
          const axisLeft = d3AxisLeft(scale)
            .tickSizeInner(0)
            .tickSizeOuter(0)
            .ticks(tickValues.length)
            .tickPadding(2)
            .tickValues(tickValues);

          const axisMargin = 2;
          const startPosition = -(totalWidth + axisMargin * i);
          marginWidth += i > 0 ? axisMargin : 0;
          axisG.attr('transform', `translate(${startPosition}, 0)`);
          axisG.style('color', color);
          if (domain.length === 2 && domain[0] !== null && domain[1] !== null) {
            axisG.call(axisLeft);
            axisG.call(g => g.select('.domain').remove());
          }

          // Draw separator
          axisG
            .append('line')
            .attr('x1', 2)
            .attr('y1', 0)
            .attr('x2', 2)
            .attr('y2', drawHeight)
            .style('stroke', '#EBECEC')
            .style('stroke-width', 2);
        }

        const axisGElement: SVGGElement | null = axisG.node();
        if (axisGElement !== null) {
          // TODO might be able to save minor perf by getting bounding rect of entire
          // container instead of each individual axis?
          totalWidth += axisGElement.getBoundingClientRect().width;
        }
      }
      totalWidth += marginWidth;
      if (totalWidth > 0 && drawWidth !== totalWidth) {
        dispatch('updateYAxesWidth', totalWidth);
      }
    }
  }
</script>

<svg class="row-y-axes">
  <g transform="translate({drawWidth}, 0)">
    <g bind:this={g} />
  </g>
</svg>

<style>
  .row-y-axes {
    height: 100%;
    width: 100%;
  }

  :global(.y-axis) {
    font-family: Inter;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: 16px;
    user-select: none;
  }

  /* :global(.y-axis .tick line) {
    color: red;
  } */
</style>
