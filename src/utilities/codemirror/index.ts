import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { customFoldInside } from './custom-folder';
import { parser } from './sequence.grammar';

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
        Activate: t.namespace,
        Boolean: t.bool,
        Engine: t.namespace,
        Epoch: t.namespace,
        GenericDirective: t.namespace,
        Global: t.namespace,
        GroundBlock: t.namespace,
        GroundEvent: t.namespace,
        HardwareCommands: t.namespace,
        IdDeclaration: t.namespace,
        ImmediateCommands: t.namespace,
        LineComment: t.comment,
        Load: t.namespace,
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

export function setupLanguageSupport(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = SeqLanguage.data.of({ autocomplete });
    return new LanguageSupport(SeqLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(SeqLanguage);
  }
}
