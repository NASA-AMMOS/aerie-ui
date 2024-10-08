import type { ExternalEventDB, ExternalEventInsertInput, ExternalEventJson } from '../types/external-event';

// Represents all fields used as a composite primary key for merlin.external_source
export type ExternalSourcePkey = {
  derivation_group_name: string;
  key: string;
};

// This is the type that conforms with the database schema. We don't really use it, as it is pretty heavyweight - instead we derive lighter types from it.
export type ExternalSourceDB = {
  created_at: string;
  derivation_group_name: string;
  end_time: string;
  external_events: ExternalEventDB[];
  key: string;
  metadata: Record<string, any>;
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
export type ExternalSourceSlim = Omit<ExternalSourceDB, 'external_events' | 'metadata'>;

// Similar to ExternalSourceDB, but uses ExternalSourcePkey to represent the primary key (key, derivation_group_name)
export type ExternalSource = Omit<ExternalSourceDB, 'key' | 'derivation_group_name'> & { pkey: ExternalSourcePkey };

export type PlanDerivationGroup = {
  derivation_group_name: string;
  enabled: boolean;
  plan_id: number | undefined; // because in plan.ts plan is defined on Plan | null...
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

export type ExternalSourceTypeInsertInput = Pick<ExternalSourceType, 'name'>;

export type DerivationGroupInsertInput = Pick<DerivationGroup, 'name' | 'source_type_name'>;

// Used to track whether a newly added source has been acknowledged or not for a given plan
export type DerivationGroupUpdateAckEntry = {derivation_group: string, last_acknowledged_at: string};
