import type { ExternalSourceDB } from './external-source';

export type ExternalEventId = number;

export type ExternalEventDB = {
  duration: string;
  event_type_id: number;
  id: number;
  key: string;
  properties: Record<string, any>;
  source?: ExternalSourceDB;
  source_id: number;
  start_time: string;
};

export type ExternalEvent = ExternalEventDB & {
  durationMs: number;
  startMs: number;
};

export type ExternalEventWithTypeName = ExternalEvent & {
  event_type: string | undefined;
};

export type ExternalEventType = {
  id: number;
  name: string;
}

// this doesn't do any actual filtering. extra keys in surplus of this are NOT checked.
export type ExternalEventInsertInput = Pick<ExternalEventDB, 'key' | 'event_type_id' | 'start_time' | 'duration' | 'properties'>;