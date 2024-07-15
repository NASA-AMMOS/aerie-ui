import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp } from '@codemirror/language';
import { linter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './vml.grammar';

export const TOKEN_ERROR = '⚠';

export const TOKEN_WAIT = 'WAIT';
export const TOKEN_WAIT_CHANGE = 'WAIT_CHANGE';

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode, _state: EditorState) => ReturnType<typeof foldInside>;
} = {
  Block: foldInside,
  Body: foldInside,
  Common_Function: foldInside,
  For_statement: function (node: SyntaxNode, _state: EditorState) {
    if (node?.name === 'For_Statement') {
      const cursor = node.cursor();
      do {
        const { node: closeNode } = cursor;
        if (closeNode.type.name === 'End_for') {
          return {
            from: node.from,
            to: closeNode.to,
          };
        }
      } while (cursor.next());
    }
    return null;
  },
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
  return linter(() => []);
}
