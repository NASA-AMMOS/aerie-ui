import { type ChannelDictionary, type FswCommandArgument, type ParameterDictionary } from '@nasa-jpl/aerie-ampcs';
import type { SeqJson } from '@nasa-jpl/seq-json-schema/types';
import { get } from 'svelte/store';
import { sequenceAdaptation } from '../../stores/sequencing';

// TODO: serialization
// replace parameter names with hex ids
// replace enum parameter values with the numeric value

//

export type ArgDelegator = {
  [stem: string]: {
    [arg: string]:
      | undefined
      | ((
          argDef: FswCommandArgument,
          paramDictionaries: ParameterDictionary[],
          channelDictionary: ChannelDictionary | null,
          precedingArgValues: string[],
        ) => FswCommandArgument | undefined);
  };
};

export function getCustomArgDef(
  stem: string,
  dictArg: FswCommandArgument,
  precedingArgs: string[],
  parameterDictionaries: ParameterDictionary[],
  channelDictionary: ChannelDictionary | null,
) {
  let delegate = undefined;

  if (get(sequenceAdaptation)?.argDelegator !== undefined) {
    delegate = globalThis.ARG_DELEGATOR?.[stem]?.[dictArg.name];
  }

  return delegate?.(dictArg, parameterDictionaries, channelDictionary, precedingArgs) ?? dictArg;
}

export function toOutputFormat(
  seqJson: SeqJson,
  parameterDictionaries: ParameterDictionary[],
  channelDictionary: ChannelDictionary | null,
) {
  const seqAdaptationToOutputFormat = get(sequenceAdaptation)?.toOutputFormat;

  if (seqAdaptationToOutputFormat !== undefined) {
    return seqAdaptationToOutputFormat(seqJson, parameterDictionaries, channelDictionary);
  }

  return seqJson;
}

export function fromOutputFormat(
  seqJson: SeqJson,
  parameterDictionaries: ParameterDictionary[],
  channelDictionary: ChannelDictionary | null,
) {
  const seqAdaptationToOutputFormat = get(sequenceAdaptation)?.fromOutputFormat;

  if (seqAdaptationToOutputFormat !== undefined) {
    return seqAdaptationToOutputFormat(seqJson, parameterDictionaries, channelDictionary);
  }

  return seqJson;
}
