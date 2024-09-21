import { LanguageSupport, LRLanguage } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import { styleTags } from '@lezer/highlight';
import type {
  CommandDictionary,
  Enum,
  FswCommand,
  FswCommandArgument,
  FswCommandArgumentEnum,
  FswCommandArgumentInteger,
  Header,
} from '@nasa-jpl/aerie-ampcs';
import { parser } from './cdl.grammar';

export const TOKEN_ERROR = '⚠';
const PROJECT = 'Project';
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
    mission_name: unquote(getNodeText(contents, header.getChild(PROJECT)?.getChild(TOKEN_STRING))),
    schema_version: 'cdl', // TODO: see if available in dictionary
    spacecraft_ids: [0], // TODO: see if available in dictionary
    version: unquote(getNodeText(contents, header.getChild(VERSION)?.getChild(TOKEN_STRING))),
  };
}

function unquote(s: string): string {
  return s.substring(1, s.length - 1);
}

export function parseCdlDictionary(contents: string): CommandDictionary | null {
  const parsed = CdlLanguage.parser.parse(contents);
  const cdlProgram = parsed.topNode.cursor().node;

  let header: Header | undefined = undefined;
  const headerNode = cdlProgram.getChild('Header');
  if (headerNode) {
    header = parseHeader(contents, headerNode);
  }

  const argumentMap: { [name: string]: FswCommandArgument } = {};
  const enums: Enum[] = [];
  const globalDefinitionsNode = cdlProgram.getChild('Global_definitions');
  if (globalDefinitionsNode) {
    const cursor = globalDefinitionsNode.cursor();
    do {
      const { node } = cursor;
      switch (node.type.name) {
        case 'Lookup_argument_definition':
          {
            const argEnum: [FswCommandArgumentEnum, Enum] | null = parseLookupArgument(contents, node);
            if (argEnum) {
              enums.push(argEnum[1]);
              argumentMap[argEnum[0].name] = argEnum[0];
            }
          }
          break;
        case 'Numeric_argument_definition':
          {
            const arg = parseNumericArgument(contents, node);
            if (arg) {
              argumentMap[arg.name] = arg;
            }
          }
          break;
      }
    } while (cursor.next());
  }

  const fswCommands: FswCommand[] = [];
  // const processingRoutinesNode =cdlProgram.getChild('Processing_routines');
  // if (processingRoutinesNode) {
  //   console.log(`${new Date()} -- ${processingRoutinesNode.type.name}`);
  //   //   const cursor = cdlProgram.cursor();
  //   //   do {
  //   //     const { node } = cursor;
  //   //     console.log(`${new Date()} -- ${node.type.name}`);
  //   //     switch (node.type.name) {
  //   //       case 'Processing_routine':
  //   //         fswCommands.push(parseStem(contents, node));
  //   //     }
  //   //   } while (cursor.next());
  // }
  // (cdlProgram.getChild('Processing_routines')?.getChildren('Processing_routine') ?? []).forEach(
  //   processingRoutineNode => {
  //     const child = processingRoutineNode.firstChild;
  //     if (child?.name === 'Stem_subroutine') {
  //       // console.log(`${new Date()} -- ${child.type.name}`);
  //       fswCommands.push(parseStem(contents, child));
  //     }

  //     // switch (processingRoutineNode.name) {
  //     //   case 'Stem_subroutine':
  //     //     fswCommands.push(parseStem(contents, node));
  //     // }
  //   },
  // );

  const tokenCounts = new Map<string, number>();
  {
    const cursor = parsed.cursor();
    do {
      const tokenType = cursor.node.type.name;
      if (!tokenCounts.has(tokenType)) {
        tokenCounts.set(tokenType, 1);
      } else {
        tokenCounts.set(tokenType, 1 + tokenCounts.get(tokenType)!);
      }
    } while (cursor.next());
  }
  console.log(tokenCounts);
  console.log(Object.keys(argumentMap));

  // { const cursor = parsed.cursor();
  //   do {
  //     const { node } = cursor;
  //     const tokenType = node.type.name;
  //     // if (node.name !== TOKEN_ERROR) {
  //     //   // console.log();
  //     // }
  //     if (!tokenCounts.has(tokenType)) {
  //       tokenCounts.set(tokenType, 1);
  //     } else {
  //       tokenCounts.set(tokenType, 1 + tokenCounts.get(tokenType)!);
  //     }
  //   } while (cursor.next());
  // }

  if (header) {
    return {
      enumMap: Object.fromEntries(enums.map(e => [e.name, e])),
      enums,
      fswCommandMap: Object.fromEntries(fswCommands.map(cmd => [cmd.stem, cmd])),
      fswCommands,
      header,
      // hardware commands aren't specifically called out in CDL
      hwCommandMap: {},
      hwCommands: [],
      id: 'placeholder_id',
      path: 'placeholder_path',
    };
  }
  return null;
}

export function parseLookupArgument(
  contents: string,
  lookupArgumentDefinition: SyntaxNode,
): [FswCommandArgumentEnum, Enum] | null {
  const name = getNodeText(contents, lookupArgumentDefinition.getChild('Lookup_argument_start')?.getChild('Name'));
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

  return null;
}

export function parseNumericArgument(
  contents: string,
  numericArgumentDefinition: SyntaxNode,
): FswCommandArgumentInteger | null {
  const name = getNodeText(
    contents,
    numericArgumentDefinition.getChild('Numeric_argument_definition_start')?.getChild('Name'),
  );
  if (name) {
    // TODO: Use conversion to determine base for range
    return {
      arg_type: 'integer',
      bit_length: null,
      default_value: null,
      description: '', // use title
      name: name,
      range: null,
      units: '',
    };
  }

  return null;
}

export function parseStem(contents: string, stem: SyntaxNode): FswCommand {
  return {
    argumentMap: {},
    arguments: [],
    description: '',
    stem: getNodeText(contents, stem.getChild('Stem_start')?.getChild('Stem_name')),
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
