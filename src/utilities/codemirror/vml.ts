import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp, syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import { EditorView } from 'codemirror';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import { RULE_TIME_TAGGED_STATEMENT, TOKEN_ERROR } from './vml-constants';
import { computeBlocks, isBlockCommand, vmlBlockFolder } from './vml-folder';
import { parser } from './vml.grammar';

const blockMark = Decoration.mark({ class: 'cm-block-match' });

export const blockTheme = EditorView.baseTheme({
  '.cm-block-match': {
    outline: '1px dashed',
  },
});

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode, _state: EditorState) => ReturnType<typeof foldInside>;
} = {
  // only called on multi-line rules, may need custom service to handle FOR, WHILE, etc.
  Body: foldInside,
  // If: foldInside,
  VML_HEADER: foldInside,
};

export const VmlLanguage = LRLanguage.define({
  languageData: {
    commentTokens: { line: ';' },
  },
  parser: parser.configure({
    props: [
      foldNodeProp.add(FoldBehavior),
      styleTags({
        ADD: t.arithmeticOperator,
        ASSIGNMENT: t.updateOperator,
        BLOCK: t.namespace,
        BODY: t.namespace,
        Comment: t.comment,
        DAY_TIME_CONST: t.className,
        DECLARE: t.keyword,
        DELAY_BY: t.keyword,
        DIVIDE: t.arithmeticOperator,
        DO: t.controlKeyword,
        DOUBLE_CONST: t.number,
        ELSE: t.controlKeyword,
        ELSE_IF: t.controlKeyword,
        END_BODY: t.namespace,
        END_FOR: t.controlKeyword,
        END_IF: t.controlKeyword,
        END_MODULE: t.namespace,
        END_WHILE: t.controlKeyword,
        FOR: t.controlKeyword,
        FULL_TIME_CONST: t.className,
        HEX_CONST: t.number,
        IF: t.controlKeyword,
        INPUT: t.keyword,
        INT_CONST: t.number,
        MODULE: t.namespace,
        MODULO: t.arithmeticOperator,
        MULTIPLY: t.arithmeticOperator,
        POWER: t.arithmeticOperator,
        RETURN: t.keyword,
        SEQUENCE: t.macroName,
        SHORT_TIME_CONST: t.className,
        SPACECRAFT_TIME_CONST: t.className,
        STEP: t.controlKeyword,
        STRING_CONST: t.string,
        SUBTRACT: t.arithmeticOperator,
        THEN: t.controlKeyword,
        TIMEOUT: t.keyword,
        UINT_CONST: t.number,
        VML_EOF: t.docComment,
        VML_HEADER: t.docComment,
        Variable_name: t.variableName,
        WAIT: t.keyword,
        WHILE: t.controlKeyword,
      }),
    ],
  }),
});

export function setupVmlLanguageSupport(
  autocomplete?: (context: CompletionContext) => CompletionResult | null,
): LanguageSupport {
  if (autocomplete) {
    const autocompleteExtension = VmlLanguage.data.of({ autocomplete });
    return new LanguageSupport(VmlLanguage, [vmlBlockFolder, autocompleteExtension]);
  } else {
    return new LanguageSupport(VmlLanguage, [vmlBlockFolder]);
  }
}

export function highlightBlock(viewUpdate: ViewUpdate): SyntaxNode[] {
  const tree = syntaxTree(viewUpdate.state);
  const selectionLine = viewUpdate.state.doc.lineAt(viewUpdate.state.selection.asSingle().main.from);
  const leadingWhiteSpaceLength = selectionLine.text.length - selectionLine.text.trimStart().length;
  const updatedSelectionNode = tree.resolveInner(selectionLine.from + leadingWhiteSpaceLength, 1);
  // walk up the tree to Time_tagged_statement, and then back down to the block command e.g. "ELSE"
  const timeTaggedNode = getNearestAncestorNodeOfType(updatedSelectionNode, [RULE_TIME_TAGGED_STATEMENT]);
  const statementNode = timeTaggedNode?.firstChild?.nextSibling?.firstChild;
  if (!statementNode || !isBlockCommand(statementNode.name)) {
    return [];
  }

  const stemNode = statementNode.firstChild;
  if (!stemNode) {
    return [];
  }

  const blocks = computeBlocks(viewUpdate.state);
  if (!blocks) {
    return [];
  }

  const pairs = Object.values(blocks);
  const matchedNodes: SyntaxNode[] = [stemNode];

  // when cursor on end -- select else and if
  let current: SyntaxNode | undefined = timeTaggedNode;
  while (current) {
    current = pairs.find(block => block.end?.from === current!.from)?.start;
    const pairedStemToken = current?.firstChild?.nextSibling?.firstChild?.firstChild;
    if (pairedStemToken) {
      matchedNodes.push(pairedStemToken);
    }
  }

  // when cursor on if -- select else and end
  current = timeTaggedNode;
  while (current) {
    current = pairs.find(block => block.start?.from === current!.from)?.end;
    const pairedStemToken = current?.firstChild?.nextSibling?.firstChild?.firstChild;
    if (pairedStemToken) {
      matchedNodes.push(pairedStemToken);
    }
  }

  return matchedNodes;
}

export const blockHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor() {
      this.decorations = Decoration.none;
    }
    update(viewUpdate: ViewUpdate): DecorationSet | null {
      if (viewUpdate.selectionSet || viewUpdate.docChanged || viewUpdate.viewportChanged) {
        const blocks = highlightBlock(viewUpdate);
        this.decorations = Decoration.set(
          // codemirror requires marks to be in sorted order
          blocks.sort((a, b) => a.from - b.from).map(block => blockMark.range(block.from, block.to)),
        );
        return this.decorations;
      }
      return null;
    }
  },
  {
    decorations: viewPluginSpecification => viewPluginSpecification.decorations,
  },
);

type LineOfNodes = (SyntaxNode | undefined)[];

export function vmlFunction(view: EditorView) {
  const state = view.state;
  const tree = syntaxTree(state);

  const timeTaggedStatements: SyntaxNode[] = [];
  tree.iterate({
    enter: nodeRef => {
      if (nodeRef.name === 'Time_tagged_statement') {
        timeTaggedStatements.push(nodeRef.node);
      }
    },
  });

  // 0 - time
  // 1 - category
  // 2 - engine id (only present on 'Vm_management')
  // 3 - stem or block name
  // 4 - arguments

  const errorFreeTimeTaggedStatements = timeTaggedStatements.filter(node => {
    switch (node.getChild('Statement')?.firstChild?.name) {
      case 'Vm_management':
      case 'Issue': {
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

  const nodesByColumnn: LineOfNodes[] = errorFreeTimeTaggedStatements
    .map((statement): LineOfNodes | null => {
      const timeNode = statement.getChild('TIME_CONST');
      const statementTypeNode = statement.getChild('Statement')?.firstChild;
      if (statementTypeNode) {
        switch (statementTypeNode.name) {
          case 'Vm_management':
            {
              const directiveNode = statementTypeNode.firstChild?.firstChild;
              const engineNode = statementTypeNode.firstChild?.getChild('Simple_expr');
              const functionNameNode = statementTypeNode.firstChild?.getChild('Function_name');
              if (timeNode && directiveNode && engineNode) {
                return [timeNode, directiveNode, engineNode, functionNameNode ?? undefined];
              }
            }
            break;
          case 'Issue': {
            const directiveNode = statementTypeNode.firstChild;
            const functionNameNode = statementTypeNode.getChild('Function_name');
            if (timeNode && directiveNode && functionNameNode) {
              return [timeNode, directiveNode, undefined /* reserved for engine number */, functionNameNode];
            }
          }
        }
      }
      return null;
    })
    .filter((lineInfo): lineInfo is LineOfNodes => lineInfo !== null);

  const widths = nodesByColumnn.reduce(
    (prev, curr) => prev.map((p, i) => (curr[i] === undefined ? p : Math.max(p, curr[i].to - curr[i].from))),
    new Array(4).fill(0),
  );

  const indentation = [0];
  for (const width of widths) {
    indentation.push(width + indentation[indentation.length - 1] + 1);
  }

  const docText = state.toText(state.sliceDoc());

  const maybeChanges = nodesByColumnn.flatMap((line: LineOfNodes) => {
    const firstNode = line.find(maybeNode => !!maybeNode);
    if (firstNode === undefined) {
      // unexpected case of no nodes on line
      return [];
    }

    const commandLine = docText.lineAt(firstNode.from);

    const filteredArray = line.filter(maybeNode => !!maybeNode);
    const deletions: { from: number; to: number }[] = [];

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

  const changes = maybeChanges.filter(maybeChange => !!maybeChange);

  view.update([
    state.update({
      changes,
    }),
  ]);
}
