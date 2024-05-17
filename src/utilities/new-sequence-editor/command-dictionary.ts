import {
  parse,
  type CommandDictionary,
  type EnumMap,
  type FswCommandArgument,
  type FswCommandArgumentBoolean,
  type FswCommandArgumentEnum,
  type FswCommandArgumentFloat,
  type FswCommandArgumentInteger,
  type FswCommandArgumentNumeric,
  type FswCommandArgumentRepeat,
  type FswCommandArgumentUnsigned,
  type FswCommandArgumentVarString,
} from '@nasa-jpl/aerie-ampcs';
import { logError } from './logger';

/**
 * Return a default argument for a given argument definition.
 */
export function fswCommandArgDefault(fswCommandArg: FswCommandArgument, enumMap: EnumMap): string {
  const { arg_type } = fswCommandArg;

  if (arg_type === 'boolean') {
    const booleanArg = fswCommandArg as FswCommandArgumentBoolean;
    const { default_value } = booleanArg;

    if (default_value !== null) {
      return default_value.toLowerCase();
    } else {
      return 'false';
    }
  } else if (arg_type === 'enum') {
    const enumArg = fswCommandArg as FswCommandArgumentEnum;
    const enumSymbolValue = enumMap[enumArg.enum_name].values[0].symbol;

    if (enumSymbolValue && /\s+/.test(enumSymbolValue)) {
      // If the enum symbol has whitespace, return it in quotes so it does not mess everything up.
      return `"${enumSymbolValue}"`;
    } else {
      return enumSymbolValue ?? 'UNKNOWN_ENUM';
    }
  } else if (arg_type === 'fill') {
    return '""';
  } else if (arg_type === 'fixed_string') {
    return '""';
  } else if (arg_type === 'float') {
    const floatArg = fswCommandArg as FswCommandArgumentFloat;
    const { default_value, range } = floatArg;

    if (default_value !== null) {
      return `${default_value}`;
    } else if (range !== null) {
      const { min } = range;
      return `${min}`;
    } else {
      return '0.0';
    }
  } else if (arg_type === 'integer') {
    const intArg = fswCommandArg as FswCommandArgumentInteger;
    const { default_value, range } = intArg;

    if (default_value !== null) {
      return `${default_value}`;
    } else if (range !== null) {
      const { min } = range;
      return `${min}`;
    } else {
      return '0';
    }
  } else if (arg_type === 'numeric') {
    const numericArg = fswCommandArg as FswCommandArgumentNumeric;
    const { default_value, range } = numericArg;

    if (default_value !== null) {
      return `${default_value}`;
    } else if (range !== null) {
      const { min } = range;
      return `${min}`;
    } else {
      return '0.0';
    }
  } else if (arg_type === 'repeat') {
    const repeatArg = fswCommandArg as FswCommandArgumentRepeat;
    const { repeat } = repeatArg;

    let defaultRepeatArg = '[';
    let totalRepeatedArgs = 0;

    if (repeat) {
      const { min } = repeat;

      do {
        let repeatedArg = '[';

        for (let i = 0; i < repeat.arguments.length; ++i) {
          const arg = repeat.arguments[i];
          const argValue = fswCommandArgDefault(arg, enumMap);
          repeatedArg += `${argValue}`;

          if (i !== repeat.arguments.length - 1) {
            repeatedArg += ', ';
          }
        }

        repeatedArg += ']';
        defaultRepeatArg += repeatedArg;
        ++totalRepeatedArgs;

        // If we are going to add another repeated arg, make sure to add a comma.
        if (min !== null && totalRepeatedArgs < min) {
          defaultRepeatArg += ', ';
        }
      } while (min !== null && totalRepeatedArgs < min);
    }

    defaultRepeatArg += ']';

    return defaultRepeatArg;
  } else if (arg_type === 'time') {
    return '0';
  } else if (arg_type === 'unsigned') {
    const numericArg = fswCommandArg as FswCommandArgumentUnsigned;
    const { default_value, range } = numericArg;

    if (default_value !== null) {
      return `${default_value}`;
    } else if (range !== null) {
      const { min } = range;
      return `${min}`;
    } else {
      return '0';
    }
  } else if (arg_type === 'var_string') {
    const varStringArg = fswCommandArg as FswCommandArgumentVarString;
    const { default_value } = varStringArg;

    if (default_value !== null) {
      return default_value;
    } else {
      return '""';
    }
  } else {
    return '';
  }
}

/**
 * Return a parsed command dictionary from a file.
 */
export async function parseCommandDictionaryFromFile(
  files: FileList | null | undefined,
): Promise<CommandDictionary | null> {
  if (files) {
    const file = files.item(0);

    if (file) {
      try {
        const fileText = await file.text();
        const commandDictionary = parse(fileText);
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
