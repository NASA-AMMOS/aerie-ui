import type { Selection } from 'd3-selection';
import type { ActivityDirective } from './activity';
import type { ConstraintResult } from './constraint';
import type { Span } from './simulation';

export interface ActivityLayer extends Layer {
  activityColor: string;
  activityHeight: number;
}

export type ActivityLayerFilter = {
  types: string[];
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

export type ChartType = 'activity' | 'line' | 'x-range';

export interface Layer {
  chartType: ChartType;
  filter: {
    activity?: ActivityLayerFilter;
    resource?: ResourceLayerFilter;
  };
  id: number;
  yAxisId: number | null;
}

export interface LineLayer extends Layer {
  lineColor: string;
  lineWidth: number;
  pointRadius: number;
}

export interface LinePoint extends Point {
  radius: number;
  y: number;
}

export type MouseDown = {
  activityDirectives: ActivityDirective[];
  e: MouseEvent;
  layerId: number;
  rowId: number;
  spans: Span[];
  timelineId: number;
};

export type MouseOver = {
  activityDirectives?: ActivityDirective[];
  constraintResults?: ConstraintResult[];
  e: MouseEvent;
  gaps?: Point[];
  layerId: number;
  points?: Point[];
  selectedActivityDirectiveId?: number;
  selectedSpanId?: number;
  spans?: Span[];
};

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

export type Row = {
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
  coarseTime: string;
  date: Date;
  fineTime: string;
  hideLabel: boolean;
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
}

export interface XRangePoint extends Point {
  is_gap?: boolean;
  label: Label;
}

export type DirectiveVisibilityToggleMap = Record<string, boolean>;
