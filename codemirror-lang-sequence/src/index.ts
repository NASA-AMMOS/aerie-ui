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
  languageData: {
    commentTokens: { line: '#' },
  },
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({ align: false, closing: ')' }),
      }),
      foldNodeProp.add({
        Application: foldInside,
        Command: customFoldInside,
      }),
      styleTags({
        Boolean: t.bool,
        GenericDirective: t.namespace,
        Global: t.namespace,
        HardwareCommands: t.namespace,
        IdDeclaration: t.namespace,
        ImmediateCommands: t.namespace,
        LineComment: t.comment,
        LoadAndGoDirective: t.namespace,
        LocalDeclaration: t.namespace,
        MetaEntry: t.namespace,
        Model: t.namespace,
        ParameterDeclaration: t.namespace,
        Stem: t.keyword,
        String: t.string,
        TimeAbsolute: t.className,
        TimeComplete: t.className,
        TimeEpoch: t.className,
        TimeRelative: t.className,
      }),
    ],
  }),
});

export function seq(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = SeqLanguage.data.of({ autocomplete });
    return new LanguageSupport(SeqLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(SeqLanguage);
  }
}
