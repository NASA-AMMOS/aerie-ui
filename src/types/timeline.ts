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
  children: ExternalEventTreeNode[];
  expanded: boolean;
  id: string;
  isLeaf: boolean;
  items: ExternalEventItem[];
  label: string;
};

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
    externalEvent?: ExternalEventLayerFilter;
    resource?: ResourceLayerFilter;
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
  externalEvents?: ExternalEvent[];
  layerId?: number;
  rowId?: number;
  spans?: Span[];
  timelineId?: number;
};

export type MouseOver = {
  activityDirectives?: ActivityDirective[];
  constraintResults?: ConstraintResultWithName[];
  e: MouseEvent;
  externalEvents?: ExternalEvent[];
  gapsByLayer?: Record<number, Point[]>;
  layerId?: number; //TODO not relevant since we sometimes have multiple layers per click
  origin?: MouseOverOrigin; //TODO perhaps remove this
  pointsByLayer?: Record<number, Point[]>;
  row?: Row;
  selectedActivityDirectiveId?: number | undefined;
  selectedExternalEventId?: number | undefined;
  selectedSpanId?: number;
  spans?: Span[];
};

export type RowMouseOverEvent = Omit<
  MouseOver,
  'activityDirectivesByLayer' | 'externalEventsByLayer' | 'gapsByLayer' | 'pointsByLayer' | 'spansByLayer'
> & {
  activityDirectives?: ActivityDirective[];
  externalEvents?: ExternalEvent[];
  gaps?: Point[];
  points?: Point[];
  spans?: Span[];
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
  // Describes the primary method in which external events are visualized within this row
  displayMode: 'grouped' | 'compact';

  // Height of external event subrows
  externalEventHeight: number;

  // Determines whether to group the External Events by their event type, or their external source
  groupBy: 'event_type' | 'source_id';

  // Bin size for external event children in grouped mode
  groupedModeBinSize: number;

  // External event text label behavior
  labelVisibility: 'on' | 'off' | 'auto';
};

export type Row = {
  activityOptions?: ActivityOptions;
  autoAdjustHeight: boolean;
  expanded: boolean;
  externalEventOptions?: ExternalEventOptions;
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
