import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { parser } from './vml.grammar';

export const VmlLanguage = LRLanguage.define({
  // languageData: {
  //   commentTokens: { line: '#' },
  // },
  parser: parser.configure({
    props: [
      // indentNodeProp.add({
      //   Application: delimitedIndent({ align: false, closing: ')' }),
      // }),
      // foldNodeProp.add({
      //   Application: foldInside,
      //   Command: customFoldInside,
      // }),
      // styleTags({
      //   Boolean: t.bool,
      //   GenericDirective: t.namespace,
      //   Global: t.namespace,
      //   HardwareCommands: t.namespace,
      //   IdDeclaration: t.namespace,
      //   ImmediateCommands: t.namespace,
      //   LineComment: t.comment,
      //   LoadAndGoDirective: t.namespace,
      //   LocalDeclaration: t.namespace,
      //   MetaEntry: t.namespace,
      //   Model: t.namespace,
      //   ParameterDeclaration: t.namespace,
      //   Stem: t.keyword,
      //   String: t.string,
      //   TimeAbsolute: t.className,
      //   TimeComplete: t.className,
      //   TimeEpoch: t.className,
      //   TimeRelative: t.className,
      // }),
    ],
  }),
});

export function setupLanguageSupport(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = VmlLanguage.data.of({ autocomplete });
    return new LanguageSupport(VmlLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(VmlLanguage);
  }
}
