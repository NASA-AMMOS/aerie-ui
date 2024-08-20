import type { ExternalSourceDB } from './external-source';

// Represents all fields used as a composite primary key for merlin.external_event
export type ExternalEventPkey = {
  key: string,
  source_key: string,
  derivation_group_name: string,
  event_type_name: string
}

// This is the type that conforms with the database schema.
export type ExternalEventDB = {
  duration: string;
  pkey: ExternalEventPkey;
  properties: Record<string, any>;
  source?: ExternalSourceDB;
  start_time: string;
};

// This is the JSON type that the user can upload.
export type ExternalEventJson = {
  duration: string;
  event_type: string;
  key: string;
  properties: Record<string, any>;
  start_time: string;
};

// no analogue to ExternalSourceSlim as we have no subevents or anything of the sort that we may elect to exclude

export type ExternalEvent = Pick<
  ExternalEventDB,
  'pkey' | 'duration' | 'properties' | 'source' | 'start_time'
> & {
  duration_ms: number;
  start_ms: number;
};

// no analgoue to PlanExternalSource as such a link doesn't exist for external events

export type ExternalEventType = {
  name: string;
};

// This is used for the GraphQL mutation.
// this doesn't do any actual filtering. extra keys in surplus of this are NOT checked.
// Typescript doesn't really allow us to check these, so ensuring we don't push additional and unnecessary data to the DB should be caught
// https://stackoverflow.com/questions/64263271/typescript-validate-excess-keys-on-value-returned-from-function
export type ExternalEventInsertInput = Pick<
  ExternalEventDB,
  'pkey' | 'start_time' | 'duration' | 'properties'
>;

export type ExternalEventTypeInsertInput = Pick<ExternalEventType, 'name'>;
