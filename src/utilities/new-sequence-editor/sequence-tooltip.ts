import { syntaxTree } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { hoverTooltip, type EditorView, type Tooltip } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import type { CommandDictionary, FswCommand, HwCommand } from '@nasa-jpl/aerie-ampcs';
import ArgumentTooltip from '../../components/new-sequence-editor/ArgumentTooltip.svelte';
import CommandTooltip from '../../components/new-sequence-editor/CommandTooltip.svelte';

/**
 * Searches up through a node's ancestors to find a node by the given name.
 */
function getParentNodeByName(view: EditorView, pos: number, name: string): SyntaxNode | undefined {
  let node: SyntaxNode | undefined = syntaxTree(view.state).resolveInner(pos, -1);

  while (node && node.name !== name) {
    node = node.parent?.node;
  }

  return node;
}

/**
 * Returns a text token range for a line in the view at a given position.
 * @see https://codemirror.net/examples/tooltip/#hover-tooltips
 */
function getTokenPositionInLine(view: EditorView, pos: number) {
  const { from, to, text } = view.state.doc.lineAt(pos);
  const tokenRegex = /[a-zA-Z0-9_".-]/;

  let start = pos;
  let end = pos;

  while (start > from && tokenRegex.test(text[start - from - 1])) {
    --start;
  }

  while (end < to && tokenRegex.test(text[end - from])) {
    ++end;
  }

  return { from: start, to: end };
}

/**
 * Tooltip function that returns a Code Mirror extension function.
 * Can be optionally called with a command dictionary so it's available during tooltip generation.
 */
export function sequenceTooltip(commandDictionary: CommandDictionary | null = null): Extension {
  return hoverTooltip((view, pos, side): Tooltip | null => {
    const { from, to } = getTokenPositionInLine(view, pos);

    // First handle the case where the token is out of bounds.
    if ((from === pos && side < 0) || (to === pos && side > 0)) {
      return null;
    }

    // Check to see if we are hovering over a command stem.
    // TODO: Get token from AST? For now just assumes token is a commend stem if found in dictionary.
    if (commandDictionary) {
      const { hwCommandMap, fswCommandMap } = commandDictionary;
      const text = view.state.doc.sliceString(from, to);
      const command: FswCommand | HwCommand | null = fswCommandMap[text] ?? hwCommandMap[text] ?? null;

      if (command) {
        return {
          above: true,
          create() {
            const dom = document.createElement('div');
            new CommandTooltip({ props: { command }, target: dom });
            return { dom };
          },
          end: to,
          pos: from,
        };
      }
    }

    // Check to see if we are hovering over command arguments.
    const argsNode = getParentNodeByName(view, pos, 'Args');

    if (argsNode) {
      const stem = argsNode?.parent?.getChild('Stem');

      if (commandDictionary && stem) {
        const { fswCommandMap } = commandDictionary;
        const text = view.state.doc.sliceString(stem.from, stem.to);
        const fswCommand: FswCommand | null = fswCommandMap[text] ?? null;

        let argNode = argsNode?.firstChild;
        let i = 0;

        do {
          if (fswCommand && argNode && argNode.from === from && argNode.to === to) {
            const arg = fswCommand.arguments[i];

            // TODO. Type check arg for type found in AST so we do not show tooltips incorrectly.

            return {
              above: true,
              create() {
                const dom = document.createElement('div');
                new ArgumentTooltip({ props: { arg, commandDictionary }, target: dom });
                return { dom };
              },
              end: to,
              pos: from,
            };
          }

          argNode = argNode?.nextSibling ?? null;
          ++i;
        } while (argNode);
      }
    }

    return null;
  });
}
