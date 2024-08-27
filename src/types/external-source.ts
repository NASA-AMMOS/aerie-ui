import type { ExternalEventDB, ExternalEventInsertInput, ExternalEventJson } from '../types/external-event';

// Represents all fields used as a composite primary key for merlin.external_source
export type ExternalSourcePkey = {
  derivation_group_name: string;
  key: string;
};

// This is the type that conforms with the database schema. We don't really use it, as it is pretty heavyweight - instead we derive lighter types from it.
export type ExternalSourceDB = {
  created_at: string;
  end_time: string;
  external_events: ExternalEventDB[];
  metadata: Record<string, any>;
  pkey: ExternalSourcePkey;
  source_type_name: string;
  start_time: string;
  valid_at: string;
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
  'pkey' | 'source_type_name' | 'start_time' | 'end_time' | 'valid_at' | 'created_at'
>;

// no analogue (yet) to ExternalEvent because no special duration_ms or start_ms to draw on a timeline

export type PlanDerivationGroup = {
  derivation_group_name: string;
  plan_id: number | undefined; // because in plan.ts plan is defined on Plan | null...
  enabled: boolean;
};

export type ExternalSourceType = {
  name: string;
};

export type DerivationGroup = {
  derived_event_total: number;
  event_types: string[];
  name: string;
  source_type_name: string;
  sources: Map<string, { event_counts: number }>;
};

// used exclusively in ExternalSourcesPanel and UpdateCard, to help track 'deleted_at' information. If in the future we have a comprehensive history of all sources' metadata ever, we will use this there too
export type ExternalSourceWithDateInfo = ExternalSourceSlim & { change_date: Date };

// This is used for the GraphQL mutation.
export type ExternalSourceInsertInput = Pick<
  ExternalSourceDB,
  'source_type_name' | 'metadata' | 'start_time' | 'end_time' | 'valid_at'
> &
  Pick<ExternalSourcePkey, 'key' | 'derivation_group_name'> & {
    external_events: {
      data: ExternalEventInsertInput[] | null;
    };
  };

// This is used exclusively to track when users have and haven't seen an entry
export type UserSeenEntry = {
  derivation_group_name: string;
  key: string;
  source_type_name: string;
};

export type ExternalSourceTypeInsertInput = Pick<ExternalSourceType, 'name'>;

export type DerivationGroupInsertInput = Pick<DerivationGroup, 'name' | 'source_type_name'>;
