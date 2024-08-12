import { derived, get, writable, type Writable } from 'svelte/store';
import type { GlobalType } from '../types/global-type';
import type { ISequenceAdaptation, SequenceAdaptation } from '../types/sequencing';
import gql from '../utilities/gql';
import { seqJsonToSequence } from '../utilities/sequence-editor/from-seq-json';
import { sequenceToSeqJson } from '../utilities/sequence-editor/to-seq-json';
import { gqlSubscribable } from './subscribable';

/* Writeable */

export const sequenceAdaptation: Writable<ISequenceAdaptation | undefined> = writable(undefined);

/* Subscriptions. */

export const sequenceAdaptations = gqlSubscribable<SequenceAdaptation[]>(gql.SUB_SEQUENCE_ADAPTATIONS, {}, [], null);

/* Derived */

export const inputFormat = derived([sequenceAdaptation], ([$sequenceAdaptation]) => $sequenceAdaptation?.inputFormat);

export const outputFormat = derived(
  [sequenceAdaptation],
  ([$sequenceAdaptation]) => $sequenceAdaptation?.outputFormat ?? [],
);

/* Helpers */

export function getGlobals(): GlobalType[] {
  return get(sequenceAdaptation)?.globals ?? [];
}

export function setSequenceAdaptation(): void {
  sequenceAdaptation.set({
    argDelegator: globalThis.SequenceAdaptation?.argDelegator ?? undefined,
    conditionalKeywords: {
      else: globalThis.SequenceAdaptation?.conditionalKeywords?.else ?? 'CMD_ELSE',
      elseIf: globalThis.SequenceAdaptation?.conditionalKeywords?.elseIf ?? ['CMD_ELSE_IF'],
      endIf: globalThis.SequenceAdaptation?.conditionalKeywords?.endIf ?? 'CMD_END_IF',
      if: globalThis.SequenceAdaptation?.conditionalKeywords?.if ?? ['CMD_IF'],
    },
    globals: globalThis.SequenceAdaptation?.globals ?? [],
    inputFormat: {
      linter: globalThis.SequenceAdaptation?.inputFormat?.linter ?? undefined,
      name: globalThis.SequenceAdaptation?.inputFormat?.name ?? 'SeqN',
      toInputFormat: globalThis.SequenceAdaptation?.inputFormat?.toInputFormat ?? seqJsonToSequence,
    },
    loopKeywords: {
      break: globalThis.SequenceAdaptation?.loopKeywords?.break ?? 'CMD_BREAK',
      continue: globalThis.SequenceAdaptation?.loopKeywords?.continue ?? 'CMD_CONTINUE',
      endWhileLoop: globalThis.SequenceAdaptation?.loopKeywords?.endWhileLoop ?? 'CMD_END_WHILE_LOOP',
      whileLoop: globalThis.SequenceAdaptation?.loopKeywords?.whileLoop ?? ['CMD_WHILE_LOOP', 'CMD_WHILE_LOOP_OR'],
    },
    modifyOutput: globalThis.SequenceAdaptation?.modifyOutput ?? undefined,
    modifyOutputParse: globalThis.SequenceAdaptation?.modifyOutputParse ?? undefined,
    outputFormat: globalThis.SequenceAdaptation?.outputFormat ?? [
      {
        fileExtension: 'json',
        name: 'Seq JSON',
        toOutputFormat: sequenceToSeqJson,
      },
    ],
  });
}
