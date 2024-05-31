import type { ExternalEvent, ExternalEventInsertInput } from '../types/external-event';

// TODO: CONVERT STUFF IN THE'CREATE_EXTERNAL_SOURCE' EFFECT TO TERMS OF THIS.

// This is the type that conforms with the database schema.
export type ExternalSource = {
  end_time: string;
  external_events: ExternalEvent[];
  file_id: number;
  id: number;
  key: string;
  metadata: Record<string, any>;
  source_type: string;
  start_time: string;
  valid_at: string;
  // Things to consider:
  // associated file?
  // owner?
  // created_at?
};

export type ExternalSourceSlim = Pick<
  ExternalSource,
  'id' | 'file_id' | 'key' | 'source_type' | 'start_time' | 'end_time' | 'valid_at'
>;

export type PlanExternalSource = {
  external_source_id: number;
  plan_id: number | undefined; // because in plan.ts plan is defined on Plan | null...
};

// This is the JSON type that the user can upload.
export type ExternalSourceJson = {
  events: ExternalEvent[];
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

// This is used for the GraphQL mutation.
export type ExternalSourceInsertInput = Pick<
  ExternalSource,
  'key' | 'source_type' | 'metadata' | 'file_id' | 'start_time' | 'end_time' | 'valid_at'
> & {
  external_events: {
    data: ExternalEventInsertInput[];
  };
};
