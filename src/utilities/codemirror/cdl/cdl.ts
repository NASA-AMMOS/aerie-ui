import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { styleTags } from '@lezer/highlight';
import { parser } from './cdl.grammar';

export const TOKEN_ERROR = '⚠';

export const CdlLanguage = LRLanguage.define({
  languageData: {
    commentTokens: { line: '!' },
  },
  parser: parser.configure({
    props: [styleTags({})],
  }),
});

export function setupCdlLanguageSupport() {
  return new LanguageSupport(CdlLanguage);
}

setupCdlLanguageSupport();
