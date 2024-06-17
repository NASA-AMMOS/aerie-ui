import type { ExternalEventDB, ExternalEventInsertInput, ExternalEventJson } from '../types/external-event';

// TODO: CONVERT STUFF IN THE'CREATE_EXTERNAL_SOURCE' EFFECT TO TERMS OF THIS.

// no analogue to ExternalEventId as that is only necessary in plan view where information on the selected event is shared across several sibling panels (see stores)

// This is the type that conforms with the database schema.
export type ExternalSourceDB = {
  end_time: string;
  external_events: ExternalEventDB[];
  file_id: number;
  id: number;
  key: string;
  metadata: Record<string, any>;
  source_type_id: number;
  start_time: string;
  valid_at: string;
  // Things to consider:
  // associated file?
  // owner?
  // created_at?
};

// This is the JSON type that the user can upload.
export type ExternalSourceJson = {
  events: ExternalEventJson[];
  source: {
    key: string;
    metadata: object;
    period: {
      end_time: string;
      start_time: string;
    };
    source_type: string;
    valid_at: string;
  };
};

// For use in retrieval of source information sans bulky items like metadata and event lists (see stores)
export type ExternalSourceSlim = Pick<
  ExternalSourceDB,
  'id' | 'file_id' | 'key' | 'source_type_id' | 'start_time' | 'end_time' | 'valid_at'
>;

// For use in ExternalSourceManager tables
export type ExternalSourceWithTypeName = Omit<ExternalSourceSlim, 'source_type_id'> & {
  source_type: string | undefined
};

// no analogue (yet) to ExternalEvent because no special durationMs or startMs to draw on a timeline
// TODO: add External Source span to timeline in External Source Manager, so if zooming out on timeline
//        can see where external source spans relative to overall timeline?

export type PlanExternalSource = {
  external_source_id: number;
  plan_id: number | undefined; // because in plan.ts plan is defined on Plan | null...
};

export type ExternalSourceType = {
  id: number;
  name: string;
};

export type ExternalSourceEventType = { // to specify what types are contained in each source. TODO
  external_source_id: number,
  event_type_id: number
}

// This is used for the GraphQL mutation.
export type ExternalSourceInsertInput = Pick<
  ExternalSourceDB,
  'key' | 'metadata' | 'source_type_id' | 'file_id' | 'start_time' | 'end_time' | 'valid_at'
> & {
  external_events: {
    data: ExternalEventInsertInput[] | null;
  };
};

export type ExternalSourceTypeInsertInput = Pick<
  ExternalSourceType,
  'name'
>;