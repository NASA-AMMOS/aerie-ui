<svelte:options immutable={true} />

<script lang="ts">
  import CollapseIcon from '@nasa-jpl/stellar/icons/collapse.svg?component';
  import FilterIcon from '@nasa-jpl/stellar/icons/filter.svg?component';
  import LineHeightIcon from '@nasa-jpl/stellar/icons/line_height.svg?component';
  import WaterfallIcon from '@nasa-jpl/stellar/icons/waterfall.svg?component';
  import type { ScaleTime } from 'd3-scale';
  import { select, type Selection } from 'd3-selection';
  import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
  import { pick } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { Status } from '../../enums/status';
  import { catchError } from '../../stores/errors';
  import {
    externalResources,
    fetchingResourcesExternal,
    resourceTypes,
    resourceTypesLoading,
  } from '../../stores/simulation';
  import { selectedRow } from '../../stores/views';
  import type {
    ActivityDirective,
    ActivityDirectiveId,
    ActivityDirectivesByView,
    ActivityDirectivesMap,
  } from '../../types/activity';
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
  import { getActivityDirectiveStartTimeMs, getDoyTime } from '../../utilities/time';
  import {
    getYAxesWithScaleDomains,
    isXRangeLayer,
    TimelineInteractionMode,
    type TimelineLockStatus,
  } from '../../utilities/timeline';
  import { tooltip } from '../../utilities/tooltip';
  import ConstraintViolations from './ConstraintViolations.svelte';
  import LayerActivity from './LayerActivity.svelte';
  import LayerGaps from './LayerGaps.svelte';
  import LayerLine from './LayerLine.svelte';
  import LayerXRange from './LayerXRange.svelte';
  import RowDragHandleHeight from './RowDragHandleHeight.svelte';
  import RowHeader from './RowHeader.svelte';
  import RowHorizontalGuides from './RowHorizontalGuides.svelte';
  import RowXAxisTicks from './RowXAxisTicks.svelte';
  import RowYAxisTicks from './RowYAxisTicks.svelte';

  export let activityDirectivesByView: ActivityDirectivesByView = { byLayerId: {}, byTimelineId: {} };
  export let activityDirectivesMap: ActivityDirectivesMap = {};
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
  export let showDirectives: boolean = true;
  export let showSpans: boolean = true;
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

  const dispatch = createEventDispatcher<{
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
  let heightsByLayer: Record<number, number> = {};
  let mousedown: MouseEvent;
  let mousemove: MouseEvent;
  let mouseout: MouseEvent;
  let mouseup: MouseEvent;
  let mouseDownActivityDirectivesByLayer: Record<number, ActivityDirective[]> = {};
  let mouseDownSpansByLayer: Record<number, Span[]> = {};
  let mouseOverActivityDirectivesByLayer: Record<number, ActivityDirective[]> = {};
  let mouseOverConstraintResults: ConstraintResultWithName[] = []; // For this row.
  let mouseOverPointsByLayer: Record<number, Point[]> = {};
  let mouseOverSpansByLayer: Record<number, Span[]> = {};
  let mouseOverGapsByLayer: Record<number, Point[]> = {};
  let overlaySvg: SVGElement;
  let yAxesWithScaleDomains: Axis[];
  let zoom: ZoomBehavior<SVGElement, unknown>;

  let resourceRequestMap: Record<string, ResourceRequest> = {};
  let loadedResources: Resource[];
  let loadingErrors: string[];
  let anyResourcesLoading: boolean = true;
  let activityLayerGroups = [];
  let finalActivityDirectives = [];
  let finalSpans = [];
  let activityTreeExpansionMap = {};
  let filterActivitiesByTime = false;
  let packedMode = false;
  let labelMode: 'on' | 'auto' | 'off' = 'on';
  let flatMode = false;
  let activityDirectiveTimeCache = {};

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

  $: heightsByLayer = pick(
    heightsByLayer,
    layers.map(({ id }) => id),
  );
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

  $: if (
    hasActivityLayer &&
    spansMap &&
    activityDirectivesByView?.byLayerId &&
    typeof filterActivitiesByTime === 'boolean'
  ) {
    // TODO manage this cache more correctly/better/in a store?
    activityDirectiveTimeCache = {};
    activityLayerGroups = [];

    const activityLayers = layers.filter(layer => layer.chartType === 'activity');
    // const combinedActivityLayer = layers.find(layer => layer.chartType === 'activity');
    // TODO Only doing this for 1 layer right now
    if (activityLayers.length) {
      // TODO decouple from view, instead compute on the fly

      // TODO grouping should probably be..
      /*
        1. Group directives by type
        2. Directive type=N (count(N))
        3. Group directive type N instance M

        v EnduranceSim (2) # directive type group, has two directives of this type
          v EnduranceSim # first directive of this type
            v EnduranceSim (1) # span type group, has 1 span of this type
              v EnduranceSim # first instance of this type
                v Commissioning (1) # span type group, has 1 span of this type
                  v Commissioning (1) # span type group, has 1 span of this type
                    v Commissioning # first of this span
                v SurfaceMission (1) # span, has 1 span of this type
                  v SurfaceMission # first of this span
                    > PerformScience (1202) # span type group, has 1202 of this type
                    > Traverse (176606) # span type group, has 176606 of this type
                    > ...
                v Rendezvous (1) # span, has 1 span of this type
          v EnduranceSim # second directive of this type

      */

      let directives = [];
      let spans = [];
      activityLayers.forEach(layer => {
        // TODO get rid of activityDirectivesByView concept and compute it on the fly
        // using the layer filters
        const layerDirectives = activityDirectivesByView.byLayerId[layer.id];
        if (layerDirectives) {
          // TODO causes bug since mutates original object, carries through to next row
          // need to specify color some other way or make a copy of these but don't make a copy plz
          layerDirectives.forEach(d => (d.color = layer.activityColor));
          directives = directives.concat(layerDirectives);
        }
        let layerSpans = Object.values(spansMap);
        if (layer.filter && layer.filter.activity !== undefined) {
          // TODO this is slow and doesn't need to be done every time that view timerange changes
          const a = performance.now();
          const types = layer.filter.activity.types;
          const typeMap = types.reduce((acc, next) => {
            acc[next] = true;
            return acc;
          }, {});
          const newSpans = [];
          layerSpans.forEach(span => {
            if (typeMap[span.type]) {
              span.color = layer.activityColor;
              newSpans.push(span);
              // span
            }
          });
          console.log(performance.now() - a);
          layerSpans = newSpans;

          // layerSpans = layerSpans.filter(span => types.indexOf(span.type) > -1);
        }
        spans = spans.concat(layerSpans);
      });
      spans.sort((a, b) => (a.startMs < b.startMs ? -1 : 1));
      if (directives.length || spans.length) {
        if (packedMode) {
          finalActivityDirectives = directives;
          finalSpans = spans;
        } else if (flatMode) {
          activityLayerGroups = generateActivityTreeFlat(directives, spans, activityTreeExpansionMap, viewTimeRange);
        } else {
          activityLayerGroups = generateActivityTree(directives, activityTreeExpansionMap, viewTimeRange);
        }
      }
    }
  }

  function groupBy(objArr: Record<any, any>[], key: any) {
    return objArr.reduce((acc, next) => {
      if (!acc[next[key]]) {
        acc[next[key]] = [];
      }
      acc[next[key]].push(next);
      return acc;
    }, {});
  }

  function getNodeExpanded(id, expansionMap) {
    if (!expansionMap.hasOwnProperty(id)) {
      return false;
    }
    return expansionMap[id];
  }

  function spanInView(span, viewTimeRange) {
    const spanInBounds = span.startMs >= viewTimeRange.start && span.startMs < viewTimeRange.end;
    const sticky = span.startMs < viewTimeRange.start && span.startMs + span.durationMs >= viewTimeRange.start;
    return spanInBounds || sticky;
  }

  function generateActivityTreeFlat(directives: ActivityDirective[], spans: Span[], visibilityMap, viewTimeRange) {
    const tree = [];
    let computedDirectives = directives;
    let computedSpans = spans;
    if (filterActivitiesByTime) {
      computedSpans = computedSpans.filter(span => spanInView(span, viewTimeRange));
      computedDirectives = directives.filter(directive => {
        const directiveStartTime = getActivityDirectiveStartTimeMs(
          directive.id,
          planStartTimeYmd,
          planEndTimeDoy,
          activityDirectivesMap,
          spansMap,
          spanUtilityMaps,
          activityDirectiveTimeCache,
        );

        const directiveInView = directiveStartTime >= viewTimeRange.start && directiveStartTime < viewTimeRange.end;
        if (!directiveInView) {
          // Get max span bounds
          const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
          const rootSpan = spansMap[rootSpanId];
          if (rootSpan) {
            return spanInView(rootSpan, viewTimeRange);
          }
          // TODO handle case where duration is null (unfinished), need to look at child spans to get time bounds
        }
        return directiveInView;
      });
    }
    /* Steps
      1. Group spans by type
      2. For each span within each group, tack on the directive if the span has an immediate directive parent
     */

    // TODO filter by activity filter?
    const groupedSpans = groupBy(computedSpans, 'type');
    const groups = [];
    Object.keys(groupedSpans)
      .sort()
      .forEach(type => {
        const spanGroup = groupedSpans[type];
        const id = type;
        const expanded = getNodeExpanded(id, activityTreeExpansionMap);
        const label = `type=${type} (${spanGroup.length})`;
        groups.push({
          expanded: expanded,
          label,
          id: id,
          groups: expanded
            ? spanGroup
                .map(spanChild =>
                  getSpanSubtree(spanChild, id, activityTreeExpansionMap, 'span', filterActivitiesByTime),
                )
                .flat()
            : [],
          isLeaf: false,
          type: 'aggregation',
          spans: spanGroup,
          // directives: [directive],
        });
      });
    return groups;
    // Activities grouped by type
    Object.keys(groupedDirectives)
      .sort()
      .forEach(type => {
        // Specific Activity type
        const directiveGroup = groupedDirectives[type];
        directiveGroup.sort((a, b) => {
          const aTime = getActivityDirectiveStartTimeMs(
            a.id,
            planStartTimeYmd,
            planEndTimeDoy,
            activityDirectivesMap,
            spansMap,
            spanUtilityMaps,
            activityDirectiveTimeCache,
          );
          const bTime = getActivityDirectiveStartTimeMs(
            b.id,
            planStartTimeYmd,
            planEndTimeDoy,
            activityDirectivesMap,
            spansMap,
            spanUtilityMaps,
            activityDirectiveTimeCache,
          );
          return aTime < bTime ? -1 : 0;
        });
        const label = `type=${type} (${directiveGroup.length})`;
        const id = type;
        const expanded = getNodeExpanded(id, activityTreeExpansionMap);
        const groups = [];
        if (expanded) {
          directiveGroup.forEach(directive => {
            // Get number of child spans for the root span
            let count = 0;
            const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
            const id2 = `${id}_${directive.id}`;
            let groups2 = [];
            if (typeof rootSpanId === 'number') {
              const spanChildren = spanUtilityMaps.spanIdToChildIdsMap[rootSpanId].map(id => spansMap[id]);
              count += spanChildren.length;
              groups2 = getSpanSubtree(
                spansMap[rootSpanId],
                id2,
                activityTreeExpansionMap,
                'aggregation',
                filterActivitiesByTime,
              );
            }
            const label2 = `${directive.type} id=${directive.id} ${count > 0 ? `(${count} children)` : ''}`;
            const expanded2 = getNodeExpanded(id2, activityTreeExpansionMap);

            groups.push({
              expanded: expanded2,
              label: label2,
              id: id2,
              groups: groups2,
              isLeaf: count < 1,
              type: 'directive',
              directives: [directive],
            });
          });
        }
        tree.push({
          expanded,
          label,
          id,
          groups,
          isLeaf: false,
          type: 'aggregate',
          directives: directiveGroup,
        });
      });
    return tree;
  }

  function generateActivityTree(directives: ActivityDirective[], visibilityMap, viewTimeRange) {
    const tree = [];
    let computedDirectives = directives;
    if (filterActivitiesByTime) {
      computedDirectives = directives.filter(directive => {
        const directiveStartTime = getActivityDirectiveStartTimeMs(
          directive.id,
          planStartTimeYmd,
          planEndTimeDoy,
          activityDirectivesMap,
          spansMap,
          spanUtilityMaps,
          activityDirectiveTimeCache,
        );

        const directiveInView = directiveStartTime >= viewTimeRange.start && directiveStartTime < viewTimeRange.end;
        if (!directiveInView) {
          // Get max span bounds
          const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
          const rootSpan = spansMap[rootSpanId];
          if (rootSpan) {
            return spanInView(rootSpan, viewTimeRange);
          }
          // TODO handle case where duration is null (unfinished), need to look at child spans to get time bounds
        }
        return directiveInView;
      });
    }
    const groupedDirectives = groupBy(computedDirectives, 'type');
    // Activities grouped by type
    Object.keys(groupedDirectives)
      .sort()
      .forEach(type => {
        // Specific Activity type
        const directiveGroup = groupedDirectives[type];
        directiveGroup.sort((a, b) => {
          const aTime = getActivityDirectiveStartTimeMs(
            a.id,
            planStartTimeYmd,
            planEndTimeDoy,
            activityDirectivesMap,
            spansMap,
            spanUtilityMaps,
            activityDirectiveTimeCache,
          );
          const bTime = getActivityDirectiveStartTimeMs(
            b.id,
            planStartTimeYmd,
            planEndTimeDoy,
            activityDirectivesMap,
            spansMap,
            spanUtilityMaps,
            activityDirectiveTimeCache,
          );
          return aTime < bTime ? -1 : 0;
        });
        const label = `type=${type} (${directiveGroup.length})`;
        const id = type;
        const expanded = getNodeExpanded(id, activityTreeExpansionMap);
        const groups = [];
        if (expanded) {
          directiveGroup.forEach(directive => {
            // Get number of child spans for the root span
            let count = 0;
            const rootSpanId = spanUtilityMaps.directiveIdToSpanIdMap[directive.id];
            const id2 = `${id}_${directive.id}`;
            let groups2 = [];
            if (typeof rootSpanId === 'number') {
              const spanChildren = spanUtilityMaps.spanIdToChildIdsMap[rootSpanId].map(id => spansMap[id]);
              count += spanChildren.length;
              groups2 = getSpanSubtree(
                spansMap[rootSpanId],
                id2,
                activityTreeExpansionMap,
                'aggregation',
                filterActivitiesByTime,
              );
            }
            const label2 = `${directive.type} id=${directive.id} ${count > 0 ? `(${count} children)` : ''}`;
            const expanded2 = getNodeExpanded(id2, activityTreeExpansionMap);

            groups.push({
              expanded: expanded2,
              label: label2,
              id: id2,
              groups: groups2,
              isLeaf: count < 1,
              type: 'directive',
              directives: [directive],
            });
          });
        }
        tree.push({
          expanded,
          label,
          id,
          groups,
          isLeaf: false,
          type: 'aggregate',
          directives: directiveGroup,
        });
      });
    return tree;
  }

  function getSpanSubtree(span: Span, parentId: string, activityTreeExpansionMap, type, filterActivitiesByTime) {
    const groups = [];
    const spanChildren = spanUtilityMaps.spanIdToChildIdsMap[span.id].map(id => spansMap[id]);
    if (type === 'aggregation') {
      // Group by type
      let computedSpans = spanChildren;
      if (filterActivitiesByTime) {
        computedSpans = spanChildren.filter(span => spanInView(span, viewTimeRange));
      }
      // const groupedSpanChildren = groupBy(spanChildrenInView, 'type');
      const groupedSpanChildren = groupBy(computedSpans, 'type');
      Object.keys(groupedSpanChildren)
        .sort() // TODO sort by time or name? Both have different effects
        .forEach(key => {
          const spanGroup = groupedSpanChildren[key];
          const id = `${parentId}_${key}`;
          const expanded = getNodeExpanded(id, activityTreeExpansionMap);
          groups.push({
            expanded,
            label: `type=${key} (${spanGroup.length})`,
            id,
            isLeaf: false,
            spans: spanGroup,
            groups: expanded
              ? spanGroup
                  // .slice(0, 10)
                  .map(spanChild =>
                    getSpanSubtree(spanChild, id, activityTreeExpansionMap, 'span', filterActivitiesByTime),
                  )
                  .flat()
              : [],
            type: 'aggregate',
          });
        });
    } else if (type === 'span') {
      const id = `${parentId}_${span.id}`;
      const expanded = getNodeExpanded(id, activityTreeExpansionMap);
      const count = spanChildren.length;
      groups.push({
        expanded,
        label: `${span.type} id=${span.id} ${count > 0 ? `(${count} children)` : ''}`,
        id,
        spans: [span],
        groups: expanded
          ? getSpanSubtree(span, id, activityTreeExpansionMap, 'aggregation', filterActivitiesByTime)
          : [],
        isLeaf: count < 1,
        type: 'aggregate',
      });
    }
    return groups;
  }

  function onActivityTreeNodeChange(e) {
    const group = e.detail;
    activityTreeExpansionMap = { ...activityTreeExpansionMap, [group.id]: !group.expanded };
  }

  function onActivityTimeFilterChange() {
    filterActivitiesByTime = !filterActivitiesByTime;
  }

  function onFlatModeChange() {
    flatMode = !flatMode;
  }

  function onActivityHierarchyCollapse() {
    activityTreeExpansionMap = {};
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
    const { layerId } = detail;

    if (layerId != null) {
      mouseDownActivityDirectivesByLayer[layerId] = detail?.activityDirectives ?? [];
      mouseDownSpansByLayer[layerId] = detail?.spans ?? [];

      const activityDirectives = Object.values(mouseDownActivityDirectivesByLayer).flat();
      const spans = Object.values(mouseDownSpansByLayer).flat();

      dispatch('mouseDown', { ...detail, activityDirectives, layerId, rowId: id, spans });
    }
  }

  function onMouseOver(event: CustomEvent<RowMouseOverEvent>) {
    const { detail } = event;
    const { layerId } = detail;

    if (layerId != null) {
      mouseOverActivityDirectivesByLayer[layerId] = detail?.activityDirectives ?? [];
      mouseOverConstraintResults = detail?.constraintResults ?? mouseOverConstraintResults;
      mouseOverPointsByLayer[layerId] = detail?.points ?? [];
      mouseOverSpansByLayer[layerId] = detail?.spans ?? [];
      mouseOverGapsByLayer[layerId] = detail?.gaps ?? mouseOverGapsByLayer[layerId] ?? [];

      dispatch('mouseOver', {
        ...detail,
        activityDirectivesByLayer: mouseOverActivityDirectivesByLayer,
        constraintResults: mouseOverConstraintResults,
        gapsByLayer: mouseOverGapsByLayer,
        pointsByLayer: mouseOverPointsByLayer,
        spansByLayer: mouseOverSpansByLayer,
      });
    }
  }

  function onUpdateRowHeightDrag(event: CustomEvent<{ newHeight: number }>) {
    const { newHeight } = event.detail;
    dispatch('updateRowHeight', { newHeight, rowId: id });
  }

  function onUpdateRowHeightLayer(event: CustomEvent<{ layerId: number; newHeight: number }>) {
    if (autoAdjustHeight) {
      const { detail } = event;
      heightsByLayer[detail.layerId] = detail.newHeight;
      const heights = Object.values(heightsByLayer);
      const newHeight = Math.max(...heights);

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
      on:activity-tree-node-change={onActivityTreeNodeChange}
      {activityLayerGroups}
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
    >
      {#if hasActivityLayer}
        <button
          class="st-button icon"
          on:click|stopPropagation={() => {
            if (labelMode === 'on') {
              labelMode = 'auto';
            } else if (labelMode === 'auto') {
              labelMode = 'off';
            } else {
              labelMode = 'on';
            }
          }}
          use:tooltip={{ content: 'Toggle Packed Mode', placement: 'top' }}
        >
          {labelMode}
        </button>
        <button
          class="st-button icon"
          style:color={packedMode ? 'var(--st-utility-blue)' : ''}
          on:click|stopPropagation={() => (packedMode = !packedMode)}
          use:tooltip={{ content: 'Toggle Packed Mode', placement: 'top' }}
        >
          <WaterfallIcon />
        </button>
        <button
          class="st-button icon"
          style:color={filterActivitiesByTime ? 'var(--st-utility-blue)' : ''}
          on:click|stopPropagation={onActivityTimeFilterChange}
          use:tooltip={{ content: 'Filter Activities by Time Window', placement: 'top' }}
        >
          <FilterIcon />
        </button>
        <button
          class="st-button icon"
          style:color={flatMode ? 'var(--st-utility-blue)' : ''}
          on:click|stopPropagation={onFlatModeChange}
          use:tooltip={{ content: flatMode ? 'Hierarchy Mode' : 'Flat Mode', placement: 'top' }}
        >
          <LineHeightIcon />
        </button>
        <button
          class="st-button icon"
          on:click|stopPropagation={onActivityHierarchyCollapse}
          use:tooltip={{ content: 'Collapse Hierarchy', placement: 'top' }}
        >
          <CollapseIcon />
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
        {#each layers as layer (layer.id)}
          {#if layer.chartType === 'activity'}
            <LayerActivity
              {...layer}
              {activityLayerGroups}
              activityDirectives={finalActivityDirectives}
              spans={finalSpans}
              {labelMode}
              {activityDirectivesMap}
              {hasUpdateDirectivePermission}
              {showDirectives}
              {showSpans}
              {blur}
              {contextmenu}
              {dpr}
              drawHeight={computedDrawHeight}
              {drawWidth}
              filter={layer.filter.activity}
              {focus}
              {dblclick}
              {mousedown}
              {mousemove}
              {mouseout}
              {mouseup}
              mode={packedMode ? 'packed2' : 'test1'}
              {planEndTimeDoy}
              {plan}
              {planStartTimeYmd}
              {selectedActivityDirectiveId}
              {selectedSpanId}
              {simulationDataset}
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

  .row-edit-button {
    display: flex;
  }

  :global(.row-edit-button.st-button.icon svg) {
    color: var(--st-gray-50);
  }

  :global(.row-edit-button.st-button.icon:hover svg) {
    color: var(--st-gray-70);
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

  .active-row .row-content {
    background: rgba(47, 128, 237, 0.06);
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
