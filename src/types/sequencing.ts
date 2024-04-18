import type { UserId } from './app';

export enum DictionaryTypes {
  'command_dictionary' = 'command_dictionary',
  'param_def' = 'param-def',
  'sequence_adaptation' = 'sequence_adaptation',
  'telemetry_dictionary' = 'telemetry_dictionary',
}

export type CommandDictionary = DictionaryType;

export type ParameterDictionary = DictionaryType;

export type SequenceAdaptation = {
  adaptation: string;
} & DictionaryType;

export type DictionaryType = {
  created_at: string;
  id: number;
  mission: string;
  version: string;
};

export type Parcel = {
  command_dictionary_id: number;
  created_at: string;
  id: number;
  name: string;
  owner: UserId;
  sequence_adaptation_id?: number;
};

export type ParcelInsertInput = Omit<Parcel, 'created_at' | 'id' | 'owner' | 'sequence_adaptation_id'>;

export type GetSeqJsonResponseError = {
  location: {
    column: number;
    line: number;
  };
  message: string;
  stack: string;
};

export type GetSeqJsonResponse = {
  errors: GetSeqJsonResponseError[];
  seqJson: SeqJson;
  status: 'FAILURE' | 'SUCCESS';
};

export type SeqJson = any; // TODO: Strongly type.

export type UserSequence = {
  authoring_command_dict_id: number;
  created_at: string;
  definition: string;
  id: number;
  name: string;
  owner: UserId;
  updated_at: string;
};

export type UserSequenceInsertInput = Omit<UserSequence, 'created_at' | 'id' | 'owner' | 'updated_at'>;
