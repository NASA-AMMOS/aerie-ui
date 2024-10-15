import Ajv from 'ajv';
import { ViewDefaultDiscreteOptions } from '../constants/view';
import jsonSchema from '../schemas/ui-view-schema.json';
import type { ActivityType } from '../types/activity';
import type { ExternalEventType } from '../types/external-event';
import type { ResourceType } from '../types/simulation';
import type { View, ViewGridColumns, ViewGridRows } from '../types/view';
import { createRow,
         createTimeline,
         createTimelineActivityLayer,
         createTimelineExternalEventLayer,
         createTimelineResourceLayer,
         createTimelineLineLayer,
         createTimelineXRangeLayer,
         createYAxis,
} from './timeline';

/**
 * Generates a default generic UI view.
 */
export function generateDefaultView(
  activityTypes: ActivityType[] = [],
  resourceTypes: ResourceType[] = [],
  externalEventTypes: ExternalEventType[] = [],
): View {
  const now = new Date().toISOString();
  const types: string[] = activityTypes.map(({ name }) => name);

  const timeline = createTimeline([], { marginLeft: 250, marginRight: 30 });
  const timelines = [timeline];

  const externalEventLayer = createTimelineExternalEventLayer(timelines, {
    filter: { externalEvent: { event_types: externalEventTypes.map(e => e.name) } },
  });
  const externalEventRow = createRow(timelines, {
    autoAdjustHeight: false,
    expanded: true,
    discreteOptions: { ...ViewDefaultDiscreteOptions, displayMode: 'grouped' },
    height: 100,
    layers: [externalEventLayer],
    name: 'External Events',
  });
  timeline.rows.push(externalEventRow);

  const activityLayer = createTimelineActivityLayer(timelines, {
    filter: { activity: { types } },
  });
  const activityRow = createRow(timelines, {
    discreteOptions: { ...ViewDefaultDiscreteOptions, displayMode: 'grouped' },
    autoAdjustHeight: true,
    expanded: true,
    layers: [activityLayer],
    name: 'Activities by Type',
  });
  timeline.rows.push(activityRow);

  // Generate a row for every resource
  resourceTypes.map(resourceType => {
    const { layer, yAxis } = createTimelineResourceLayer(timelines, resourceType);
    const layers = layer ? [layer] : [];
    const resourceRow = createRow(timelines, {
      autoAdjustHeight: false,
      expanded: true,
      height: 100,
      layers,
      name: resourceType.name,
      yAxes: [yAxis],
    });

    timeline.rows.push(resourceRow);
  });

  return {
    created_at: now,
    definition: {
      plan: {
        activityDirectivesTable: {
          autoSizeColumns: 'fill',
          columnDefs: [
            {
              aggFunc: null,
              colId: 'arguments',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              field: 'id',
              filter: 'text',
              headerName: 'ID',
              resizable: true,
              sortable: true,
              width: 80,
            },
            {
              aggFunc: null,
              colId: 'last_modified_at',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              aggFunc: null,
              colId: 'metadata',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              field: 'name',
              filter: 'text',
              headerName: 'Name',
              resizable: true,
              sortable: true,
              width: 200,
            },
            {
              field: 'type',
              filter: 'text',
              headerName: 'Type',
              resizable: true,
              sortable: true,
            },
            {
              aggFunc: null,
              colId: 'source_scheduling_goal_id',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              field: 'start_offset',
              filter: 'text',
              headerName: 'Start Offset',
              resizable: true,
              sortable: true,
            },
            {
              aggFunc: null,
              colId: 'tags',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              aggFunc: null,
              colId: 'type',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 280,
            },
            {
              aggFunc: null,
              colId: 'anchor_id',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              aggFunc: null,
              colId: 'applied_preset',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              aggFunc: null,
              colId: 'anchored_to_start',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              field: 'derived_start_time',
              filter: 'text',
              headerName: 'Absolute Start Time (UTC)',
              resizable: true,
              sortable: true,
              width: 200,
            },
            {
              aggFunc: null,
              colId: 'start_offset',
              pinned: null,
              pivot: false,
              pivotIndex: null,
              rowGroup: false,
              rowGroupIndex: null,
              sort: null,
              sortIndex: null,
              width: 200,
            },
            {
              field: 'created_at',
              filter: 'text',
              headerName: 'Created At (UTC)',
              hide: true,
              resizable: true,
              sortable: true,
              width: 200,
            },
          ],
          columnStates: [],
        },
        activitySpansTable: {
          autoSizeColumns: 'fill',
          columnDefs: [
            {
              field: 'id',
              filter: 'text',
              headerName: 'ID',
              resizable: true,
              sortable: true,
            },
            {
              field: 'dataset_id',
              filter: 'text',
              headerName: 'Dataset ID',
              resizable: true,
              sortable: true,
            },
            {
              field: 'parent_id',
              filter: 'text',
              headerName: 'Parent ID',
              resizable: true,
              sortable: true,
            },
            {
              field: 'type',
              filter: 'text',
              headerName: 'Type',
              resizable: true,
              sortable: true,
            },
            {
              field: 'start_offset',
              filter: 'text',
              headerName: 'Start Offset',
              resizable: true,
              sortable: true,
            },
            {
              field: 'duration',
              filter: 'text',
              headerName: 'Duration',
              resizable: true,
              sortable: true,
            },
          ],
          columnStates: [],
        },
        grid: {
          columnSizes: '1fr 3px 3fr 3px 1fr',
          leftComponentBottom: 'SimulationPanel',
          leftComponentTop: 'TimelineItemsPanel',
          leftHidden: false,
          leftRowSizes: '1fr',
          leftSplit: false,
          middleComponentBottom: 'ActivityDirectivesTablePanel',
          middleRowSizes: '2fr 3px 1fr',
          middleSplit: true,
          rightComponentBottom: 'TimelineEditorPanel',
          rightComponentTop: 'ActivityFormPanel',
          rightHidden: false,
          rightRowSizes: '1fr',
          rightSplit: false,
        },
        iFrames: [
          {
            id: 0,
            src: 'https://eyes.nasa.gov/apps/mars2020/#/home',
            title: 'Mars-2020-EDL',
          },
        ],
        simulationEventsTable: {
          autoSizeColumns: 'fit',
          columnDefs: [
            {
              field: 'id',
              filter: 'text',
              headerName: 'ID',
              resizable: true,
              sortable: true,
            },
            {
              field: 'dataset_id',
              filter: 'text',
              headerName: 'Dataset ID',
              resizable: true,
              sortable: true,
            },
            {
              field: 'start_offset',
              filter: 'text',
              headerName: 'Start Offset',
              hide: true,
              resizable: true,
              sortable: true,
            },
            {
              field: 'dense_time',
              filter: 'text',
              headerName: 'Dense Time',
              hide: true,
              resizable: true,
              sortable: true,
            },
            {
              field: 'topic',
              filter: 'text',
              headerName: 'Topic',
              resizable: true,
              sortable: true,
            },
            {
              field: 'value',
              filter: 'text',
              headerName: 'Value',
              resizable: true,
              sortable: true,
            },
          ],
          columnStates: [],
        },
        timelines,
      },
    },
    id: 0,
    name: 'Default View',
    owner: 'system',
    updated_at: now,
  };
}

export function parseColumnSizes(
  columnSizes = '1fr 3px 3fr 3px 1fr',
  leftHidden: boolean,
  rightHidden: boolean,
): ViewGridColumns | null {
  if (!leftHidden && !rightHidden) {
    const matches = columnSizes.match(
      new RegExp(`^(?<col1>\\S+)\\s(!?\\S+)\\s(?<col2>\\S+)\\s(!?\\S+)\\s(?<col3>\\S+)$`, 'i'),
    );
    if (matches) {
      const { groups: { col1, col2, col3 } = {} } = matches;
      return {
        col1,
        col2,
        col3,
      };
    }
  } else if (leftHidden && rightHidden) {
    const matches = columnSizes.match(new RegExp(`^\\s(?<col2>\\S+)$`, 'i'));
    if (matches) {
      const { groups: { col2 } = {} } = matches;
      return {
        col2,
      };
    }
  } else if (!leftHidden && rightHidden) {
    const matches = columnSizes.match(new RegExp(`^(?<col1>\\S+)\\s(?!\\S+)\\s(?<col2>\\S+)$`, 'i'));
    if (matches) {
      const { groups: { col1, col2 } = {} } = matches;
      return {
        col1,
        col2,
      };
    }
  } else if (leftHidden && !rightHidden) {
    const matches = columnSizes.match(new RegExp(`^(?<col2>\\S+)\\s(?!\\S+)\\s(?<col3>\\S+)$`, 'i'));
    if (matches) {
      const { groups: { col2, col3 } = {} } = matches;
      return {
        col2,
        col3,
      };
    }
  }

  return {
    col1: '1fr',
    col2: '3fr',
    col3: '1fr',
  };
}

export function createColumnSizes(
  { col1 = '1fr', col2 = '3fr', col3 = '1fr' }: ViewGridColumns,
  leftHidden: boolean,
  rightHidden: boolean,
): string {
  const gutterSize = '3px';

  if (leftHidden && rightHidden) {
    return col2;
  } else if (!leftHidden && rightHidden) {
    return `${col1} ${gutterSize} ${col2}`;
  } else if (leftHidden && !rightHidden) {
    return `${col2} ${gutterSize} ${col3}`;
  }

  return `${col1} ${gutterSize} ${col2} ${gutterSize} ${col3}`;
}

export function createRowSizes({ row1 = '1fr', row2 = '1fr' }: ViewGridRows, colSplit: boolean): string {
  const gutterSize = '3px';
  if (colSplit) {
    return `${row1} ${gutterSize} ${row2}`;
  }

  return '1fr';
}

export function validateViewJSONAgainstSchema(json: any) {
  try {
    const ajv = new Ajv();
    const validate = ajv.compile(jsonSchema);
    const valid = validate(json);
    const errors = valid ? [] : validate.errors;
    return { errors, valid };
  } catch (e) {
    const { message } = e as Error;
    return { errors: [message], valid: false };
  }
}

export function downloadView(view: View) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(view.definition, null, 2)], { type: 'application/json' }));
  a.download = view.name;
  a.click();
}
