import type { ExternalSource } from './external-source';

export type ExternalEvent = {
  duration: string;
  event_type: string;
  id: number;
  key: string;
  properties: Record<string, any>;
  source?: ExternalSource;
  source_id: number;
  start_time: string;
};

// this doesn't do any actual filtering. extra keys in surplus of this are NOT checked.
export type ExternalEventInsertInput = Pick<ExternalEvent, 'key' | 'event_type' | 'start_time' | 'duration' | 'properties'>;
