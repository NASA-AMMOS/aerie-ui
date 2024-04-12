import { writable, type Writable } from 'svelte/store';
import {
  type CommandDictionary,
  type ParameterDictionary,
  type SequenceAdaptation,
  type UserSequence,
} from '../types/sequencing';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Subscriptions. */

export const dictionaries = gqlSubscribable<(CommandDictionary | ParameterDictionary)[]>(
  gql.SUB_COMMAND_DICTIONARIES,
  {},
  [],
  null,
);

export const sequenceAdaptations = gqlSubscribable<SequenceAdaptation[]>(gql.SUB_SEQUENCE_ADAPTATIONS, {}, [], null);

export const userSequences = gqlSubscribable<UserSequence[]>(gql.SUB_USER_SEQUENCES, {}, [], null);

/* Writeable. */

export const userSequencesColumns: Writable<string> = writable('1.5fr 3px 1fr');

export const userSequenceFormColumns: Writable<string> = writable('1fr 3px 2fr');

export const userSequencesRows: Writable<string> = writable('1fr 3px 1fr');

export const userSequenceEditorColumns: Writable<string> = writable('3fr 3px 1fr');
