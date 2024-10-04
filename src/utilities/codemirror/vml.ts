import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp, syntaxTree } from '@codemirror/language';
import { Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import { EditorView } from 'codemirror';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import { RULE_TIME_TAGGED_STATEMENT } from './vml-constants';
import { computeBlocks, isBlockCommand, vmlBlockFolder } from './vml-folder';
import { parser } from './vml.grammar';

const blockMark = Decoration.mark({ class: 'cm-block-match' });

export const blockTheme = EditorView.baseTheme({
  '.cm-block-match': {
    outline: '1px dashed',
  },
});

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode) => ReturnType<typeof foldInside>;
} = {
  // only called on multi-line rules, may need custom service to handle FOR, WHILE, etc.
  Body: foldInside,
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

export function vmlHighlightBlock(viewUpdate: ViewUpdate): SyntaxNode[] {
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

export const vmlBlockHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor() {
      this.decorations = Decoration.none;
    }
    update(viewUpdate: ViewUpdate): DecorationSet | null {
      if (viewUpdate.selectionSet || viewUpdate.docChanged || viewUpdate.viewportChanged) {
        const blocks = vmlHighlightBlock(viewUpdate);
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
