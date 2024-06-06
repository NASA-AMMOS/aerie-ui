import type { ExternalSource } from './external-source';

export type ExternalEventId = number;

export type ExternalEventDB = {
  duration: string;
  event_type: string;
  id: number;
  key: string;
  properties: Record<string, any>;
  source?: ExternalSource;
  source_id: number;
  start_time: string;
};

export type ExternalEvent = ExternalEventDB & {
  durationMs: number;
  startMs: number;
};

// this doesn't do any actual filtering. extra keys in surplus of this are NOT checked.
export type ExternalEventInsertInput = Pick<ExternalEventDB, 'key' | 'event_type' | 'start_time' | 'duration' | 'properties'>;