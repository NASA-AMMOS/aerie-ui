import { syntaxTree } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { hoverTooltip, type Tooltip } from '@codemirror/view';
import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
import type { EditorView } from 'codemirror';
import CommandTooltip from '../../components/sequencing/CommandTooltip.svelte';
import { getTokenPositionInLine } from '../sequence-editor/sequence-tooltip';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import { RULE_TIME_TAGGED_STATEMENT } from './vml-constants';

export function vmlTooltip(commandDictionary: CommandDictionary | null): Extension {
  return hoverTooltip((view: EditorView, pos: number, side: number): Tooltip | null => {
    const { from, to } = getTokenPositionInLine(view, pos);

    const tree = syntaxTree(view.state);
    const cursorNode = tree.cursorAt(from, 1).node;
    const timeTaggedNode = getNearestAncestorNodeOfType(cursorNode, [RULE_TIME_TAGGED_STATEMENT]);
    if (timeTaggedNode) {
      const statementSubNode = timeTaggedNode.getChild('Statement')?.firstChild;
      if (statementSubNode) {
        switch (statementSubNode.name) {
          case 'Issue': {
            const functionNameNode = statementSubNode.getChild('Function_name');
            if (functionNameNode) {
              const commandName = view.state.sliceDoc(functionNameNode.from, functionNameNode.to);
              const command = commandDictionary?.fswCommandMap[commandName];
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
          }
        }
      }
    }

    // if (cursor.node) {
    //   const issueNode = getNearestAncestorNodeOfType(cursor.node, ['Issue']);
    //   if (issueNode) {

    //   }
    // }

    // First handle the case where the token is out of bounds.
    if ((from === pos && side < 0) || (to === pos && side > 0)) {
      return null;
    }

    if (commandDictionary) {
      //
    }

    if (!commandDictionary) {
      return null;
    }

    return null;
  });
}
