import type { Selection } from 'd3-selection';
import type { ActivityDirective } from './activity';
import type { ConstraintResultWithName } from './constraint';
import type { ExternalEvent } from './external-event';
import type { ResourceType, Span } from './simulation';

export type ActivityTree = ActivityTreeNode[];
export type ExternalEventTree = ExternalEventTreeNode[];

export type ActivityTreeNode = {
  children: ActivityTreeNode[]; // Child nodes of this directive/span/aggregation
  expanded: boolean;
  id: string;
  isLeaf: boolean;
  items: ActivityTreeNodeItem[]; // Directives and/or spans to render on the timeline at this level of the tree
  label: string;
  type: 'aggregation' | 'directive' | 'span';
};
export type ExternalEventTreeNode = {
  children: ExternalEventTreeNode[];  // Child nodes of this external event
  expanded: boolean;
  id: string;  // TODO - should this be a number?
  isLeaf: boolean;
  items: ExternalEventItem[];  // External events to render on the timeline at this level of the tree
  label: string;
  // type: ...  TODO - I think this is always ExternalEvent for these.
}

export type ActivityTreeNodeItem = { directive?: ActivityDirective; span?: Span };
export type ExternalEventItem = { externalEvent?: ExternalEvent };

export type ActivityTreeNodeDrawItem = ActivityTreeNodeItem & { startX: number };
export type ExternalEventDrawItem = ExternalEventItem & { startX: number };

export type ActivityTreeExpansionMap = Record<string, boolean>;
export type ExternalEventTreeExpansionMap = Record<string, boolean>;

export interface ActivityLayer extends Layer {
  activityColor: string;
  activityHeight: number; // @deprecated TODO how should we deprecate view properties?
}
export interface ExternalEventLayer extends Layer {
  externalEventColor: string;
  externalEventHeight: number; // @deprecated TODO how should we deprecate view properties?
}

export type ActivityLayerFilter = {
  types: string[];
};
export type ExternalEventLayerFilter = {
  event_types: string[];
};

export type AxisDomainFitMode = 'fitPlan' | 'fitTimeWindow' | 'manual';

export type Axis = {
  color: string;
  domainFitMode: AxisDomainFitMode;
  id: number;
  label: Label;
  renderTickLines?: boolean;
  scaleDomain?: (number | null)[];
  tickCount: number | null;
};

export type BoundingBox = {
  maxTimeX: number;
  maxX: number;
  maxY: number;
  minX: number;
};

export type PointBounds = {
  maxXCanvas: number;
  x: number;
  xCanvas: number;
  xEnd: number;
  xEndCanvas: number;
};

export type SpanTimeBounds = {
  duration: number;
  end: number;
  start: number;
};

export type HorizontalGuide = {
  id: number;
  label: Label;
  y: number;
  yAxisId: number;
};

export type Label = {
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  color?: string;
  fontFace?: string;
  fontSize?: number;
  hidden?: boolean;
  text: string;
};

export type ChartType = 'activity' | 'line' | 'x-range' | 'external-event';

export interface Layer {
  chartType: ChartType;
  filter: {
    // TODO refactor in next PR to a unified filter
    activity?: ActivityLayerFilter;
    resource?: ResourceLayerFilter;
    externalEvent?: ExternalEventLayerFilter;
  };
  id: number;
  name: string;
  yAxisId: number | null;
}

export interface LineLayer extends Layer {
  lineColor: string;
  lineWidth: number;
  pointRadius: number;
}

export interface LinePoint extends Point {
  y:
    | number
    | string
    | null /* TODO this type leaves much to be desired – could make an OrdinalLinePoint and a NumericLinePoint? */;
}

export type MouseDown = {
  activityDirectives?: ActivityDirective[];
  e: MouseEvent;
  layerId?: number;
  rowId?: number;
  spans?: Span[];
  timelineId?: number;
  externalEvents?: ExternalEvent[];
};

export type MouseOver = {
  activityDirectives?: ActivityDirective[];
  constraintResults?: ConstraintResultWithName[];
  e: MouseEvent;
  gapsByLayer?: Record<number, Point[]>;
  layerId?: number; //TODO not relevant since we sometimes have multiple layers per click
  origin?: MouseOverOrigin; //TODO perhaps remove this
  pointsByLayer?: Record<number, Point[]>;
  row?: Row;
  selectedActivityDirectiveId?: number;
  selectedSpanId?: number;
  spans?: Span[];
  externalEvents?: ExternalEvent[];
  selectedExternalEventId?: number;
};

export type RowMouseOverEvent = Omit<
  MouseOver,
  'activityDirectivesByLayer' | 'externalEventsByLayer' | 'gapsByLayer' | 'pointsByLayer' | 'spansByLayer'
> & {
  activityDirectives?: ActivityDirective[];
  gaps?: Point[];
  points?: Point[];
  spans?: Span[];
  externalEvents?: ExternalEvent[];
};

export type MouseOverOrigin = 'row-header' | 'layer-line' | 'layer-activity' | 'layer-x-range' | 'layer-external-event';

export interface Point {
  id: number;
  name: string;
  type: ChartType;
  x: number;
}

export type QuadtreePoint = {
  id: number;
  x: number;
  y: number;
};

export type QuadtreeRect = {
  height: number;
  id: number | string;
  width: number;
  x: number;
  y: number;
};

export type ResourceLayerFilter = {
  names: string[];
};

export type ActivityOptions = {
  // Height of activity subrows
  activityHeight: number;

  // Whether or not to display only directives, only spans, or both in the row
  composition: 'directives' | 'spans' | 'both';

  // Describes the primary method in which activities are visualized within this row
  displayMode: 'grouped' | 'compact';

  // If 'directive' the activities are grouped starting with directive types, if 'flat' activities are grouped by type regardless of hierarchy
  hierarchyMode: 'directive' | 'flat';

  // Activity text label behavior
  labelVisibility: 'on' | 'off' | 'auto';
};

// based on ActivityOptions, but exclusive for drawing ExternalEvents
export type ExternalEventOptions = {
  // Height of external event subrows
  externalEventHeight: number;

  // TODO - I don't think we need to support composition here. Do we ever draw spans + EEs?

  // Describes the primary method in which external events are visualized within this row
  displayMode: 'grouped' | 'compact';

  // If 'source' the external events are grouped by source type. If 'event' the external events are grouped by external event type. If 'flat' the external events are grouped by event type regardless of hierarchy
  // TODO - what exactly is the hierarchy? based on the tree setup?
  hierarchyMode: 'source' | 'event' | 'flat';

  // External event text label behavior
  labelVisibility: 'on' | 'off' | 'auto';
};

export type Row = {
  activityOptions?: ActivityOptions;
  externalEventOptions?: ExternalEventOptions;
  autoAdjustHeight: boolean;
  expanded: boolean;
  height: number;
  horizontalGuides: HorizontalGuide[];
  id: number;
  layers: Layer[];
  name: string;
  yAxes: Axis[];
};

export type TimeRange = {
  end: number;
  start: number;
};

export type Timeline = {
  id: number;
  marginLeft: number;
  marginRight: number;
  rows: Row[];
  verticalGuides: VerticalGuide[];
};

export type VerticalGuide = {
  id: number;
  label: Label;
  timestamp: string;
};

export type VerticalGuideSelection = {
  group: Selection<SVGGElement, unknown, null, undefined>;
  label: Selection<SVGTextElement, unknown, null, undefined>;
};

export type XAxisTick = {
  additionalLabels: string[];
  date: Date;
  label: string;
};

/**
 * @see https://github.com/d3/d3-scale-chromatic#categorical
 */
export type XRangeLayerColorScheme =
  | 'schemeAccent'
  | 'schemeCategory10'
  | 'schemeDark2'
  | 'schemePaired'
  | 'schemePastel1'
  | 'schemePastel2'
  | 'schemeSet1'
  | 'schemeSet2'
  | 'schemeSet3'
  | 'schemeTableau10';

export interface XRangeLayer extends Layer {
  colorScheme: XRangeLayerColorScheme;
  opacity: number;
  showAsLinePlot: boolean;
}

export interface XRangePoint extends Point {
  is_gap?: boolean;
  is_null?: boolean;
  label: Label;
}

export type TimelineItemType = ResourceType | ActivityType;

export type TimelineItemListFilterOption = {
  color?: string;
  label: string;
  value: string;
};
