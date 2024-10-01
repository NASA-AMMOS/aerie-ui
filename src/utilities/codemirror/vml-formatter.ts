import { syntaxTree } from '@codemirror/language';
import { type ChangeSpec } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { EditorView } from 'codemirror';
import {
  RULE_FUNCTION_NAME,
  RULE_ISSUE,
  RULE_SIMPLE_EXPR,
  RULE_STATEMENT,
  RULE_TIME_TAGGED_STATEMENT,
  RULE_VM_MANAGEMENT,
  TOKEN_ERROR,
  TOKEN_TIME_CONST,
} from './vml-constants';

type LineOfNodes = (SyntaxNode | undefined)[];

export function vmlFormat(view: EditorView) {
  const state = view.state;
  const tree = syntaxTree(state);

  const timeTaggedStatements: SyntaxNode[] = [];
  // gather spawn and issue type commands
  tree.iterate({
    enter: nodeRef => {
      if (nodeRef.name === RULE_TIME_TAGGED_STATEMENT) {
        timeTaggedStatements.push(nodeRef.node);
      }
    },
  });

  const errorFreeTimeTaggedStatements = timeTaggedStatements.filter(node => {
    switch (node.getChild(RULE_STATEMENT)?.firstChild?.name) {
      case RULE_VM_MANAGEMENT:
      case RULE_ISSUE: {
        const childCursor = node.toTree().cursor();
        do {
          if (childCursor.node.name === TOKEN_ERROR) {
            return false;
          }
        } while (childCursor.next());
        return true;
      }
    }
    return false;
  });

  // 0 - time
  // 1 - category
  // 2 - engine id (only present on 'Vm_management')
  // 3 - stem or block name
  // 4 - arguments

  const nodesByColumn: LineOfNodes[] = errorFreeTimeTaggedStatements
    .map((statement): LineOfNodes | null => {
      const timeNode = statement.getChild(TOKEN_TIME_CONST);
      const statementTypeNode = statement.getChild(RULE_STATEMENT)?.firstChild;
      if (statementTypeNode) {
        switch (statementTypeNode.name) {
          case RULE_VM_MANAGEMENT:
            {
              const directiveNode = statementTypeNode.firstChild?.firstChild;
              const engineNode = statementTypeNode.firstChild?.getChild(RULE_SIMPLE_EXPR);
              const functionNameNode = statementTypeNode.firstChild?.getChild(RULE_FUNCTION_NAME);
              if (timeNode && directiveNode && engineNode) {
                return [timeNode, directiveNode, engineNode, functionNameNode ?? undefined];
              }
            }
            break;
          case RULE_ISSUE: {
            const directiveNode = statementTypeNode.firstChild;
            const functionNameNode = statementTypeNode.getChild(RULE_FUNCTION_NAME);
            if (timeNode && directiveNode && functionNameNode) {
              return [timeNode, directiveNode, undefined /* reserved for engine number */, functionNameNode];
            }
          }
        }
      }
      return null;
    })
    .filter((lineInfo): lineInfo is LineOfNodes => lineInfo !== null);

  const widths: number[] = nodesByColumn.reduce(
    (maxWidthsByCol, currentRow) =>
      maxWidthsByCol.map((maxSoFar, columnIndex) => {
        const cellToken = currentRow[columnIndex];
        return cellToken ? Math.max(maxSoFar, cellToken.to - cellToken.from) : maxSoFar;
      }),
    new Array(4).fill(0),
  );

  const indentation: number[] = [0];
  for (const width of widths) {
    indentation.push(width + indentation[indentation.length - 1] + 1);
  }

  const docText = state.toText(state.sliceDoc());

  const maybeChanges = nodesByColumn.flatMap((line: LineOfNodes) => {
    const firstNode = line.find(maybeNode => !!maybeNode);
    if (firstNode === undefined) {
      // unexpected case of no nodes on line
      return [];
    }

    const commandLine = docText.lineAt(firstNode.from);

    const filteredArray: SyntaxNode[] = line.filter((maybeNode): maybeNode is SyntaxNode => !!maybeNode);
    const deletions: ChangeSpec[] = [];

    // remove indentation at start of line
    if (commandLine.from < firstNode.from) {
      deletions.push({
        from: commandLine.from,
        to: firstNode.from,
      });
    }

    // collapse spacing between tokens
    deletions.push(
      ...filteredArray.slice(1).map((node, index) => ({
        from: filteredArray[index].to,
        insert: ' ',
        to: node.from,
      })),
    );

    const insertions = line.map((node: SyntaxNode | undefined, i: number) => {
      if (!node) {
        // no node, fill with engine width plus one space
        return {
          from: commandLine.from + indentation[i],
          insert: ' '.repeat(widths[i] + 1),
        };
      }

      const length = node.to - node.from;
      const pad = widths[i] - length;
      if (!pad) {
        return null;
      }
      return {
        from: node.to,
        insert: ' '.repeat(pad),
      };
    });
    return [...deletions, ...insertions];
  });

  const changes = maybeChanges.filter((maybeChange): maybeChange is ChangeSpec => !!maybeChange);

  view.update([
    state.update({
      changes,
    }),
  ]);
}
