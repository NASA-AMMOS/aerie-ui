import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './sequence.grammar';
import { customFoldInside } from './utilities/custom-folder';

export const SeqLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({ closing: ')', align: false }),
      }),
      foldNodeProp.add({
        Application: foldInside,
      }),
      styleTags({
        Boolean: t.bool,
        Identifier: t.variableName,
        Local: t.keyword,
        LineComment: t.lineComment,
        Enum: t.labelName,
        Global: t.keyword,
        Number: t.number,
        Param: t.keyword,
        String: t.string,
        TimeTagAbsolute: t.keyword,
        TimeTagComplete: t.keyword,
        TimeTagEpoch: t.keyword,
        TimeTagRelative: t.keyword,
        TimeAbsolute: t.keyword,
        TimeRelative: t.keyword,
        VarName: t.variableName,
        VarTypeFloat: t.typeName,
        VarTypeInt: t.typeName,
        VarTypeString: t.typeName,
        VarTypeUint: t.typeName,
        VarTypeEnum: t.typeName,
        '( )': t.paren,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '#' },
  },
});

export function seq(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = SeqLanguage.data.of({ autocomplete });
    return new LanguageSupport(SeqLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(SeqLanguage);
  }
}
