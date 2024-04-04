import type {
  Args,
  BooleanArgument,
  HexArgument,
  NumberArgument,
  SeqJson,
  StringArgument,
  SymbolArgument,
  Time,
} from '@nasa-jpl/seq-json-schema/types';
import { isArray } from 'lodash-es';
import { logError } from './logger';

/**
 * Transform a sequence JSON time to it's sequence string form.
 */
export function seqJsonTimeToSequence(time: Time): string {
  if (time.type === 'ABSOLUTE') {
    return `abs(${time?.tag ?? ''})`;
  } else if (time.type === 'COMMAND_COMPLETE') {
    return 'cpl';
  } else if (time.type === 'COMMAND_RELATIVE') {
    return `rel(${time?.tag ?? ''})`;
  } else if (time.type === 'EPOCH_RELATIVE') {
    return `epc(${time?.tag ?? ''})`;
  }
  return '';
}

/**
 * Transform a base argument (non-repeat) into a string.
 */
export function seqJsonBaseArgToSequence(
  arg: StringArgument | NumberArgument | BooleanArgument | SymbolArgument | HexArgument,
): string {
  if (arg.type === 'string') {
    // Make sure strings are surrounded in quotes.
    return `"${arg.value}"`;
  } else {
    // All other "base" types just return the raw value.
    return `${arg.value}`;
  }
}

/**
 * Transforms sequence JSON arguments to a string.
 */
export function seqJsonArgsToSequence(args: Args): string {
  let argsStr = '';

  if (args.length) {
    argsStr += '(';

    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];

      if (arg.type === 'repeat') {
        if (isArray(arg.value) && arg.value.length) {
          argsStr += '[';

          for (let j = 0; j < arg.value.length; ++j) {
            const repeatArgSet = arg.value[j];

            if (isArray(repeatArgSet) && repeatArgSet.length) {
              argsStr += '[';

              for (let k = 0; k < repeatArgSet.length; ++k) {
                const repeatArg = repeatArgSet[k];
                argsStr += seqJsonBaseArgToSequence(repeatArg);

                if (k !== repeatArgSet.length - 1) {
                  argsStr += ', ';
                }
              }

              argsStr += ']';
            } else {
              logError('Repeat arg set value is not an array');
            }

            if (j !== arg.value.length - 1) {
              argsStr += ', ';
            }
          }

          argsStr += ']';
        } else {
          logError('Repeat arg value is not an array');
        }
      } else {
        argsStr += seqJsonBaseArgToSequence(arg);
      }

      if (i !== args.length - 1) {
        argsStr += ', ';
      }
    }

    argsStr += ')';
  }

  return argsStr;
}

/**
 * Transforms a sequence JSON to a sequence string.
 */
export function seqJsonToSequence(seqJson: SeqJson | null): string {
  const sequence: string[] = [];

  if (seqJson) {
    sequence.push(`id("${seqJson.id}")`);

    if (seqJson.steps) {
      sequence.push('\n\n');

      for (const step of seqJson.steps) {
        if (step.type === 'command') {
          const time = seqJsonTimeToSequence(step.time);
          const args = seqJsonArgsToSequence(step.args);
          sequence.push(`${time} ${step.stem}${args}\n`);
        }
      }
    }
  }

  return sequence.join('');
}

/**
 * Return a parsed sequence JSON from a file.
 */
export async function parseSeqJsonFromFile(files: FileList | null | undefined): Promise<SeqJson | null> {
  if (files) {
    const file = files.item(0);

    if (file) {
      try {
        const fileText = await file.text();
        const commandDictionary = JSON.parse(fileText);
        return commandDictionary;
      } catch (e) {
        const errorMessage = (e as Error).message;
        logError(errorMessage);
        return null;
      }
    } else {
      logError('No file provided');
      return null;
    }
  } else {
    logError('No file provided');
    return null;
  }
}
