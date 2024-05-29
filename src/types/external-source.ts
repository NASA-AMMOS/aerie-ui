import type { ExternalEvent } from '../types/external-event';
// TODO: CONVERT STUFF IN THE'CREATE_EXTERNAL_SOURCE' EFFECT TO TERMS OF THIS.

export type ExternalSource = ExternalSourceSchema;

export type ExternalSourceInsertInput = Pick<
  ExternalSource,
  'file_id' | 'key' | 'source_type' | 'start_time' | 'end_time' | 'valid_at' | 'external_events'
>;
// export type ModelSetInput = Pick<ExternalSource, 'description' | 'mission' | 'name' | 'owner' | 'version'>;

export type ExternalSourceSchema = {
  end_time: string;
  external_events: ExternalEvent[];
  file_id: number;
  id: number;
  key: string;
  metadata: object;
  source_type: string;
  start_time: string;
  valid_at: string;
  // uploaded_file??? not there in mission
};

export type ExternalSourceSlim = Pick<
  ExternalSource, // TODO: add owner, eventually
  'id' | 'file_id' | 'key' | 'source_type' | 'start_time' | 'end_time' | 'valid_at' // whatever we want to show up on the external_sources page. may include external_events too, but the original schema may get more stuff that we don't want here, so we split things out
>;
