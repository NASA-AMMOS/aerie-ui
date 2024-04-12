import { writable, type Writable } from 'svelte/store';
<<<<<<< HEAD
import {
  type CommandDictionary,
  type ParameterDictionary,
  type Parcel,
  type SequenceAdaptation,
  type UserSequence,
} from '../types/sequencing';
=======
import { type CommandDictionary, type SequenceAdaptation, type UserSequence } from '../types/sequencing';
>>>>>>> 5a030ccd (Moved sequence adaptation uploading to the command dictionary page, started adding support for uploading parameter and channel dictionaries)
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Subscriptions. */

export const commandDictionaries = gqlSubscribable<CommandDictionary[]>(gql.SUB_COMMAND_DICTIONARIES, {}, [], null);

<<<<<<< HEAD
export const parameterDictionaries = gqlSubscribable<ParameterDictionary[]>(
  gql.SUB_PARAMETER_DICTIONARIES,
  {},
  [],
  null,
);

export const parcels = gqlSubscribable<Parcel[]>(gql.SUB_PARCELS, {}, [], null);

export const sequenceAdaptations = gqlSubscribable<SequenceAdaptation[]>(gql.SUB_SEQUENCE_ADAPTATIONS, {}, [], null);

export const userParcelColumns: Writable<string> = writable('2fr 3px 1fr');

=======
export const sequenceAdaptations = gqlSubscribable<SequenceAdaptation[]>(gql.SUB_SEQUENCE_ADAPTATIONS, {}, [], null);

>>>>>>> 5a030ccd (Moved sequence adaptation uploading to the command dictionary page, started adding support for uploading parameter and channel dictionaries)
export const userSequences = gqlSubscribable<UserSequence[]>(gql.SUB_USER_SEQUENCES, {}, [], null);

/* Writeable. */

export const userSequencesColumns: Writable<string> = writable('1.5fr 3px 1fr');

export const userSequenceFormColumns: Writable<string> = writable('1fr 3px 2fr');

export const userSequencesRows: Writable<string> = writable('1fr 3px 1fr');

export const userSequenceEditorColumns: Writable<string> = writable('3fr 3px');

export const userSequenceEditorColumnsWithFormBuilder: Writable<string> = writable('3fr 3px 1fr');
