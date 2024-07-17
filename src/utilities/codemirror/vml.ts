import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp, syntaxTree } from '@codemirror/language';
import { linter, type Diagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './vml.grammar';

export const TOKEN_ERROR = '⚠';

export const TOKEN_WAIT = 'WAIT';
export const TOKEN_WAIT_CHANGE = 'WAIT_CHANGE';

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode, _state: EditorState) => ReturnType<typeof foldInside>;
} = {
  // only called on multi-line rules, may need custom service to handle FOR, WHILE, etc.
  Body: foldInside,
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
        SHORT_TIME_CONST: t.className,
        SPACECRAFT_TIME_CONST: t.className,
        STEP: t.controlKeyword,
        STRING_CONST: t.string,
        SUBTRACT: t.arithmeticOperator,
        THEN: t.controlKeyword,
        TIMEOUT: t.keyword,
        UINT_CONST: t.number,
        Variable_name: t.variableName,
        WAIT: t.keyword,
        WHILE: t.controlKeyword,
      }),
    ],
  }),
});

export function setupVmlLanguageSupport(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = VmlLanguage.data.of({ autocomplete });
    return new LanguageSupport(VmlLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(VmlLanguage);
  }
}

export function vmlLinter(): Extension {
  return linter(view => {
    const diagnostics: Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    // const treeNode = tree.topNode;
    // const docText = view.state.doc.toString();
    diagnostics.push(...validateParserErrors(tree));
    return diagnostics;
  });
}

/**
 * Checks for unexpected tokens.
 *
 * @param tree
 * @returns
 */
function validateParserErrors(tree: Tree) {
  const diagnostics: Diagnostic[] = [];
  const MAX_PARSER_ERRORS = 100;
  tree.iterate({
    enter: node => {
      if (node.name === TOKEN_ERROR && diagnostics.length < MAX_PARSER_ERRORS) {
        const { from, to } = node;
        diagnostics.push({
          from,
          message: `Unexpected token`,
          severity: 'error',
          to,
        });
      }
    },
  });
  return diagnostics;
}
