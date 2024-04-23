import { derived, writable, type Readable, type Writable } from 'svelte/store';
import {
  type CommandDictionary,
  type ParameterDictionary,
  type Parcel,
  type ParcelToParameterDictionary,
  type SequenceAdaptation,
  type UserSequence,
} from '../types/sequencing';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Writable */

export const parcel: Writable<Parcel | null> = writable(null);

/* Derived */

export const parcelId: Readable<number> = derived(parcel, $parcel => ($parcel ? $parcel.id : -1));

/* Subscriptions. */

export const commandDictionaries = gqlSubscribable<CommandDictionary[]>(gql.SUB_COMMAND_DICTIONARIES, {}, [], null);

export const parameterDictionaries = gqlSubscribable<ParameterDictionary[]>(
  gql.SUB_PARAMETER_DICTIONARIES,
  {},
  [],
  null,
);

export const parcelToParameterDictionaries = gqlSubscribable<ParcelToParameterDictionary[]>(
  gql.SUB_PARCEL_TO_PARAMETER_DICTIONARIES,
  { parcelId },
  [],
  null,
);

export const parcels = gqlSubscribable<Parcel[]>(gql.SUB_PARCELS, {}, [], null);

export const sequenceAdaptations = gqlSubscribable<SequenceAdaptation[]>(gql.SUB_SEQUENCE_ADAPTATIONS, {}, [], null);

export const userParcelColumns: Writable<string> = writable('2fr 3px 1fr');

export const userSequences = gqlSubscribable<UserSequence[]>(gql.SUB_USER_SEQUENCES, {}, [], null);

/* Writeable. */

export const userSequencesColumns: Writable<string> = writable('1.5fr 3px 1fr');

export const userSequenceFormColumns: Writable<string> = writable('1fr 3px 2fr');

export const userSequencesRows: Writable<string> = writable('1fr 3px 1fr');

export const userSequenceEditorColumns: Writable<string> = writable('3fr 3px');

export const userSequenceEditorColumnsWithFormBuilder: Writable<string> = writable('3fr 3px 1fr');
