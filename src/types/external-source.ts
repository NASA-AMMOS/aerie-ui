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
export type ExternalSourceInsertInput = {
  end_time: string;
  external_events: {
    data: ExternalEventInsertInput[];
  };
  file_id: number;
  key: string;
  metadata: Record<string, any>;
  source_type: string;
  start_time: string;
  valid_at: string;
};
