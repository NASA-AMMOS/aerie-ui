import { syntaxTree } from '@codemirror/language';
import { type ChangeSpec } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { EditorView } from 'codemirror';
import {
  RULE_ASSIGNMENT,
  RULE_CALL_PARAMETERS,
  RULE_ELSE,
  RULE_ELSE_IF,
  RULE_END_FOR,
  RULE_END_IF,
  RULE_END_WHILE,
  RULE_FOR,
  RULE_FUNCTION_NAME,
  RULE_IF,
  RULE_ISSUE,
  RULE_SIMPLE_EXPR,
  RULE_SPAWN,
  RULE_STATEMENT,
  RULE_TIME_TAGGED_STATEMENT,
  RULE_VM_MANAGEMENT,
  RULE_WHILE,
  TOKEN_ERROR,
  TOKEN_TIME_CONST,
} from './vml-constants';
import { computeBlocks } from './vml-folder';

type LineOfNodes = (SyntaxNode | undefined)[];

/*
  Formats code into columns

  0 - time
  1 - category
  2 - engine id (only present on 'Vm_management')
  3 - stem or block name
  4 - arguments
*/
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

  const blocks = computeBlocks(state);
  if (blocks) {
    // console.log(blocks);
  }

  const errorFreeTimeTaggedStatements = timeTaggedStatements.filter(node => {
    switch (node.getChild(RULE_STATEMENT)?.firstChild?.name) {
      case RULE_ASSIGNMENT:
      case RULE_IF:
      case RULE_ELSE_IF:
      case RULE_ELSE:
      case RULE_END_IF:
      case RULE_WHILE:
      case RULE_END_WHILE:
      case RULE_FOR:
      case RULE_END_FOR:
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

  const nodesByColumn: LineOfNodes[] = errorFreeTimeTaggedStatements
    .map((statement): LineOfNodes | null => {
      const timeNode = statement.getChild(TOKEN_TIME_CONST);
      const statementTypeNode = statement.getChild(RULE_STATEMENT)?.firstChild;
      // account for block level
      if (statementTypeNode) {
        switch (statementTypeNode.name) {
          case RULE_IF:
          case RULE_ELSE_IF:
          case RULE_ELSE:
          case RULE_END_IF:
          case RULE_WHILE:
          case RULE_END_WHILE:
          case RULE_FOR:
          case RULE_END_FOR:
          case RULE_ASSIGNMENT:
            {
              if (timeNode) {
                return [timeNode, statementTypeNode];
              }
            }
            break;
          case RULE_VM_MANAGEMENT:
            {
              const vmManagementType = statementTypeNode.firstChild;
              if (vmManagementType) {
                const directiveNode = vmManagementType.firstChild;
                const engineNode = vmManagementType.getChild(RULE_SIMPLE_EXPR);
                switch (vmManagementType.name) {
                  case RULE_SPAWN: {
                    const functionNameNode = vmManagementType.getChild(RULE_FUNCTION_NAME);
                    const ruleParametersNode = vmManagementType.getChild(RULE_CALL_PARAMETERS);
                    if (timeNode && directiveNode && engineNode) {
                      return [
                        timeNode,
                        directiveNode,
                        engineNode,
                        functionNameNode ?? undefined,
                        ruleParametersNode ?? undefined,
                      ];
                    }
                  }
                }
              }
            }
            break;
          case RULE_ISSUE: {
            const directiveNode = statementTypeNode.firstChild;
            const functionNameNode = statementTypeNode.getChild(RULE_FUNCTION_NAME);
            const ruleParametersNode = statementTypeNode.getChild(RULE_CALL_PARAMETERS);
            if (timeNode && directiveNode && functionNameNode) {
              return [
                timeNode,
                directiveNode,
                undefined /* reserved for engine number */,
                functionNameNode,
                ruleParametersNode ?? undefined,
              ];
            }
            break;
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
        if (cellToken) {
          if (columnIndex === 1 && ![RULE_VM_MANAGEMENT, RULE_ISSUE].includes(cellToken.parent?.name ?? '')) {
            return maxSoFar;
          }
          return Math.max(maxSoFar, cellToken.to - cellToken.from);
        }
        return maxSoFar;
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

    // don't insert whitespace after last token
    const lineWithoutLastColumn = line.slice(0, line.length - 1);
    const insertions: (ChangeSpec | null)[] = lineWithoutLastColumn.map(
      (node: SyntaxNode | undefined, columnNumber: number) => {
        if (!node) {
          // no node, fill with engine width plus one space
          const priorNode = line.slice(0, columnNumber).findLast(otherNode => !!otherNode);
          if (priorNode) {
            return {
              from: priorNode.to,
              insert: ' '.repeat(widths[columnNumber] + 1),
            };
          }

          return null;
        }

        const length = node.to - node.from;
        const pad = widths[columnNumber] - length;
        if (pad <= 0) {
          return null;
        }
        return {
          from: node.to,
          insert: ' '.repeat(pad),
        };
      },
    );

    // TODO: delete end of line whitespace

    return [...deletions, ...insertions];
  });

  const changes = maybeChanges.filter((maybeChange): maybeChange is ChangeSpec => !!maybeChange);

  view.update([
    state.update({
      changes,
    }),
  ]);
}
