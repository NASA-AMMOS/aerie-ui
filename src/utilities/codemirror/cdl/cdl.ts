import { LanguageSupport, LRLanguage } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import { styleTags } from '@lezer/highlight';
import type { FswCommand, Header } from '@nasa-jpl/aerie-ampcs';
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

export function parseHeader(_contents: string, _header: SyntaxNode): Header {
  return {
    mission_name: getNodeText(_contents, _header.getChild('Project')?.getChild('String')),
    schema_version: 'cdl', // TODO: see if available in dictionary
    spacecraft_ids: [0], // TODO: see if available in dictionary
    version: getNodeText(_contents, _header.getChild('Version')?.getChild('String')),
  };
}

export function parseStem(contents: string, stem: SyntaxNode): FswCommand {
  return {
    argumentMap: {},
    arguments: [],
    description: '',
    stem: getNodeText(contents, stem.getChild('Stem_subroutine')?.getChild('Stem_start')?.getChild('Stem_name')),
    type: 'fsw_command',
  };
}

function getNodeText(contents: string, node: SyntaxNode | null | undefined): string {
  if (!node) {
    return '';
  }
  return contents.slice(node.from, node.to);
}

setupCdlLanguageSupport();
