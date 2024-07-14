import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { linter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './vml.grammar';

export const TOKEN_ERROR = '⚠';

export const TOKEN_WAIT = 'WAIT';
export const TOKEN_WAIT_CHANGE = 'WAIT_CHANGE';

export const VmlLanguage = LRLanguage.define({
  languageData: {
    commentTokens: { line: ';' },
  },
  parser: parser.configure({
    props: [
      // indentNodeProp.add({
      //   Application: delimitedIndent({ align: false, closing: ')' }),
      // }),
      // foldNodeProp.add({
      //   Application: foldInside,
      //   Command: customFoldInside,
      // }),
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
        DO: t.keyword,
        DOUBLE_CONST: t.number,
        ELSE: t.keyword,
        ELSE_IF: t.keyword,
        END_BODY: t.namespace,
        END_FOR: t.keyword,
        END_IF: t.keyword,
        END_MODULE: t.namespace,
        END_WHILE: t.keyword,
        FOR: t.keyword,
        FULL_TIME_CONST: t.className,
        HEX_CONST: t.number,
        IF: t.keyword,
        INPUT: t.keyword,
        INT_CONST: t.number,
        MODULE: t.namespace,
        MODULO: t.arithmeticOperator,
        MULTIPLY: t.arithmeticOperator,
        POWER: t.arithmeticOperator,
        RETURN: t.keyword,
        SHORT_TIME_CONST: t.className,
        SPACECRAFT_TIME_CONST: t.className,
        STRING_CONST: t.string,
        SUBTRACT: t.arithmeticOperator,
        THEN: t.keyword,
        TIMEOUT: t.keyword,
        UINT_CONST: t.number,
        WAIT: t.keyword,
        WHILE: t.keyword,
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
