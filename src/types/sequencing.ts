import type { UserId } from './app';

export enum DictionaryTypes {
  'channel_dictionary',
  'command_dictionary',
  'parameter_dictionary',
  'sequence_adaptation',
}

export type CommandDictionary = {
  command_types_typescript_path: string;
  type: DictionaryTypes.command_dictionary;
} & DictionaryType;

export type ChannelDictionary = {
  type: DictionaryTypes.channel_dictionary;
} & DictionaryType;

export type ParameterDictionary = {
  type: DictionaryTypes.parameter_dictionary;
} & DictionaryType;

export type SequenceAdaptation = {
  adaptation: string;
  created_at: string;
  type: DictionaryTypes.sequence_adaptation;
} & DictionaryType;

export type DictionaryType = {
  created_at: string;
  id: number;
  mission: string;
  type: DictionaryTypes;
  version: string;
};

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
