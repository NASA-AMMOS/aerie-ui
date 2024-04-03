import type { SyntaxNode, Tree, TreeCursor } from '@lezer/common';
import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
import type {
  Args,
  BooleanArgument,
  Command,
  GroundBlock,
  HexArgument,
  Model,
  NumberArgument,
  RepeatArgument,
  SeqJson,
  StringArgument,
  Time,
  VariableDeclaration,
} from '@nasa-jpl/seq-json-schema/types';
import { logInfo } from './logger';

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
  let cursor: TreeCursor = node.cursor();
  let seqJson: SeqJson = seqJsonDefault();

  const globals: VariableDeclaration[] = [];
  const locals: VariableDeclaration[] = [];
  const parameters: VariableDeclaration[] = [];
  const varSymbolTable: Record<string, Record<string, VariableDeclaration>> = { globals: {}, locals: {}, params: {} };

  // Build symbol table of params, locals, and globals.
  while (cursor.next()) {
    if (cursor.node.name === 'Global' || cursor.node.name === 'Local' || cursor.node.name === 'Param') {
      const varNameNode = cursor.node.getChild('VarName');
      const varTypeNode = cursor.node.getChild('VarType')?.firstChild; // Specific type is the first child of VarType.

      if (varTypeNode && varNameNode) {
        const name = text.slice(varNameNode.from, varNameNode.to);
        const type = text.slice(varTypeNode.from, varTypeNode.to) as VariableDeclaration['type'];
        const varDeclaration: VariableDeclaration = { name, type };

        if (cursor.node.name === 'Global') {
          varSymbolTable.globals[name] = varDeclaration;
          globals.push(varDeclaration);
        } else if (cursor.node.name === 'Local') {
          varSymbolTable.locals[name] = varDeclaration;
          locals.push(varDeclaration);
        } else if (cursor.node.name === 'Param') {
          varSymbolTable.params[name] = varDeclaration;
          parameters.push(varDeclaration);
        }
      }
    }
  }

  if (locals.length) {
    seqJson = { ...seqJson, locals: locals as SeqJson['locals'] };
  }

  if (parameters.length) {
    seqJson = { ...seqJson, parameters: parameters as SeqJson['parameters'] };
  }

  // Reset cursor and re-scan now that we have the symbol table to use in sequence.
  cursor = node.cursor();

  // Note: This skips the top-level Sequence node (change to do-while if you need to access it).
  while (cursor.next()) {
    if (cursor.node.name === 'Id') {
      const id = parseId(cursor.node, text);
      seqJson.id = id;
    } else if (cursor.node.name === 'Command') {
      const command = parseCommand(cursor.node, text, commandDictionary);
      if (!seqJson.steps) {
        seqJson.steps = [];
      }
      seqJson.steps.push(command);
    }
  }

  return seqJson;
}

export function parseArg(
  node: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
  stem: string,
  index = -1,
): BooleanArgument | HexArgument | NumberArgument | StringArgument | undefined {
  const nodeValue = text.slice(node.from, node.to);
  const fswCommand = commandDictionary?.fswCommandMap[stem] ?? null;
  const fswCommandArg = fswCommand?.arguments[index] ?? null;

  if (node.name === 'Boolean') {
    const value = JSON.parse(nodeValue);
    const booleanArg: BooleanArgument = { type: 'boolean', value };
    if (fswCommandArg) {
      booleanArg.name = fswCommandArg.name;
    }
    return booleanArg;
  } else if (node.name === 'Enum') {
    const value = nodeValue;
    const enumArg: StringArgument = { type: 'string', value };
    if (fswCommandArg) {
      enumArg.name = fswCommandArg.name;
    }
    return enumArg;
  } else if (node.name === 'Number') {
    if (nodeValue.slice(0, 2) === '0x') {
      const hexArg: HexArgument = { type: 'hex', value: nodeValue };
      if (fswCommandArg) {
        hexArg.name = fswCommandArg.name;
      }
      return hexArg;
    } else {
      const value = parseFloat(nodeValue);
      const numberArg: NumberArgument = { type: 'number', value };
      if (fswCommandArg) {
        numberArg.name = fswCommandArg.name;
      }
      return numberArg;
    }
  } else if (node.name === 'String') {
    const value = JSON.parse(nodeValue);
    const stringArg: StringArgument = { type: 'string', value };
    if (fswCommandArg) {
      stringArg.name = fswCommandArg.name;
    }
    return stringArg;
  }
}

export function parseRepeatArgs(
  repeatArgsNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
  stem: string,
  index: number,
) {
  const repeatArg: RepeatArgument = { type: 'repeat', value: [] };
  const fswCommand = commandDictionary?.fswCommandMap[stem] ?? null;
  const fswCommandArg = fswCommand?.arguments[index] ?? null;
  let repeatArgNode = repeatArgsNode.firstChild;

  if (repeatArgNode) {
    do {
      if (repeatArgNode.name === 'RepeatArg') {
        const args: RepeatArgument['value'][0] = [];
        let argNode = repeatArgNode.firstChild;

        if (argNode) {
          do {
            const arg = parseArg(argNode, text, commandDictionary, stem);
            if (arg) {
              args.push(arg);
            } else {
              logInfo(`Could not parse arg for node with name ${argNode.name}`);
            }

            argNode = argNode?.nextSibling;
          } while (argNode);
        }

        repeatArg.value.push(args);
      }

      repeatArgNode = repeatArgNode?.nextSibling;
    } while (repeatArgNode);
  }

  if (fswCommandArg) {
    repeatArg.name = fswCommandArg.name;
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
  let i = 0;

  if (argNode) {
    do {
      if (argNode.name === 'RepeatArgs') {
        const arg = parseRepeatArgs(argNode, text, commandDictionary, stem, i);
        if (arg) {
          args.push(arg);
        } else {
          logInfo(`Could not parse repeat arg for node with name ${argNode.name}`);
        }
      } else {
        const arg = parseArg(argNode, text, commandDictionary, stem, i);
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
 * Returns a string value between parenthesis.
 * For example if you pass text as 'abs(2020-001T00:00:00)', this
 * function will return '2020-001T00:00:00'.
 * Returns 'UNKNOWN' if a value is not found in-between parenthesis.
 */
export function parseTimeTag(text: string): string {
  return text.split('(').pop()?.slice(0, -1) ?? 'UNKNOWN';
}

/**
 * Parses a time tag node and returns a Seq JSON time.
 * Defaults to an unknown absolute time if a command does not have a valid time tag.
 */
export function parseTime(commandNode: SyntaxNode, text: string): Time {
  const timeTagAbsoluteNode = commandNode.getChild('TimeTagAbsolute');
  const timeTagCompleteNode = commandNode.getChild('TimeTagComplete');
  const timeTagEpochNode = commandNode.getChild('TimeTagEpoch');
  const timeTagRelativeNode = commandNode.getChild('TimeTagRelative');

  if (timeTagAbsoluteNode) {
    const timeTagAbsoluteText = text.slice(timeTagAbsoluteNode.from, timeTagAbsoluteNode.to);
    const tag = parseTimeTag(timeTagAbsoluteText);
    return { tag, type: 'ABSOLUTE' };
  }

  if (timeTagCompleteNode) {
    return { type: 'COMMAND_COMPLETE' };
  }

  if (timeTagEpochNode) {
    const timeTagEpochText = text.slice(timeTagEpochNode.from, timeTagEpochNode.to);
    const tag = timeTagEpochText.slice(1);
    return { tag, type: 'EPOCH_RELATIVE' };
  }

  if (timeTagRelativeNode) {
    const timeTagRelativeText = text.slice(timeTagRelativeNode.from, timeTagRelativeNode.to);
    const tag = timeTagRelativeText.length > 0 ? secondsToHMS(Number(timeTagRelativeText.slice(1))) : '00:00:00';
    return { tag, type: 'COMMAND_RELATIVE' };
  }

  return { tag: 'UNKNOWN', type: 'ABSOLUTE' };
}

function secondsToHMS(seconds: number): string {
  const hours: number = Math.floor(seconds / 3600);
  const minutes: number = Math.floor((seconds % 3600) / 60);
  const remainingSeconds: number = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function parseModel(node: SyntaxNode, text: string): Model[] | undefined {
  const modelNodes = node.getChildren('Model');
  if (modelNodes.length === 0) {
    return undefined;
  } else {
    const models: Model[] = [];
    modelNodes.map((modelNode: SyntaxNode) => {
      const variableNode = modelNode.getChild('Variable');
      const valueNode = modelNode.getChild('Value');
      const offsetNode = modelNode.getChild('Offset');

      models.push({
        variable: variableNode ? (removeQuotes(text.slice(variableNode.from, variableNode.to)) as string) : 'UNKNOWN',
        value: valueNode ? removeQuotes(text.slice(valueNode.from, valueNode.to)) : 0,
        offset: offsetNode ? (removeQuotes(text.slice(offsetNode.from, offsetNode.to)) as string) : 'UNKNOWN',
      });
    });

    return models;
  }
}

function parseDescription(node: SyntaxNode, text: string): string | undefined {
  const descriptionNode = node.getChild('Description')?.getChild('String');
  if (descriptionNode) {
    const description = text.slice(descriptionNode.from, descriptionNode.to);
    return removeQuotes(description) as string;
  }
  return undefined;
}

function removeQuotes(text: string | number | boolean): string | number | boolean {
  if (typeof text === 'string') {
    return text.replace(/^"|"$/g, '');
  }
  return text;
}

export function parseGroundBlock(commandNode: SyntaxNode, text: string): GroundBlock {
  const time = parseTime(commandNode, text);
  const description = parseDescription(commandNode, text);
  const models = parseModel(commandNode, text);
  console.log(commandNode.toString());
  const nameNode = commandNode.getChild('Name');
  const name = nameNode ? (removeQuotes(text.slice(nameNode.from, nameNode.to)) as string) : 'UNKNOWN';

  const argsNode = commandNode.getChild('Args');
  const args = argsNode ? parseArgs(argsNode, text, null, '') : null;

  return {
    type: 'ground_block',
    name,
    time,
    ...(description ? { description } : {}),
    ...(models ? { models } : {}),
    ...(args ? { args } : {}),
  };
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

  return {
    args,
    stem,
    time,
    type: 'command',
  };
}

export function parseId(idNode: SyntaxNode, text: string): string {
  const stringNode = idNode.getChild('String');
  const id = stringNode ? JSON.parse(text.slice(stringNode.from, stringNode.to)) : '';
  return id;
}
