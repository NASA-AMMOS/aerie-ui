import { LanguageSupport, LRLanguage } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import { styleTags } from '@lezer/highlight';
import type { Enum, FswCommand, FswCommandArgumentEnum, Header } from '@nasa-jpl/aerie-ampcs';
import { parser } from './cdl.grammar';

export const TOKEN_ERROR = '⚠';
const PROJECT = 'PROJECT';
const VERSION = 'Version';
const TOKEN_STRING = 'String';

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

export function parseHeader(contents: string, header: SyntaxNode): Header {
  return {
    mission_name: getNodeText(contents, header.getChild(PROJECT)?.getChild(TOKEN_STRING)),
    schema_version: 'cdl', // TODO: see if available in dictionary
    spacecraft_ids: [0], // TODO: see if available in dictionary
    version: getNodeText(contents, header.getChild(VERSION)?.getChild(TOKEN_STRING)),
  };
}

// export type Enum = {
//   name: string;
//   values: EnumValue[];
// };
// export type EnumMap = {
//   [name: string]: Enum;
// };
// export type EnumValue = {
//   numeric: number | null;
//   symbol: string;
// };

function unquote(s: string): string {
  return s.substring(1, s.length - 1);
}

export function parseArgument(
  contents: string,
  lookupArgumentDefinition: SyntaxNode,
): [FswCommandArgumentEnum, Enum] | null {
  switch (lookupArgumentDefinition.name) {
    case 'Lookup_argument_definition':
      {
        const name = getNodeText(
          contents,
          lookupArgumentDefinition.getChild('Lookup_argument_start')?.getChild('Name'),
        );
        if (name) {
          // TODO: Use conversion to determine base
          const argEnum: Enum = {
            name: `${name}_enum`,
            values: (
              lookupArgumentDefinition
                .getChild('Lookup_argument_definition_clause_1')
                ?.getChildren('Lookup_argument_definition_clause_1_1') ?? []
            ).map(clause => ({
              numeric: parseInt(unquote(getNodeText(contents, clause.getChild('Number'))), 16),
              symbol: unquote(getNodeText(contents, clause.getChild('Value'))),
            })),
          };
          return [
            {
              arg_type: 'enum',
              bit_length: null,
              default_value: null,
              description: '', // use title
              enum_name: argEnum.name,
              name: name,
              range: null,
            },
            argEnum,
          ];
        }
      }

      break;
  }

  return null;
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
