import type { SyntaxNode, Tree } from '@lezer/common';
import type { CommandDictionary, FswCommandArgument, FswCommandArgumentRepeat } from '@nasa-jpl/aerie-ampcs';
import type {
  Args,
  BooleanArgument,
  Command,
  HardwareCommand,
  HexArgument,
  ImmediateCommand,
  Metadata,
  Model,
  NumberArgument,
  RepeatArgument,
  SeqJson,
  StringArgument,
  SymbolArgument,
  Time,
  VariableDeclaration,
} from '@nasa-jpl/seq-json-schema/types';
import { logInfo } from './logger';
import { TOKEN_REPEAT_ARG } from './sequencer-grammar-constants';
import { EPOCH_SIMPLE, EPOCH_TIME, RELATIVE_SIMPLE, RELATIVE_TIME, testTime } from './time-utils';

let variableList: string[] = [];

/**
 * Returns a minimal valid Seq JSON object.
 * Use for getting a default Seq JSON throughout the application.
 */
export function seqJsonDefault(): SeqJson {
  return { id: '', metadata: {} };
}

/**
 * Walks the sequence parse tree and converts it to a valid Seq JSON object.
 */
export function sequenceToSeqJson(node: Tree, text: string, commandDictionary: CommandDictionary | null): SeqJson {
  const baseNode = node.topNode;
  const seqJson: SeqJson = seqJsonDefault();
  variableList = [];

  seqJson.id = parseId(baseNode, text);
  seqJson.metadata = { ...parseLGO(baseNode), ...parseMetadata(baseNode, text) } ?? {};
  seqJson.locals = parseVariables(baseNode, text, 'LocalDeclaration') ?? undefined;
  seqJson.parameters = parseVariables(baseNode, text, 'ParameterDeclaration') ?? undefined;
  seqJson.steps =
    baseNode
      .getChild('Commands')
      ?.getChildren('Command')
      .map(command => parseCommand(command, text, commandDictionary)) ?? undefined;
  seqJson.immediate_commands =
    baseNode
      .getChild('ImmediateCommands')
      ?.getChildren('Command')
      .map(command => parseImmediateCommand(command, text, commandDictionary)) ?? undefined;
  seqJson.hardware_commands =
    baseNode
      .getChild('HardwareCommands')
      ?.getChildren('Command')
      .map(command => parseHardwareCommand(command, text)) ?? undefined;
  return seqJson;
}

function parseLGO(node: SyntaxNode): Metadata | undefined {
  const lgoNode = node.getChild('Commands')?.getChild('LoadAndGoDirective');
  if (!lgoNode) {
    return undefined;
  }

  return {
    lgo: 'true',
  };
}

export function parseArg(
  node: SyntaxNode,
  text: string,
  dictionaryArg: FswCommandArgument | null,
): BooleanArgument | HexArgument | NumberArgument | StringArgument | SymbolArgument | undefined {
  const nodeValue = text.slice(node.from, node.to);

  if (node.name === 'Boolean') {
    const value = nodeValue === 'TRUE' ? true : false;
    const booleanArg: BooleanArgument = { type: 'boolean', value };
    if (dictionaryArg) {
      booleanArg.name = dictionaryArg.name;
    }
    return booleanArg;
  } else if (node.name === 'Enum') {
    const value = nodeValue;
    const enumArg: StringArgument = { type: 'string', value };
    if (dictionaryArg) {
      enumArg.name = dictionaryArg.name;
    }
    return enumArg;
  } else if (node.name === 'Number') {
    if (nodeValue.slice(0, 2) === '0x') {
      const hexArg: HexArgument = { type: 'hex', value: nodeValue };
      if (dictionaryArg) {
        hexArg.name = dictionaryArg.name;
      }
      return hexArg;
    } else {
      const value = parseFloat(nodeValue);
      const numberArg: NumberArgument = { type: 'number', value };
      if (dictionaryArg) {
        numberArg.name = dictionaryArg.name;
      }
      return numberArg;
    }
  } else if (node.name === 'String') {
    const value = JSON.parse(nodeValue);
    let arg: StringArgument | SymbolArgument;
    if (variableList.includes(value)) {
      arg = { type: 'symbol', value };
    } else {
      arg = { type: 'string', value };
    }

    if (dictionaryArg) {
      arg.name = dictionaryArg.name;
    }
    return arg;
  }
}

export function parseRepeatArgs(
  repeatArgsNode: SyntaxNode,
  text: string,
  dictRepeatArgument: FswCommandArgumentRepeat | null,
) {
  const repeatArg: RepeatArgument = { type: 'repeat', value: [] };
  let repeatArgNode: SyntaxNode | null = repeatArgsNode;

  if (repeatArgNode) {
    let i = 0;
    do {
      const args: RepeatArgument['value'][0] = [];
      let argNode = repeatArgNode.firstChild;
      const repeatArgs = dictRepeatArgument?.repeat?.arguments ?? null;

      if (argNode) {
        do {
          const arg = parseArg(argNode, text, repeatArgs ? repeatArgs[i] : null);
          if (arg) {
            args.push(arg);
          } else {
            logInfo(`Could not parse arg for node with name ${argNode.name}`);
          }

          argNode = argNode?.nextSibling;
          i = (i + 1) % (repeatArgs?.length ?? 0);
        } while (argNode);
      }

      repeatArg.value.push(args);

      repeatArgNode = repeatArgNode?.nextSibling;
    } while (repeatArgNode);
  }

  if (dictRepeatArgument) {
    repeatArg.name = dictRepeatArgument.name;
  }

  return repeatArg;
}

export function parseArgs(
  argsNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
  stem: string,
): Args {
  const args: Args = [];
  let argNode = argsNode.firstChild;
  const dictArguments = commandDictionary?.fswCommandMap[stem]?.arguments ?? [];
  let i = 0;

  if (argNode) {
    do {
      const dictArg = dictArguments[i] ?? null;
      if (argNode.name === TOKEN_REPEAT_ARG) {
        const arg = parseRepeatArgs(argNode, text, (dictArg as FswCommandArgumentRepeat) ?? null);
        if (arg) {
          args.push(arg);
        } else {
          logInfo(`Could not parse repeat arg for node with name ${argNode.name}`);
        }
      } else {
        const arg = parseArg(argNode, text, dictArg);
        if (arg) {
          args.push(arg);
        } else {
          logInfo(`Could not parse arg for node with name ${argNode.name}`);
        }
      }
      argNode = argNode?.nextSibling;
      ++i;
    } while (argNode);
  }

  return args;
}

/**
 *
 * @param commandNode
 * @param text
 * @returns
 */

/**
 * Parses a time tag node and returns a Seq JSON time.
 * Defaults to an unknown absolute time if a command does not have a valid time tag.
 */
export function parseTime(commandNode: SyntaxNode, text: string): Time {
  const timeTagNode = commandNode.getChild('TimeTag');
  let tag = 'UNKNOWN';

  if (timeTagNode == null) {
    return { tag, type: 'ABSOLUTE' };
  }

  const timeTagAbsoluteNode = timeTagNode.getChild('TimeAbsolute');
  const timeTagCompleteNode = timeTagNode.getChild('TimeComplete');
  const timeTagEpochNode = timeTagNode.getChild('TimeEpoch');
  const timeTagRelativeNode = timeTagNode.getChild('TimeRelative');

  if (timeTagCompleteNode) {
    return { type: 'COMMAND_COMPLETE' };
  }

  if (!timeTagAbsoluteNode && !timeTagEpochNode && !timeTagRelativeNode) {
    return { tag, type: 'ABSOLUTE' };
  }

  if (timeTagAbsoluteNode) {
    const tag = text.slice(timeTagAbsoluteNode.from + 1, timeTagAbsoluteNode.to).trim();
    return { tag, type: 'ABSOLUTE' };
  } else if (timeTagEpochNode) {
    const timeTagEpochText = text.slice(timeTagEpochNode.from + 1, timeTagEpochNode.to).trim();

    // a regex to determine if this string [+/-]####T##:##:##.###
    let match = testTime(timeTagEpochText, EPOCH_TIME);
    if (match) {
      const [, sign, doy, hh, mm, ss, ms] = match;
      tag = `${sign === '-' ? '-' : ''}${doy !== undefined ? doy : ''}${hh ? hh : '00'}:${mm ? mm : '00'}:${
        ss ? ss : '00'
      }${ms ? ms : ''}`;
      return { tag, type: 'EPOCH_RELATIVE' };
    }

    // a regex to determine if this string [+/-]###.###
    match = testTime(timeTagEpochText, EPOCH_SIMPLE);
    if (match) {
      const [, sign, second, ms] = match;
      tag = `${sign === '-' ? '-' : ''}${second ? secondsToHMS(Number(second)) : ''}${ms ? ms : ''}`;
      return { tag, type: 'EPOCH_RELATIVE' };
    }
  } else if (timeTagRelativeNode) {
    const timeTagRelativeText = text.slice(timeTagRelativeNode.from + 1, timeTagRelativeNode.to).trim();

    // a regex to determine if this string ####T##:##:##.###
    let match = testTime(timeTagRelativeText, RELATIVE_TIME);
    if (match) {
      RELATIVE_TIME.lastIndex = 0;
      const [, doy, hh, mm, ss, ms] = match;
      tag = `${doy !== undefined ? doy : ''}${doy !== undefined ? doy : ''}${hh ? hh : '00'}:${mm ? mm : '00'}:${
        ss ? ss : '00'
      }${ms ? ms : ''}`;
      return { tag, type: 'COMMAND_RELATIVE' };
    }
    match = testTime(timeTagRelativeText, RELATIVE_SIMPLE);
    if (match) {
      RELATIVE_SIMPLE.lastIndex = 0;
      const [, second, ms] = match;
      tag = `${second ? secondsToHMS(Number(second)) : ''}${ms ? ms : ''}`;
      return { tag, type: 'COMMAND_RELATIVE' };
    }
  }
  return { tag, type: 'ABSOLUTE' };
}

function secondsToHMS(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    throw new Error(`Expected a valid number for seconds, got ${seconds}`);
  }

  const hours: number = Math.floor(seconds / 3600);
  const minutes: number = Math.floor((seconds % 3600) / 60);
  const remainingSeconds: number = seconds % 60;

  const hoursString = hours.toString().padStart(2, '0');
  const minutesString = minutes.toString().padStart(2, '0');
  const remainingSecondsString = remainingSeconds.toString().padStart(2, '0');

  return `${hoursString}:${minutesString}:${remainingSecondsString}`;
}

function parseVariables(
  node: SyntaxNode,
  text: string,
  type: 'LocalDeclaration' | 'ParameterDeclaration' = 'LocalDeclaration',
): [VariableDeclaration, ...VariableDeclaration[]] | undefined {
  const variableContainer = node.getChild(type);
  if (!variableContainer) {
    return undefined;
  }
  const variables = variableContainer.getChildren('Enum');
  if (!variables || variables.length === 0) {
    return undefined;
  }

  const variableDeclaration: VariableDeclaration[] = [];
  variables.map((variable: SyntaxNode) => {
    const variableText = text.slice(variable.from, variable.to);
    variableList.push(variableText);

    //parse the text [a-z]D*("UINT"|"INT"|"FLOAT"|"ENUM"|"STR")L07
    const match = /([a-zA-Z]*)([0-9]{2})(INT|UINT|FLT|ENUM|STR)/g.exec(variableText);
    if (match) {
      const [, , , kind] = match;

      let type = 'UNKNOWN';
      switch (kind) {
        case 'STR':
          type = 'STRING';
          break;
        case 'FLT':
          type = 'FLOAT';
          break;
        default:
          type = kind;
          break;
      }

      variableDeclaration.push({
        name: variableText,
        type: type as VariableDeclaration['type'],
      });
    } else {
      variableDeclaration.push({
        name: variableText,
        type: 'UNKNOWN' as VariableDeclaration['type'],
      });
    }
  });
  return [variableDeclaration[0], ...variableDeclaration.slice(1)] as [VariableDeclaration, ...VariableDeclaration[]];
}

function parseModel(node: SyntaxNode, text: string): Model[] | undefined {
  const modelContainer = node.getChild('Models');
  if (!modelContainer) {
    return undefined;
  }

  const modelNodes = modelContainer.getChildren('Model');
  if (!modelNodes || modelNodes.length === 0) {
    return undefined;
  }

  const models: Model[] = [];
  for (const modelNode of modelNodes) {
    const variableNode = modelNode.getChild('Variable');
    const valueNode = modelNode.getChild('Value');
    const offsetNode = modelNode.getChild('Offset');

    const variable = variableNode
      ? (removeQuotes(text.slice(variableNode.from, variableNode.to)) as string)
      : 'UNKNOWN';

    // Value can be string, number or boolean
    let value: Model['value'] = 0;
    if (valueNode) {
      const valueChild = valueNode.firstChild;
      if (valueChild) {
        const valueText = text.slice(valueChild.from, valueChild.to);
        if (valueChild.name === 'String') {
          value = removeQuotes(valueText);
        } else if (valueChild.name === 'Boolean') {
          value = !/^FALSE$/i.test(valueText);
        } else if (valueChild.name === 'Number') {
          value = Number(valueText);
        }
      }
    }
    const offset = offsetNode ? (removeQuotes(text.slice(offsetNode.from, offsetNode.to)) as string) : 'UNKNOWN';

    models.push({ offset, value, variable });
  }

  return models;
}

function parseDescription(node: SyntaxNode, text: string): string | undefined {
  const descriptionNode = node.getChild('LineComment');
  if (!descriptionNode) {
    return undefined;
  }
  const description = text.slice(descriptionNode.from + 1, descriptionNode.to).trim();
  return removeQuotes(description) as string;
}

function removeQuotes(text: string | number | boolean): string | number | boolean {
  if (typeof text === 'string') {
    return text.replace(/^"|"$/g, '').replaceAll('\\"', '"');
  }
  return text;
}

export function parseCommand(
  commandNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
): Command {
  const time = parseTime(commandNode, text);

  const stemNode = commandNode.getChild('Stem');
  const stem = stemNode ? text.slice(stemNode.from, stemNode.to) : 'UNKNOWN';

  const argsNode = commandNode.getChild('Args');
  const args = argsNode ? parseArgs(argsNode, text, commandDictionary, stem) : [];

  const description = parseDescription(commandNode, text);
  const metadata: Metadata | undefined = parseMetadata(commandNode, text);
  const models: Model[] | undefined = parseModel(commandNode, text);

  return {
    args,
    stem,
    time,
    type: 'command',
    ...(description ? { description } : {}),
    ...(models ? { models } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function parseImmediateCommand(
  commandNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
): ImmediateCommand {
  const stemNode = commandNode.getChild('Stem');
  const stem = stemNode ? text.slice(stemNode.from, stemNode.to) : 'UNKNOWN';

  const argsNode = commandNode.getChild('Args');
  const args = argsNode ? parseArgs(argsNode, text, commandDictionary, stem) : [];

  const description = parseDescription(commandNode, text);
  const metadata: Metadata | undefined = parseMetadata(commandNode, text);

  return {
    args,
    stem,
    ...(description ? { description } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function parseHardwareCommand(commandNode: SyntaxNode, text: string): HardwareCommand {
  const stemNode = commandNode.getChild('Stem');
  const stem = stemNode ? text.slice(stemNode.from, stemNode.to) : 'UNKNOWN';
  const description = parseDescription(commandNode, text);
  const metadata: Metadata | undefined = parseMetadata(commandNode, text);

  return {
    stem,
    ...(description ? { description } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function parseId(node: SyntaxNode, text: string): string {
  const idNode = node.getChild('IdDeclaration');
  if (!idNode) {
    return '';
  }

  const stringNode = idNode.getChild('String');
  if (!stringNode) {
    return '';
  }

  const id = JSON.parse(text.slice(stringNode.from, stringNode.to));
  return id;
}

function parseMetadata(node: SyntaxNode, text: string): Metadata | undefined {
  const metadataNode = node.getChild('Metadata');
  if (!metadataNode) {
    return undefined;
  }

  const metadataEntry = metadataNode.getChildren('MetaEntry');
  if (!metadataEntry || metadataEntry.length === 0) {
    return undefined;
  }

  const obj: Metadata = {};
  metadataEntry.forEach(entry => {
    const keyNode = entry.getChild('Key');
    const valueNode = entry.getChild('Value');

    if (!keyNode || !valueNode) {
      return; // Skip this entry if either the key or value is missing
    }

    const keyText = removeQuotes(text.slice(keyNode.from, keyNode.to)) as string;
    const valueText = removeQuotes(text.slice(valueNode.from, valueNode.to));

    obj[keyText] = valueText;
  });

  return obj;
}
