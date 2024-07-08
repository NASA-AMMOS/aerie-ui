import type {
  ChannelDictionary as AmpcsChannelDictionary,
  CommandDictionary as AmpcsCommandDictionary,
  ParameterDictionary as AmpcsParameterDictionary,
} from '@nasa-jpl/aerie-ampcs';
import type { DictionaryTypes } from '../enums/dictionaryTypes';
import type { ArgDelegator } from '../utilities/new-sequence-editor/extension-points';
import type { UserId } from './app';
import type { GlobalType } from './global-type';

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
  name: string;
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

export interface SequenceAdaptationI {
  argDelegator?: ArgDelegator;
  conditionalKeywords: { else: string; elseIf: string[]; endIf: string; if: string[] };
  fromOutputFormat?: (
    output: SeqJson | any,
    parameterDictionaries: AmpcsParameterDictionary[],
    channelDictionary: AmpcsChannelDictionary | null,
  ) => any;
  globals?: GlobalType[];
  inputFormat: { name: string };
  lint?: (commandDictionary: AmpcsCommandDictionary, view: any, node: any) => any;
  loopKeywords: { break: string; continue: string; endWhileLoop: string; whileLoop: string[] };
  outputFormat: { name: string };
  toOutputFormat?: (
    output: SeqJson | any,
    parameterDictionaries: AmpcsParameterDictionary[],
    channelDictionary: AmpcsChannelDictionary | null,
  ) => any;
}

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
  command_dictionary_id: number | undefined;
} & Omit<Parcel, 'command_dictionary_id' | 'updated_at'>;

export type ParcelToParameterDictionary = {
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
