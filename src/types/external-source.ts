import type { ExternalEventDB, ExternalEventInsertInput, ExternalEventJson } from '../types/external-event';

// no analogue to ExternalEventId as that is only necessary in plan view where information on the selected event is shared across several sibling panels (see stores)

// This is the type that conforms with the database schema. We don't really use it, as it is pretty heavyweight - instead we derive lighter types from it.
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
  derivation_group_id: number;
  // Things to consider:
  // associated file?
  // owner?
  created_at: string;
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
  'id' | 'file_id' | 'key' | 'source_type_id' | 'start_time' | 'end_time' | 'valid_at' | 'derivation_group_id' | 'created_at'
>;

// For use in ExternalSourceManager tables
export type ExternalSourceWithResolvedNames = ExternalSourceSlim & {
  source_type: string | undefined;
  derivation_group: string | undefined;

  // for coloring
  total_groups: number; 
};

// no analogue (yet) to ExternalEvent because no special durationMs or startMs to draw on a timeline
// TODO: add External Source span to timeline in External Source Manager, so if zooming out on timeline
//        can see where external source spans relative to overall timeline?

export type PlanDerivationGroup = {
  derivation_group_id: number;
  plan_id: number | undefined; // because in plan.ts plan is defined on Plan | null...
};

export type ExternalSourceType = {
  id: number;
  name: string;
};

export type DerivationGroup = {
  id: number;
  source_type_id: number;
  name: string;
  sources: Map<string, {event_counts: number}>;
}

export type ExternalSourceEventType = { // to specify what types are contained in each source.
  external_source_id: number,
  external_event_type_id: number
}

// This is used for the GraphQL mutation.
export type ExternalSourceInsertInput = Pick<
  ExternalSourceDB,
  'key' | 'metadata' | 'source_type_id' | 'file_id' | 'start_time' | 'end_time' | 'valid_at' | 'derivation_group_id'
> & {
  external_events: {
    data: ExternalEventInsertInput[] | null;
  };
};

export type ExternalSourceTypeInsertInput = Pick<
  ExternalSourceType,
  'name'
>;

export type DerivationGroupInsertInput = Pick<
  DerivationGroup,
  'name' | 'source_type_id'
>;
