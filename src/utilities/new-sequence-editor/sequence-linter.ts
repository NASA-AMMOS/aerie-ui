import { syntaxTree } from '@codemirror/language';
import { linter, type Diagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import type { TreeCursor } from '@lezer/common';
import type { CommandDictionary, EnumMap, FswCommand, HwCommand } from '@nasa-jpl/aerie-ampcs';

/**
 * Helper that returns all valid enum symbols from a command dictionary enum map, for a given enum name.
 */
export function getAllEnumSymbols(enumMap: EnumMap, enumName: string) {
  const enumSymbols = enumMap[enumName].values.map(({ symbol }) => symbol);
  const enumSymbolsDisplayStr = enumSymbols.join('  |  ');
  return { enumSymbols, enumSymbolsDisplayStr };
}

/**
 * Linter function that returns a Code Mirror extension function.
 * Can be optionally called with a command dictionary so it's available during linting.
 */
export function sequenceLinter(commandDictionary: CommandDictionary | null = null): Extension {
  return linter(view => {
    const cursor: TreeCursor = syntaxTree(view.state).cursor();
    let diagnostics: Diagnostic[] = [];
    let idCount = 0;

    do {
      const { node } = cursor;

      if (node.name === 'Id') {
        ++idCount;
        if (idCount > 1) {
          diagnostics.push({
            actions: [],
            from: node.from,
            message: 'Sequence should only contain a single ID',
            severity: 'error',
            to: node.to,
          });
        }
      } else if (node.name == 'Stem') {
        if (commandDictionary) {
          const { fswCommandMap, hwCommandMap } = commandDictionary;
          const textContent = view.state.doc.sliceString(node.from, node.to);
          const command: FswCommand | HwCommand | null =
            fswCommandMap[textContent] ?? hwCommandMap[textContent] ?? null;

          if (!command) {
            diagnostics.push({
              actions: [],
              from: node.from,
              message: 'Command not found',
              severity: 'error',
              to: node.to,
            });
          }
        }
      } else if (node.name === 'Args') {
        const stem = node.parent?.getChild('Stem');

        if (commandDictionary && stem) {
          const { enumMap, fswCommandMap } = commandDictionary;
          const textContent = view.state.doc.sliceString(stem.from, stem.to);
          const fswCommand: FswCommand | null = fswCommandMap[textContent] ?? null;

          let argNode = node.firstChild;
          let i = 0;

          do {
            if (argNode && fswCommand) {
              const arg = fswCommand.arguments[i];
              const nodeText = view.state.doc.sliceString(argNode.from, argNode.to);

              if (argNode.name === 'Boolean') {
                if (arg?.arg_type === 'boolean') {
                  // TODO.
                } else {
                  diagnostics.push({
                    actions: [],
                    from: argNode.from,
                    message: `Incorrect type - expected ${arg.arg_type} but got boolean`,
                    severity: 'error',
                    to: argNode.to,
                  });
                }
              } else if (argNode.name === 'Enum') {
                if (arg?.arg_type === 'enum') {
                  const enumName = arg.enum_name;
                  const { enumSymbols } = getAllEnumSymbols(enumMap, enumName);
                  const validEnum = enumSymbols.includes(nodeText);

                  if (!validEnum) {
                    diagnostics.push({
                      actions: [],
                      from: argNode.from,
                      message: `Symbol not found in the ${enumName} enumeration.`,
                      severity: 'error',
                      to: argNode.to,
                    });
                  }
                } else {
                  diagnostics.push({
                    actions: [],
                    from: argNode.from,
                    message: `Incorrect type - expected ${arg.arg_type} but got enum`,
                    severity: 'error',
                    to: argNode.to,
                  });
                }
              } else if (argNode.name === 'Number') {
                if (
                  arg?.arg_type === 'float' ||
                  arg?.arg_type === 'integer' ||
                  arg?.arg_type === 'numeric' ||
                  arg?.arg_type === 'unsigned'
                ) {
                  if (arg.range) {
                    const { max, min } = arg.range;
                    const nodeTextAsNumber = parseFloat(nodeText);

                    if (nodeTextAsNumber < min || nodeTextAsNumber > max) {
                      const message = [
                        `Number out of range.`,
                        `Make sure this number is between ${min} and ${max} inclusive.`,
                      ].join('\n');

                      diagnostics.push({
                        actions: [],
                        from: argNode.from,
                        message,
                        severity: 'error',
                        to: argNode.to,
                      });
                    }
                  }
                } else {
                  diagnostics.push({
                    actions: [],
                    from: argNode.from,
                    message: `Incorrect type - expected ${arg.arg_type} but got number`,
                    severity: 'error',
                    to: argNode.to,
                  });
                }
              } else if (argNode.name === 'String') {
                if (arg?.arg_type === 'fixed_string' || arg?.arg_type === 'var_string') {
                  // TODO.
                } else {
                  diagnostics.push({
                    actions: [],
                    from: argNode.from,
                    message: `Incorrect type - expected ${arg.arg_type} but got string`,
                    severity: 'error',
                    to: argNode.to,
                  });
                }
              }

              cursor.next(); // Skips token in outer loop since we analyze it here.
            }
            argNode = argNode?.nextSibling ?? null;
            ++i;
          } while (argNode);
        }
      } else {
        // TODO.
      }

      // Only execute an adaptation provided LINT function if it exists
      if (globalThis.LINT) {
        diagnostics = [...diagnostics, ...globalThis.LINT(commandDictionary, view, node)];
      }
    } while (cursor.next());

    return diagnostics;
  });
}
