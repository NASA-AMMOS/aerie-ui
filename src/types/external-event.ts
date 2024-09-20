import type { ExternalSourceDB } from './external-source';

// Represents all fields used as a composite primary key for merlin.external_event
export type ExternalEventPkey = {
  derivation_group_name: string;
  event_type_name: string;
  key: string;
  source_key: string;
};

// A condensed format of the above type as a single string, for use in indexing in tables and in the timeline (see LayerDiscrete);
//    the equivalent of the number id used in selectedActivityDirectiveId (ActivityDirectiveId), but for EEs.
// We must use a string for ExternalEventId instead of directly using the composite ExternalEventPkey type. This is because there 
//    are some places, such as LayerDiscrete, where we need to use this ID type in a record (i.e. IdToColorMap). Records admit 
//    keys of type string | number | symbol, so an ExternalEventPkey would not work. Thus we require a simpler type; a string
//    is clearly our best candidate. See this string of comments for more detail: 
//      https://github.com/NASA-AMMOS/aerie-ui/pull/1396#discussion_r1746175203
export type ExternalEventId = string;

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

export type ExternalEvent = Pick<ExternalEventDB, 'duration' | 'pkey' | 'properties' | 'source' | 'start_time'> & {
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
export type ExternalEventInsertInput = Pick<ExternalEventDB, 'start_time' | 'duration' | 'properties'> &
  Pick<ExternalEventPkey, 'event_type_name' | 'key'>;

export type ExternalEventTypeInsertInput = Pick<ExternalEventType, 'name'>;
