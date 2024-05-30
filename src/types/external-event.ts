import type { ExternalSource } from './external-source';

export type ExternalEvent = {
  duration: string;
  id: number;
  key: string;
  properties: Record<string, any>;
  source?: ExternalSource;
  source_id: number;
  start_time: string;
};

export type ExternalEventInsertInput = Pick<ExternalEvent, 'key' | 'start_time' | 'duration' | 'properties'>;
