import type { UserId } from './app';

export enum DictionaryHeaders {
  'command_dictionary' = 'command_dictionary',
  'param_def' = 'param-def',
  'sequence_adaptation' = 'sequence_adaptation',
  'telemetry_dictionary' = 'telemetry_dictionary',
}

export enum DictionaryTypes {
  'CHANNEL' = 'CHANNEL',
  'COMMAND' = 'COMMAND',
  'PARAMETER' = 'PARAMETER',
  'ADAPTATION' = 'ADAPTATION',
}

export type ChannelDictionary = {
  type: DictionaryTypes.CHANNEL;
} & DictionaryType;

export type CommandDictionary = {
  type: DictionaryTypes.COMMAND;
} & DictionaryType;

export type ParameterDictionary = {
  type: DictionaryTypes.PARAMETER;
} & DictionaryType;

export type SequenceAdaptation = {
  adaptation: string;
  type: DictionaryTypes.ADAPTATION;
} & DictionaryType;

export type DictionaryType = {
  created_at: string;
  id: number;
  mission: string;
  path: string;
  updated_at: string;
  version: string;
};

export type Parcel = {
  channel_dictionary_id: number | null;
  command_dictionary_id: number;
  created_at: string;
  id: number;
  name: string;
  owner: UserId;
  sequence_adaptation_id: number | null;
  updated_at: string;
};

export type ParcelBundle = {
  channel_dictionary_id: number | null;
  command_dictionary_id: number | undefined;
  created_at: string;
  id: number;
  name: string;
  owner: UserId;
  parameter_dictionary_ids: number[];
  sequence_adaptation_id: number | null;
};

export type ParcelToParameterDictionary = {
  id: number;
  parameter_dictionary_id: number;
  parcel_id: number;
};

export type ParcelInsertInput = Omit<Parcel, 'created_at' | 'id' | 'owner' | 'updated_at'>;

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
  created_at: string;
  definition: string;
  id: number;
  name: string;
  owner: UserId;
  parcel_id: number;
  seq_json: SeqJson;
  updated_at: string;
};

export type UserSequenceInsertInput = Omit<UserSequence, 'created_at' | 'id' | 'owner' | 'updated_at'>;
