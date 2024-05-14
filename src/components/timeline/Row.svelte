<svelte:options immutable={true} />

<script lang="ts">
  import type { ScaleTime } from 'd3-scale';
  import { select, type Selection } from 'd3-selection';
  import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
  import { groupBy } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import FilterWithXIcon from '../../assets/filter-with-x.svg?component';
  import { Status } from '../../enums/status';
  import { ViewDefaultActivityOptions } from '../../enums/view';
  import { catchError } from '../../stores/errors';
  import {
    externalResources,
    fetchingResourcesExternal,
    resourceTypes,
    resourceTypesLoading,
  } from '../../stores/simulation';
  import { selectedRow } from '../../stores/views';
  import type { ActivityDirective, ActivityDirectiveId, ActivityDirectivesMap } from '../../types/activity';
  import type { User } from '../../types/app';
  import type { ConstraintResultWithName } from '../../types/constraint';
  import type { Plan } from '../../types/plan';
  import type {
    Resource,
    ResourceRequest,
    SimulationDataset,
    Span,
    SpanId,
    SpansMap,
    SpanUtilityMaps,
  } from '../../types/simulation';
  import type {
    ActivityLayer,
    ActivityOptions,
    ActivityTree,
    ActivityTreeExpansionMap,
    ActivityTreeNode,
    Axis,
    HorizontalGuide,
    Layer,
    MouseDown,
    MouseOver,
    Point,
    RowMouseOverEvent,
    TimeRange,
    XAxisTick,
  } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { classNames } from '../../utilities/generic';
  import { sampleProfiles } from '../../utilities/resources';
  import { getSimulationStatus } from '../../utilities/simulation';
  import { pluralize } from '../../utilities/text';
  import { getDoyTime } from '../../utilities/time';
  import {
    directiveInView,
    getYAxesWithScaleDomains,
    isXRangeLayer,
    spanInView,
    TimelineInteractionMode,
    type TimelineLockStatus,
  } from '../../utilities/timeline';
  import { tooltip } from '../../utilities/tooltip';
  import ConstraintViolations from './ConstraintViolations.svelte';
  import LayerActivities from './LayerActivities.svelte';
  import LayerGaps from './LayerGaps.svelte';
  import LayerLine from './LayerLine.svelte';
  import LayerXRange from './LayerXRange.svelte';
  import RowDragHandleHeight from './RowDragHandleHeight.svelte';
  import RowHeader from './RowHeader.svelte';
  import RowHorizontalGuides from './RowHorizontalGuides.svelte';
  import RowXAxisTicks from './RowXAxisTicks.svelte';
  import RowYAxisTicks from './RowYAxisTicks.svelte';

  export let activityDirectives: ActivityDirective[] = [];
  export let activityDirectivesMap: ActivityDirectivesMap = {};
  export let activityTreeExpansionMap: ActivityTreeExpansionMap = {};
  export let activityOptions: ActivityOptions | undefined = undefined;
  export let autoAdjustHeight: boolean = false;
  export let constraintResults: ConstraintResultWithName[] = [];
  export let decimate: boolean = false;
  export let interpolateHoverValue: boolean = false;
  export let limitTooltipToLine: boolean = false;
  export let dpr: number = 0;
  export let drawHeight: number = 0;
  export let drawWidth: number = 0;
  export let expanded: boolean = true;
  export let hasUpdateDirectivePermission: boolean = false;
  export let horizontalGuides: HorizontalGuide[] = [];
  export let id: number;
  export let layers: Layer[] = [];
  export let name: string = '';
  export let marginLeft: number = 50;
  export let planEndTimeDoy: string;
  export let plan: Plan | null = null;
  export let planStartTimeYmd: string;
  export let rowDragMoveDisabled = true;
  export let rowHeaderDragHandleWidthPx: number = 2;
  export let selectedActivityDirectiveId: ActivityDirectiveId | null = null;
  export let selectedSpanId: SpanId | null = null;
  export let simulationDataset: SimulationDataset | null = null;
  export let spanUtilityMaps: SpanUtilityMaps;
  export let spansMap: SpansMap = {};
  export let timelineInteractionMode: TimelineInteractionMode;
  export let timelineLockStatus: TimelineLockStatus;
  export let timelineZoomTransform: ZoomTransform | null;
  export let viewTimeRange: TimeRange = { end: 0, start: 0 };
  export let xScaleView: ScaleTime<number, number> | null = null;
  export let xTicksView: XAxisTick[] = [];
  export let yAxes: Axis[] = [];
  export let user: User | null;

  $: activityOptions = activityOptions || { ...ViewDefaultActivityOptions };

  // Enforce assignment to object in case of undefined prop since svelte does not
  // re-assign the default you use in the const export.
  $: activityTreeExpansionMap = activityTreeExpansionMap || {};

  $: showSpans = activityOptions?.composition === 'both' || activityOptions?.composition === 'spans';
  $: showDirectives = activityOptions?.composition === 'both' || activityOptions?.composition === 'directives';

  const dispatch = createEventDispatcher<{
    activityTreeExpansionChange: ActivityTreeExpansionMap;
    mouseDown: MouseDown;
    mouseOver: MouseOver;
    updateRowHeight: {
      newHeight: number;
      rowId: number;
      wasAutoAdjusted?: boolean;
    };
    updateYAxes: {
      axes: Axis[];
      id: number;
    };
    zoom: D3ZoomEvent<HTMLCanvasElement, any>;
  }>();

  let blur: FocusEvent;
  let contextmenu: MouseEvent;
  let dblclick: MouseEvent;
  let dragenter: DragEvent;
  let dragleave: DragEvent;
  let dragover: DragEvent;
  let drop: DragEvent;
  let focus: FocusEvent;
  let mousedown: MouseEvent;
  let mousemove: MouseEvent;
  let mouseout: MouseEvent;
  let mouseup: MouseEvent;
  let mouseOverActivityDirectives: ActivityDirective[] = [];
  let mouseOverConstraintResults: ConstraintResultWithName[] = []; // For this row.
  let mouseOverPointsByLayer: Record<number, Point[]> = {};
  let mouseOverSpans: Span[] = [];
  let mouseOverGapsByLayer: Record<number, Point[]> = {};
  let overlaySvg: SVGElement;
  let yAxesWithScaleDomains: Axis[];
  let zoom: ZoomBehavior<SVGElement, unknown>;

  let resourceRequestMap: Record<string, ResourceRequest> = {};
  let loadedResources: Resource[];
  let loadingErrors: string[];
  let anyResourcesLoading: boolean = true;
  let activityTree: ActivityTree = [];
  let filteredActivityDirectives: ActivityDirective[] = [];
  let filteredSpans: Span[] = [];
  let timeFilteredActivityDirectives: ActivityDirective[] = [];
  let timeFilteredSpans: Span[] = [];
  let idToColorMaps: { directives: Record<number, string>; spans: Record<number, string> } = {
    directives: {},
    spans: {},
  };
  let filterActivitiesByTime = false;

  $: if (plan && simulationDataset !== null && layers && $externalResources && !$resourceTypesLoading) {
    const simulationDatasetId = simulationDataset.dataset_id;
    const resourceNamesSet = new Set<string>();
    layers.map(l => {
      if (l.chartType === 'line' || l.chartType === 'x-range') {
        l.filter.resource?.names.forEach(name => resourceNamesSet.add(name));
      }
    });
    const resourceNames = Array.from(resourceNamesSet);

    // Cancel and delete unused and stale requests as well as any external resources that
    // are not in the list of current external resources
    Object.entries(resourceRequestMap).forEach(([key, value]) => {
      if (
        resourceNames.indexOf(key) < 0 ||
        value.simulationDatasetId !== simulationDatasetId ||
        (value.type === 'external' && !$resourceTypes.find(type => type.name === name))
      ) {
        value.controller?.abort();
        delete resourceRequestMap[key];
        resourceRequestMap = { ...resourceRequestMap };
      }
    });

    // Only update if simulation is complete
    if (
      getSimulationStatus(simulationDataset) === Status.Complete ||
      getSimulationStatus(simulationDataset) === Status.Canceled
    ) {
      const startTimeYmd = simulationDataset?.simulation_start_time ?? plan.start_time;
      resourceNames.forEach(async name => {
        // Check if resource is external
        const isExternal = !$resourceTypes.find(t => t.name === name);
        if (isExternal) {
          // Handle external datasets separately as they are globally loaded and subscribed to
          let resource = null;
          if (!$fetchingResourcesExternal) {
            resource = $externalResources.find(resource => resource.name === name) || null;
          }
          let error = !resource && !$fetchingResourcesExternal ? 'External Profile not Found' : '';

          resourceRequestMap = {
            ...resourceRequestMap,
            [name]: {
              ...resourceRequestMap[name],
              error,
              loading: $fetchingResourcesExternal,
              resource,
              simulationDatasetId,
              type: 'external',
            },
          };
        } else {
          // Skip matching resources requests that have already been added for this simulation
          if (
            resourceRequestMap[name] &&
            simulationDatasetId === resourceRequestMap[name].simulationDatasetId &&
            (resourceRequestMap[name].loading || resourceRequestMap[name].error || resourceRequestMap[name].resource)
          ) {
            return;
          }

          const controller = new AbortController();
          resourceRequestMap = {
            ...resourceRequestMap,
            [name]: {
              ...resourceRequestMap[name],
              controller,
              error: '',
              loading: true,
              resource: null,
              simulationDatasetId,
              type: 'internal',
            },
          };

          let resource = null;
          let error = '';
          let aborted = false;
          try {
            const response = await effects.getResource(simulationDatasetId, name, user, controller.signal);
            const { profile } = response;
            if (profile && profile.length === 1) {
              resource = sampleProfiles([profile[0]], startTimeYmd)[0];
            } else {
              throw new Error('Profile not Found');
            }
          } catch (e) {
            const err = e as Error;
            if (err.name === 'AbortError') {
              aborted = true;
            } else {
              catchError(`Profile Download Failed for ${name}`, e as Error);
              error = err.message;
            }
          } finally {
            if (!aborted) {
              resourceRequestMap = {
                ...resourceRequestMap,
                [name]: {
                  ...resourceRequestMap[name],
                  error,
                  loading: false,
                  resource,
                },
              };
            }
          }
        }
      });
    }
  }

  $: onDragenter(dragenter);
  $: onDragleave(dragleave);
  $: onDragover(dragover);
  $: onDrop(drop);
  $: computedDrawHeight = expanded ? drawHeight : 24;
  $: overlaySvgSelection = select(overlaySvg) as Selection<SVGElement, unknown, any, any>;
  $: rowClasses = classNames('row', { 'row-collapsed': !expanded });
  $: hasActivityLayer = !!layers.find(layer => layer.chartType === 'activity');
  $: hasResourceLayer = !!layers.find(layer => layer.chartType === 'line' || layer.chartType === 'x-range');

  // Track resource loading status for this Row
  $: if (resourceRequestMap) {
    const newLoadedResources: Resource[] = [];
    const newLoadingErrors: string[] = [];
    Object.values(resourceRequestMap).forEach(resourceRequest => {
      if (resourceRequest.resource) {
        newLoadedResources.push(resourceRequest.resource);
      }
      if (resourceRequest.error) {
        newLoadingErrors.push(resourceRequest.error);
      }
    });
    loadedResources = newLoadedResources;
    loadingErrors = newLoadingErrors;

    // Consider row to be loading if the number of completed resource requests (loaded or error state)
    // is not equal to the total number of resource requests
    anyResourcesLoading = loadedResources.length + loadingErrors.length !== Object.keys(resourceRequestMap).length;
  }

  // Compute scale domains for axes since it is optionally defined in the view
  $: if (loadedResources && yAxes) {
    yAxesWithScaleDomains = getYAxesWithScaleDomains(yAxes, layers, loadedResources, viewTimeRange);
    dispatch('updateYAxes', { axes: yAxesWithScaleDomains, id });
  }

  $: if (overlaySvgSelection && drawWidth) {
    zoom = d3Zoom<SVGElement, unknown>()
      .on('zoom', zoomed)
      .scaleExtent([1, Infinity])
      .translateExtent([
        [0, 0],
        [drawWidth, drawHeight],
      ])
      .filter((e: WheelEvent) => {
        return timelineInteractionMode === TimelineInteractionMode.Navigate || e.button === 1;
      })
      .wheelDelta((e: WheelEvent) => {
        // Override default d3 wheelDelta function to remove ctrl key for modifying zoom amount
        // https://d3js.org/d3-zoom#zoom_wheelDelta
        return -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002);
      });
    overlaySvgSelection.call(zoom.transform, timelineZoomTransform || zoomIdentity);
    overlaySvgSelection.call(zoom);
  }

  $: if (timelineZoomTransform && overlaySvgSelection) {
    // Set transform if it has changed (from other rows or elsewhere), causes zoomed event to fire
    overlaySvgSelection.call(zoom.transform, timelineZoomTransform);
  }

  $: if (hasActivityLayer && spansMap && activityDirectives && typeof filterActivitiesByTime === 'boolean') {
    activityTree = [];
    idToColorMaps = { directives: {}, spans: {} };

    const activityLayers = layers.filter(layer => layer.chartType === 'activity') as ActivityLayer[];
    let spansList = Object.values(spansMap);
    const directivesByType = groupBy(activityDirectives, 'type');
    const spansByType = groupBy(spansList, 'type');
    if (activityLayers.length) {
      let directives: ActivityDirective[] = [];
      let spans: Span[] = [];
      activityLayers.forEach(layer => {
        if (layer.filter && layer.filter.activity !== undefined) {
          const types = layer.filter.activity.types || [];
          types.forEach(type => {
            const matchingDirectives = directivesByType[type];
            if (matchingDirectives) {
              matchingDirectives.forEach(directive => {
                idToColorMaps.directives[directive.id] = layer.activityColor;
              });
              directives = directives.concat(matchingDirectives);
            }
            const matchingSpans = spansByType[type];
            if (matchingSpans) {
              matchingSpans.forEach(span => {
                idToColorMaps.spans[span.id] = layer.activityColor;
              });
              spans = spans.concat(matchingSpans);
            }
          });
        }
      });
      directives.sort((a, b) => ((a.start_time_ms || 0) < (b.start_time_ms || 0) ? -1 : 1));
      spans.sort((a, b) => (a.startMs < b.startMs ? -1 : 1));
      if (directives.length || spans.length) {
        // Populate both sets of directive and span lists in order to more precisely
        // react to the filterActivitiesByTime variable later and avoid unnecessary activity tree
        // regeneration upon viewTimeRange change when not in filterActivitiesByTime mode.
        filteredActivityDirectives = directives;
        filteredSpans = spans;
        timeFilteredActivityDirectives = directives;
        timeFilteredSpans = spans;
      } else {
        filteredActivityDirectives = [];
        filteredSpans = [];
        timeFilteredActivityDirectives = [];
        timeFilteredSpans = [];
      }
    }
  }

  $: if (hasActivityLayer && filterActivitiesByTime && filteredActivityDirectives && filteredSpans && viewTimeRange) {
    timeFilteredSpans = filteredSpans.filter(span => spanInView(span, viewTimeRange));
    timeFilteredActivityDirectives = filteredActivityDirectives.filter(directive => {
      let inView = directiveInView(directive, viewTimeRange);
      if (inView && showSpans) {
        // Get max span bounds
        const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
        const rootSpan = spansMap[rootSpanId];
        if (rootSpan) {
          return spanInView(rootSpan, viewTimeRange);
        }
      }
      return inView;
    });
  }

  $: if (
    hasActivityLayer &&
    timeFilteredActivityDirectives &&
    timeFilteredSpans &&
    activityOptions &&
    typeof showSpans === 'boolean' &&
    typeof showDirectives === 'boolean' &&
    activityTreeExpansionMap
  ) {
    // TODO figure out how to work in activity layer height to all of this since before it was on each layer but now all activity layers are combined?
    if (activityOptions.displayMode === 'grouped') {
      activityTree = generateActivityTree(
        timeFilteredActivityDirectives,
        timeFilteredSpans,
        activityTreeExpansionMap,
        activityOptions.hierarchyMode,
      );
      // if (activityOptions.hierarchyMode === 'directive') {
      //   activityTree = generateActivityTree(timeFilteredActivityDirectives, activityTreeExpansionMap);
      // } else {
      //   activityTree = generateActivityTreeFlat(
      //     timeFilteredActivityDirectives,
      //     timeFilteredSpans,
      //     activityTreeExpansionMap,
      //   );
      // }
    } else {
      activityTree = [];
    }
  }

  function getNodeExpanded(id: string, activityTreeExpansionMap: ActivityTreeExpansionMap) {
    if (!Object.hasOwn(activityTreeExpansionMap, id)) {
      return false;
    }
    return activityTreeExpansionMap[id];
  }

  function paginate(
    nodes: ActivityTreeNode[],
    parentId: string,
    activityTreeExpansionMap: ActivityTreeExpansionMap,
    depth = 1,
  ) {
    const binSize = 100;
    if (nodes.length <= binSize) {
      return nodes;
    }
    const newNodes: ActivityTreeNode[] = [];
    nodes.forEach((node, i) => {
      const bin = Math.floor(i / binSize);
      if (!newNodes[bin]) {
        newNodes[bin] = {
          children: [],
          expanded: false,
          id: '',
          isLeaf: false,
          items: [],
          label: '',
          type: 'aggregation',
        };
      }
      newNodes[bin].children.push(node);
      if (node.items) {
        newNodes[bin].items.push(...node.items);
      }
    });
    newNodes.forEach((node, i) => {
      const nodeStart = i * binSize ** depth;
      const nodeEnd = Math.min(nodeStart + node.children.length * depth ** binSize, (i + 1) * binSize ** depth);
      const label = `[${nodeStart} … ${nodeEnd - 1}]`;
      node.id = `${parentId}_${label}_page`;
      node.label = label;
      node.expanded = getNodeExpanded(node.id, activityTreeExpansionMap);
    });
    return paginate(newNodes, parentId, activityTreeExpansionMap, depth + 1);
  }

  // TODO repeated in LayerActivites, move to a util?
  function getSpanForActivityDirective(activityDirective: ActivityDirective): Span {
    const spanId = spanUtilityMaps.directiveIdToSpanIdMap[activityDirective.id];
    return spansMap[spanId];
  }

  function generateActivityTree(
    directives: ActivityDirective[],
    spans: Span[],
    activityTreeExpansionMap: ActivityTreeExpansionMap,
    hierarchyMode: ActivityOptions['hierarchyMode'] = 'all',
  ): ActivityTree {
    // TODO duplicates appear when you have two layers with the same type
    const groupedSpans = showSpans && hierarchyMode === 'all' ? groupBy(spans, 'type') : {};
    const groupedDirectives = showDirectives ? groupBy(directives, 'type') : {};
    const nodes: ActivityTreeNode[] = [];
    const allKeys = new Set(Object.keys(groupedSpans).concat(Object.keys(groupedDirectives)));
    Array.from(allKeys)
      .sort()
      .forEach(type => {
        const spanGroup = groupedSpans[type];
        const directiveGroup = groupedDirectives[type];
        const id = type;
        const expanded = getNodeExpanded(id, activityTreeExpansionMap);
        const label = type;
        let children: ActivityTreeNode['children'] = [];
        let items: ActivityTreeNode['items'] = [];
        const seenSpans: Record<string, boolean> = {};
        if (directiveGroup) {
          directiveGroup.forEach(directive => {
            let childSpan;
            if (showSpans) {
              childSpan = getSpanForActivityDirective(directive);
              if (childSpan && hierarchyMode === 'all') {
                seenSpans[childSpan.id] = true;
              }
            }
            if (expanded) {
              children.push(getDirectiveSubtree(directive, id, activityTreeExpansionMap));
            }
            items.push({ directive, ...(childSpan ? { span: childSpan } : null) });
          });
        }
        if (spanGroup && hierarchyMode === 'all') {
          spanGroup.forEach(span => {
            if (!seenSpans[span.id]) {
              if (expanded) {
                children.push(...getSpanSubtrees(span, id, activityTreeExpansionMap, 'span', filterActivitiesByTime));
              }
              items.push({ span });
            }
          });
        }
        children = paginate(children, id, activityTreeExpansionMap);
        nodes.push({
          children,
          expanded: expanded,
          id,
          isLeaf: false,
          items,
          label,
          type: 'aggregation',
        });
      });
    return nodes;
  }

  function getDirectiveSubtree(
    directive: ActivityDirective,
    parentId: string,
    activityTreeExpansionMap: ActivityTreeExpansionMap,
  ) {
    let children: ActivityTreeNode[] = [];
    const id = `${parentId}_${directive.id}`;
    let span;
    const expanded = getNodeExpanded(id, activityTreeExpansionMap);

    if (showSpans) {
      const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
      const rootSpan = spansMap[rootSpanId];
      if (rootSpan) {
        span = rootSpan;
      }
      if (typeof rootSpanId === 'number') {
        children = paginate(
          getSpanSubtrees(rootSpan, id, activityTreeExpansionMap, 'aggregation', filterActivitiesByTime),
          id,
          activityTreeExpansionMap,
        );
      }
    }

    return {
      children,
      expanded,
      id,
      isLeaf: children.length < 1,
      items: [{ directive, span }],
      label: directive.name,
      type: 'directive',
    } as ActivityTreeNode;
  }

  function getSpanSubtrees(
    span: Span,
    parentId: string,
    activityTreeExpansionMap: ActivityTreeExpansionMap,
    type: ActivityTreeNode['type'],
    filterActivitiesByTime: boolean,
  ) {
    let children: ActivityTreeNode[] = [];
    const spanChildren = spanUtilityMaps.spanIdToChildIdsMap[span.id].map(id => spansMap[id]);
    if (type === 'aggregation') {
      // Group by type
      let computedSpans = spanChildren;
      if (filterActivitiesByTime) {
        computedSpans = spanChildren.filter(span => spanInView(span, viewTimeRange));
      }
      const groupedSpanChildren = groupBy(computedSpans, 'type');
      Object.keys(groupedSpanChildren)
        .sort()
        .forEach(key => {
          const spanGroup = groupedSpanChildren[key];
          const id = `${parentId}_${key}`;
          const expanded = getNodeExpanded(id, activityTreeExpansionMap);
          let childrenForKey: ActivityTreeNode[] = [];
          if (expanded) {
            spanGroup.forEach(spanChild => {
              childrenForKey.push(
                ...getSpanSubtrees(spanChild, id, activityTreeExpansionMap, 'span', filterActivitiesByTime),
              );
            });
            childrenForKey = paginate(childrenForKey, id, activityTreeExpansionMap);
          }
          children.push({
            children: childrenForKey,
            expanded,
            id,
            isLeaf: false,
            items: spanGroup.map(span => ({ span })),
            label: key,
            type: 'aggregation',
          });
        });
    } else if (type === 'span') {
      const id = `${parentId}_${span.id}`;
      const expanded = getNodeExpanded(id, activityTreeExpansionMap);
      const count = spanChildren.length;
      let childrenForKey: ActivityTreeNode[] = [];
      if (expanded) {
        childrenForKey = paginate(
          getSpanSubtrees(span, id, activityTreeExpansionMap, 'aggregation', filterActivitiesByTime),
          id,
          activityTreeExpansionMap,
        );
      }
      children.push({
        children: childrenForKey,
        expanded,
        id,
        isLeaf: count < 1,
        items: [{ span }],
        label: span.type,
        type: 'span',
      });
    }
    return children;
  }

  function onActivityTreeNodeChange(e: { detail: ActivityTreeNode }) {
    const node = e.detail;
    dispatch('activityTreeExpansionChange', { ...(activityTreeExpansionMap || {}), [node.id]: !node.expanded });
  }

  function onActivityTimeFilterChange() {
    filterActivitiesByTime = !filterActivitiesByTime;
  }

  function zoomed(e: D3ZoomEvent<HTMLCanvasElement, any>) {
    // Prevent dispatch when zoom did not originate from this row (i.e. propagated from zoomTransform)
    if (e.transform && timelineZoomTransform && e.transform.toString() === timelineZoomTransform.toString()) {
      return;
    }
    dispatch('zoom', e);
  }

  function onDragenter(e: DragEvent | undefined): void {
    if (hasActivityLayer && e && overlaySvgSelection) {
      const { offsetX } = e;
      overlaySvgSelection
        .append('line')
        .attr('class', 'activity-drag-guide')
        .attr('x1', offsetX)
        .attr('y1', 0)
        .attr('x2', offsetX)
        .attr('y2', computedDrawHeight)
        .attr('stroke', 'black')
        .style('pointer-events', 'none');
    }
  }

  function onDragleave(e: DragEvent | undefined): void {
    if (hasActivityLayer && e && overlaySvgSelection) {
      overlaySvgSelection.select('.activity-drag-guide').remove();
    }
  }

  function onDragover(e: DragEvent | undefined): void {
    if (hasActivityLayer && e && overlaySvgSelection) {
      const { offsetX } = e;
      overlaySvgSelection.select('.activity-drag-guide').attr('x1', offsetX).attr('x2', offsetX);
    }
  }

  function onDrop(e: DragEvent | undefined): void {
    if (hasActivityLayer && e && overlaySvgSelection && xScaleView !== null) {
      const { offsetX } = e;
      overlaySvgSelection.select('.activity-drag-guide').remove();
      if (e.dataTransfer !== null) {
        const unixEpochTime = xScaleView.invert(offsetX).getTime();
        const start_time = getDoyTime(new Date(unixEpochTime));
        const activityTypeName = e.dataTransfer.getData('activityTypeName');

        // Only allow creating an activity if we have an actual activity in the drag data.
        if (activityTypeName && plan) {
          effects.createActivityDirective({}, start_time, activityTypeName, activityTypeName, {}, plan, user);
        }
      }
    }
  }

  function onMouseDown(event: CustomEvent<RowMouseOverEvent>) {
    const { detail } = event;
    dispatch('mouseDown', {
      ...detail,
      activityDirectives: detail?.activityDirectives ?? [],
      rowId: id,
      spans: detail?.spans ?? [],
    });
  }

  function onMouseOver(event: CustomEvent<RowMouseOverEvent>) {
    const { detail } = event;
    const { layerId } = detail;
    mouseOverActivityDirectives = detail?.activityDirectives ?? [];
    mouseOverConstraintResults = detail?.constraintResults ?? mouseOverConstraintResults;
    mouseOverSpans = detail?.spans ?? [];
    if (typeof layerId === 'number') {
      mouseOverPointsByLayer[layerId] = detail?.points ?? [];
      mouseOverGapsByLayer[layerId] = detail?.gaps ?? mouseOverGapsByLayer[layerId] ?? [];
    }

    dispatch('mouseOver', {
      ...detail,
      activityDirectives: mouseOverActivityDirectives,
      constraintResults: mouseOverConstraintResults,
      gapsByLayer: mouseOverGapsByLayer,
      pointsByLayer: mouseOverPointsByLayer,
      spans: mouseOverSpans,
    });
    // }
  }

  function onUpdateRowHeightDrag(event: CustomEvent<{ newHeight: number }>) {
    const { newHeight } = event.detail;
    dispatch('updateRowHeight', { newHeight, rowId: id });
  }

  function onUpdateRowHeightLayer(event: CustomEvent<{ newHeight: number }>) {
    const {
      detail: { newHeight },
    } = event;
    if (autoAdjustHeight) {
      // Only update row height if a change has occurred to avoid loopback
      if (newHeight !== computedDrawHeight) {
        dispatch('updateRowHeight', { newHeight, rowId: id, wasAutoAdjusted: true });
      }
    }
  }

  // Retrieve resources from resourceRequestMap by a layer's resource filter
  function getResourcesForLayer(layer: Layer, resourceRequestMap: Record<string, ResourceRequest> = {}) {
    if (!layer.filter.resource) {
      return [];
    }
    const resources: Resource[] = [];
    layer.filter.resource.names.forEach(name => {
      const resourceRequest = resourceRequestMap[name];
      if (resourceRequest && !resourceRequest.loading && !resourceRequest.error && resourceRequest.resource) {
        resources.push(resourceRequest.resource);
      }
    });
    return resources;
  }
</script>

<div
  class="row-root"
  class:active-row={$selectedRow ? $selectedRow.id === id : false}
  class:expanded
  class:auto-height={autoAdjustHeight}
>
  <div class="row-content">
    <!-- Row Header. -->
    <RowHeader
      {activityOptions}
      on:activity-tree-node-change={onActivityTreeNodeChange}
      on:mouseDown={onMouseDown}
      on:dblClick
      {activityTree}
      width={marginLeft}
      height={computedDrawHeight}
      {expanded}
      rowId={id}
      title={name}
      {rowDragMoveDisabled}
      {layers}
      resources={loadedResources}
      yAxes={yAxesWithScaleDomains}
      {rowHeaderDragHandleWidthPx}
      on:mouseDownRowMove
      on:mouseUpRowMove
      on:toggleRowExpansion
      on:contextMenu
      {selectedActivityDirectiveId}
      {selectedSpanId}
    >
      {#if hasActivityLayer && activityOptions?.displayMode === 'grouped'}
        <button
          class="st-button icon row-action"
          class:row-action-active={filterActivitiesByTime}
          on:click|stopPropagation={onActivityTimeFilterChange}
          use:tooltip={{ content: 'Filter Activities by Time Window', placement: 'top' }}
        >
          <FilterWithXIcon />
        </button>
      {/if}
    </RowHeader>

    <div
      class={rowClasses}
      id={`row-${id}`}
      style={`cursor: ${
        timelineInteractionMode === TimelineInteractionMode.Navigate ? 'move' : ''
      }; height: ${computedDrawHeight}px;`}
    >
      <!-- Overlay for Pointer Events. -->
      <svg
        bind:this={overlaySvg}
        class="overlay"
        role="none"
        style="width: {drawWidth}px"
        on:blur={e => (blur = e)}
        on:contextmenu={e => (contextmenu = e)}
        on:dragenter|preventDefault={e => (dragenter = e)}
        on:dragleave={e => (dragleave = e)}
        on:dragover|preventDefault={e => (dragover = e)}
        on:drop|preventDefault={e => (drop = e)}
        on:focus={e => (focus = e)}
        on:mousedown={e => (mousedown = e)}
        on:mousemove={e => (mousemove = e)}
        on:mouseout={e => (mouseout = e)}
        on:mouseup={e => (mouseup = e)}
        on:dblclick={e => (dblclick = e)}
      />

      <!-- SVG Elements. -->
      <svg>
        <g>
          {#if drawWidth > 0}
            <RowXAxisTicks drawHeight={computedDrawHeight} {xScaleView} {xTicksView} />
            {#if expanded}
              <RowYAxisTicks drawHeight={computedDrawHeight} {drawWidth} yAxes={yAxesWithScaleDomains} {layers} />
            {/if}
            <ConstraintViolations
              {constraintResults}
              drawHeight={computedDrawHeight}
              {drawWidth}
              {mousemove}
              {mouseout}
              {viewTimeRange}
              {xScaleView}
              on:mouseOver={onMouseOver}
            />
            <RowHorizontalGuides
              drawHeight={computedDrawHeight}
              {drawWidth}
              {horizontalGuides}
              yAxes={yAxesWithScaleDomains}
            />
          {/if}
        </g>
      </svg>
      <!-- Loading indicator -->
      {#if hasResourceLayer && anyResourcesLoading}
        <div class="layer-message loading st-typography-label">Loading</div>
      {/if}
      <!-- Loading indicator -->
      {#if hasResourceLayer && loadingErrors.length}
        <div class="layer-message error st-typography-label">
          Failed to load profiles for {loadingErrors.length} layer{pluralize(loadingErrors.length)}
        </div>
      {/if}
      <!-- Layers of Canvas Visualizations. -->
      <div class="layers" style="width: {drawWidth}px">
        {#if hasActivityLayer}
          <LayerActivities
            {activityOptions}
            {idToColorMaps}
            {activityTree}
            activityDirectives={filteredActivityDirectives}
            spans={filteredSpans}
            {activityDirectivesMap}
            {hasUpdateDirectivePermission}
            {showDirectives}
            {showSpans}
            {blur}
            {contextmenu}
            {dpr}
            drawHeight={computedDrawHeight}
            {drawWidth}
            {focus}
            {dblclick}
            {mousedown}
            {mousemove}
            {mouseout}
            {mouseup}
            {planEndTimeDoy}
            {plan}
            {planStartTimeYmd}
            {selectedActivityDirectiveId}
            {selectedSpanId}
            {spanUtilityMaps}
            {spansMap}
            {timelineInteractionMode}
            {timelineLockStatus}
            {user}
            {viewTimeRange}
            {xScaleView}
            on:contextMenu
            on:deleteActivityDirective
            on:dblClick
            on:mouseDown={onMouseDown}
            on:mouseOver={onMouseOver}
            on:updateRowHeight={onUpdateRowHeightLayer}
          />
        {/if}
        {#each layers as layer (layer.id)}
          {#if layer.chartType === 'line' || layer.chartType === 'x-range'}
            <LayerGaps
              {...layer}
              {dpr}
              drawHeight={computedDrawHeight}
              {drawWidth}
              filter={layer.filter.resource}
              {mousemove}
              {mouseout}
              resources={getResourcesForLayer(layer, resourceRequestMap)}
              {xScaleView}
              on:mouseOver={onMouseOver}
            />
          {/if}
          {#if layer.chartType === 'line' || (isXRangeLayer(layer) && layer.showAsLinePlot)}
            <LayerLine
              {...layer}
              ordinalScale={isXRangeLayer(layer) && layer.showAsLinePlot}
              {decimate}
              {interpolateHoverValue}
              {limitTooltipToLine}
              {contextmenu}
              {dpr}
              drawHeight={computedDrawHeight}
              {drawWidth}
              filter={layer.filter.resource}
              {mousemove}
              {mouseout}
              resources={getResourcesForLayer(layer, resourceRequestMap)}
              {viewTimeRange}
              {xScaleView}
              yAxes={yAxesWithScaleDomains}
              on:mouseOver={onMouseOver}
              on:contextMenu
            />
          {/if}
          {#if isXRangeLayer(layer) && !layer.showAsLinePlot}
            <LayerXRange
              {...layer}
              {contextmenu}
              {dpr}
              drawHeight={computedDrawHeight}
              {drawWidth}
              filter={layer.filter.resource}
              {mousemove}
              {mouseout}
              resources={getResourcesForLayer(layer, resourceRequestMap)}
              {xScaleView}
              on:mouseOver={onMouseOver}
              on:contextMenu
            />
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Drag Handle for Row Height Resizing. -->
  {#if !autoAdjustHeight && expanded}
    <RowDragHandleHeight rowHeight={drawHeight} on:updateRowHeight={onUpdateRowHeightDrag} />
  {/if}
</div>

<style>
  .layers,
  .overlay,
  svg {
    height: inherit;
    position: absolute;
  }

  .layers {
    pointer-events: none;
    z-index: 3;
  }

  .overlay {
    outline: none;
    z-index: 2;
  }

  svg {
    width: 100%;
    z-index: 1;
  }

  .row {
    cursor: pointer;
    display: block;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  :global(.row-root:hover .row-header .row-drag-handle-container) {
    opacity: 1;
  }

  .row-root .row-controls {
    display: flex;
  }

  :global(.right) {
    z-index: 0;
  }

  :global(.row-action.st-button.icon svg) {
    color: var(--st-gray-50);
  }

  :global(.row-action.st-button.icon:hover svg) {
    color: var(--st-gray-70);
  }

  :global(.row-action.row-action-active.st-button.icon svg) {
    color: var(--st-utility-blue);
  }

  .row-root {
    border-bottom: 2px solid var(--st-gray-20);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .row-root.expanded:not(.auto-height) {
    border-bottom: none;
  }

  .row-content {
    display: flex;
    position: relative;
  }

  .active-row .row-content:after {
    box-shadow: 0 0 0px 1px inset var(--st-utility-blue);
    content: ' ';
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 9;
  }

  .active-row :global(.row-header) {
    background: rgba(47, 128, 237, 0.06);
  }

  .layer-message {
    align-items: center;
    display: flex;
    font-size: 10px;
    height: 100%;
    justify-content: center;
    pointer-events: none;
    position: absolute;
    width: 100%;
    z-index: 3;
  }

  .loading {
    animation: 1s delayVisibility;
    color: var(--st-gray-50);
  }

  .error {
    color: var(--st-red);
  }

  @keyframes delayVisibility {
    0% {
      visibility: hidden;
    }
    99% {
      visibility: hidden;
    }
    100% {
      visibility: visible;
    }
  }
</style>
