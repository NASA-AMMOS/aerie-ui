import type { ExternalSourceDB } from './external-source';

export type ExternalEventId = number;

// This is the type that conforms with the database schema.
export type ExternalEventDB = {
  duration: string;
  event_type_id: number;
  id: number;
  key: string;
  properties: Record<string, any>;
  source?: ExternalSourceDB;
  source_id?: number;
  start_time: string;
};

// This is the JSON type that the user can upload.
export type ExternalEventJson = {
  duration: string;
  event_type: string;
  id: number;
  key: string;
  properties: Record<string, any>;
  start_time: string;
};

// no analogue to ExternalSourceSlim as we have no subevents or anything of the sort that we may elect to exclude

export type ExternalEventWithTypeName = Omit<ExternalEventDB, 'event_type_id'> & {
  event_type: string | undefined;
};

export type ExternalEvent = Pick<
  ExternalEventWithTypeName,
  'duration' | 'id' | 'key' | 'properties' | 'source' | 'source_id' | 'start_time' | 'event_type'
> & {
  durationMs: number;
  startMs: number;
};

// no analgoue to PlanExternalSource as such a link doesn't exist for external events

// no analgoue to ExternalSourceEventTypes as external events don't have children with named types

export type ExternalEventType = {
  id: number;
  name: string;
};

// This is used for the GraphQL mutation.
// this doesn't do any actual filtering. extra keys in surplus of this are NOT checked.
// Typescript doesn't really allow us to check these, so ensuring we don't push additional and unnecessary data to the DB should be caught
// https://stackoverflow.com/questions/64263271/typescript-validate-excess-keys-on-value-returned-from-function
export type ExternalEventInsertInput = Pick<
  ExternalEventDB,
  'key' | 'event_type_id' | 'start_time' | 'duration' | 'properties'
>;

export type ExternalEventTypeInsertInput = Pick<ExternalEventType, 'name'>;
