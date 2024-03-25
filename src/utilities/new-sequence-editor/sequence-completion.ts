import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
import { fswCommandArgDefault } from './command-dictionary';

/**
 * Completion function that returns a Code Mirror extension function.
 * Can be optionally called with a command dictionary so it's available for completion.
 */
export function sequenceCompletion(commandDictionary: CommandDictionary | null = null) {
  return (context: CompletionContext): CompletionResult | null => {
    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

    if (nodeBefore?.parent?.name === 'Args') {
      // TODO: Handle argument completions.
      return null;
    }

    const word = context.matchBefore(/\w*/);

    if (word) {
      if (word.from == word.to && !context.explicit) {
        return null;
      }

      const timeTagCompletions: Completion[] = [];
      const enumerationCompletions: Completion[] = [];
      const fswCommandsCompletions: Completion[] = [];
      const hwCommandsCompletions: Completion[] = [];

      // Time Tags.
      timeTagCompletions.push(
        {
          apply: 'abs(2024-001T00:00:00)',
          info: 'Execute command at an absolute time',
          label: `abs (absolute)`,
          section: 'Time Tags',
          type: 'keyword',
        },
        {
          apply: 'cpl',
          info: 'Execute command after the previous command completes',
          label: 'cpl (complete)',
          section: 'Time Tags',
          type: 'keyword',
        },
        {
          apply: 'epc(00:00:00)',
          info: 'Execute command at an offset from an epoch',
          label: 'epc (epoch)',
          section: 'Time Tags',
          type: 'keyword',
        },
        {
          apply: 'rel(00:00:00)',
          info: 'Execute command at an offset from the previous command',
          label: 'rel (relative)',
          section: 'Time Tags',
          type: 'keyword',
        },
      );

      if (commandDictionary) {
        // Enumerations.
        // TODO: Make context aware.
        // for (const enumeration of commandDictionary.enums) {
        //   for (const enumValue of enumeration.values) {
        //     const { symbol } = enumValue;

        //     enumerationCompletions.push({
        //       label: symbol,
        //       section: 'Enumerations',
        //       type: 'labelName',
        //     });
        //   }
        // }

        // Flight Software Commands.
        for (const fswCommand of commandDictionary.fswCommands) {
          const { description, stem, arguments: args } = fswCommand;
          let apply = stem;

          if (args.length) {
            const argsStr = args.map(arg => fswCommandArgDefault(arg, commandDictionary.enumMap)).join(', ');
            apply = `${stem}(${argsStr})`;
          }

          fswCommandsCompletions.push({
            apply,
            info: description,
            label: stem,
            section: 'Flight Software Commands',
            type: 'function',
          });
        }

        // Hardware Commands.
        for (const hwCommand of commandDictionary.hwCommands) {
          const { description, stem } = hwCommand;

          hwCommandsCompletions.push({
            apply: stem,
            info: description,
            label: stem,
            section: 'Hardware Commands',
            type: 'function',
          });
        }
      }

      const globals = globalThis.GLOBALS;
      const globalCompletions: Completion[] = [];

      if (globals) {
        for (const global of globals) {
          globalCompletions.push({
            apply: global.name,
            info: global.type,
            label: global.name,
            section: 'Globals',
            type: 'keyword',
          });
        }
      }

      return {
        from: word.from,
        options: [
          ...timeTagCompletions,
          ...enumerationCompletions,
          ...fswCommandsCompletions,
          ...hwCommandsCompletions,
          ...globalCompletions,
        ],
      };
    }

    return null;
  };
}
