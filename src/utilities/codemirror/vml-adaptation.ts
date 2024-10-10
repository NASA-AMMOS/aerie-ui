import { type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import type { ChannelDictionary, CommandDictionary, FswCommand, FswCommandArgument } from '@nasa-jpl/aerie-ampcs';
import type { ISequenceAdaptation } from '../../types/sequencing';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import {
  RULE_CALL_PARAMETER,
  RULE_CALL_PARAMETERS,
  RULE_FUNCTION_NAME,
  RULE_STATEMENT,
  TOKEN_STRING_CONST,
} from './vml-constants';

export const VmlAdaptation: Partial<ISequenceAdaptation> = {
  // autoComplete: vmlAutoComplete,
};

export function vmlAutoComplete(
  _channelDictionary: ChannelDictionary | null,
  commandDictionary: CommandDictionary | null,
  // ): Extension {
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext) => {
    if (!commandDictionary) {
      return null;
    }

    const tree = syntaxTree(context.state);
    const nodeBefore = tree.resolveInner(context.pos, -1);
    const nodeCurrent = tree.resolveInner(context.pos, 0);
    if (nodeBefore.name === 'Issue') {
      return {
        from: context.pos,
        options: commandDictionary.fswCommands.map((fswCommand: FswCommand) => ({
          apply: getStemAndDefaultArguments(commandDictionary, fswCommand),
          info: fswCommand.description,
          label: fswCommand.stem,
          section: 'Command',
          type: 'function',
        })),
      };
    } else if (nodeCurrent.name === TOKEN_STRING_CONST) {
      const containingStatement = getNearestAncestorNodeOfType(nodeCurrent, [RULE_STATEMENT]);
      if (containingStatement) {
        const functionNameNode = containingStatement.firstChild?.getChild(RULE_FUNCTION_NAME);
        if (functionNameNode) {
          const stem = context.state.sliceDoc(functionNameNode.from, functionNameNode.to);
          const cmdDef = commandDictionary.fswCommandMap[stem];
          if (!cmdDef) {
            return null;
          }

          const argPos = getArgumentPosition(nodeCurrent);
          if (argPos === -1) {
            return null;
          }

          const argDef = cmdDef.arguments[argPos];
          if (!argDef || argDef.arg_type !== 'enum') {
            return null;
          }

          const enumValues = commandDictionary.enumMap[argDef.enum_name].values;
          return {
            filter: false,
            from: nodeCurrent.from,
            options: enumValues.map(enumValue => ({
              apply: `"${enumValue.symbol}"`,
              label: `${enumValue.symbol} (${enumValue.numeric})`,
              section: `${argDef.name} values`,
              type: 'keyword',
            })),
            to: nodeCurrent.to,
          };
        }
      }
    }

    return null;
  };
}

function getArgumentPosition(argNode: SyntaxNode) {
  return (
    getNearestAncestorNodeOfType(argNode, [RULE_STATEMENT])
      ?.firstChild?.getChild(RULE_CALL_PARAMETERS)
      ?.getChildren(RULE_CALL_PARAMETER)
      ?.findIndex(par => par.from === argNode.from && par.to === argNode.to) ?? -1
  );
}

function getStemAndDefaultArguments(commandDictionary: CommandDictionary, cmd: FswCommand): string {
  let s = cmd.stem;
  if (cmd.arguments.length) {
    s += ` ${cmd.arguments.map(argNode => getDefaultArgumentValue(commandDictionary, argNode)).join(',')}`;
  }

  return s;
}

function getDefaultArgumentValue(commandDictionary: CommandDictionary, argDef: FswCommandArgument): string {
  switch (argDef.arg_type) {
    case 'boolean':
      return argDef.default_value ?? 'TRUE';
    case 'float':
    case 'numeric':
    case 'integer':
    case 'unsigned':
      // ignores conversion setting
      return (argDef.default_value ?? argDef.range?.min)?.toString(10) ?? '0';
    case 'enum':
      return `"${commandDictionary.enumMap[argDef.enum_name]?.values[0]?.symbol ?? ''}"`;
    case 'var_string':
      return '""';
  }

  return '""';
}

export function statementTypeCompletions() {
  return [
    `WHILE condition DO`,
    `END_WHILE`,
    `FOR i := 1 TO mode STEP 2 DO`,
    `END_FOR`,
    `IF delay_time > 100.0 THEN`,
    `ELSE_IF delay_time > 80.0 THEN`,
    `ELSE`,
    `END_IF`,
    `ISSUE`,
  ];
}
