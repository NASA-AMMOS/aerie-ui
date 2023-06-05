/**
 * Random Notes
 *
 * This website is really helpful: https://ts-ast-viewer.com/
 *
 * As a rule of thumb, doing `node.forEachChildren(child => {})` gives you a cleaner set of children
 *  - Seems to remove some somewhat extranous nodes (those that unwrap to the same things)
 *  - "Iterates all the child nodes that are properties of the node"
 * On the other hand, ".getChildren() - Returns all the children including the all the tokens (ex. OpenBraceToken, SemiColonToken etc.)"
 *
 * This may or may not be what you want!! But it should be useful regardless
 */

import type { CommandDictionary, EnumMap, FswCommand } from '@nasa-jpl/aerie-ampcs';
import tsc, { SyntaxKind } from 'typescript';
import type { Diagnostic as ResponseDiagnostic } from '../types/monaco-internal';
import { makeDiagnostic, validateArguments } from './worker_helpers';

export enum CustomCodes {
  InvalidAbsoluteTimeString = -1,
  InvalidRelativeTimeString = -2,
  UncaughtArgumentType = -3,
  InvalidInteger = -4,
  InvalidUnsignedInteger = -5,
  InvalidFloat = -6,
}

export function generateSequencingDiagnostics(
  fileName: string,
  languageService: tsc.LanguageService,
): ResponseDiagnostic[] {
  return [
    ...generateRelativeTimeStringDiagnostics(fileName, languageService),
    ...generateAbsoluteTimeStringDiagnostics(fileName, languageService),
  ];
}

/**
 * Creates a list of all descents of the given node matching the selector, recursively
 * @param node The tsc Node we want to use as our root
 * @param selector A selector function run on every recursive child Node
 * @returns A list of nodes matching the selector
 */
function getDescendants(node: tsc.Node, selector: (node: tsc.Node) => boolean): tsc.Node[] {
  const selectedNodes = [];
  if (selector(node)) {
    selectedNodes.push(node);
  }
  for (const child of node.getChildren()) {
    selectedNodes.push(...getDescendants(child, selector));
  }
  return selectedNodes;
}

/**
 * Find the first parent (closest up the tree) from our node that matches the selector
 *
 * @param node The node to use as the root
 * @param selector A selector function which runs on every parent node
 * @returns The closest parent matching the selector or undefined if no match found
 */
function getFirstInParent(node: tsc.Node, selector: (node: tsc.Node) => boolean): tsc.Node | undefined {
  if (selector(node)) {
    return node;
  }

  if (node.parent === undefined) {
    return undefined;
  } else {
    return getFirstInParent(node.parent, selector);
  }
}

const DOY_REGEX = /^(\d{4})-(\d{3})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?$/;
const HMS_REGEX = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?$/;

function generateRelativeTimeStringDiagnostics(
  fileName: string,
  languageService: tsc.LanguageService,
): ResponseDiagnostic[] {
  const diagnostics: ResponseDiagnostic[] = [];

  const program = languageService.getProgram();
  if (program === undefined) {
    return [];
  }
  const typechecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    return [];
  }
  const sourceFileSymbol = typechecker.getSymbolAtLocation(sourceFile)?.getDeclarations()?.[0] as
    | tsc.SourceFile
    | undefined;

  if (sourceFileSymbol === undefined) {
    return [];
  }

  const relativeTimeNodes = getDescendants(
    sourceFileSymbol,
    node =>
      tsc.isIdentifier(node) &&
      (node.escapedText === 'E' || node.escapedText === 'R') &&
      (tsc.isTaggedTemplateExpression(node.parent) || tsc.isCallExpression(node.parent)),
  ).map(node => node.parent);

  for (const relativeTimeNode of relativeTimeNodes) {
    if (tsc.isTaggedTemplateExpression(relativeTimeNode)) {
      if (tsc.isNoSubstitutionTemplateLiteral(relativeTimeNode.template)) {
        if (!HMS_REGEX.test(relativeTimeNode.template.text)) {
          diagnostics.push({
            category: tsc.DiagnosticCategory.Error,
            code: CustomCodes.InvalidRelativeTimeString,
            file: { fileName: sourceFile.fileName },
            length: relativeTimeNode.template.getEnd() - relativeTimeNode.template.getStart(sourceFile),
            messageText: `Incorrectly formatted relative time string. Expected format: hh:mm:ss[.sss]`,
            start: relativeTimeNode.template.getStart(sourceFile),
          });
        }
      }
    } else if (tsc.isCallExpression(relativeTimeNode)) {
      const firstArg = relativeTimeNode.arguments[0];
      if (tsc.isStringLiteral(firstArg) || tsc.isNoSubstitutionTemplateLiteral(firstArg)) {
        if (!HMS_REGEX.test(firstArg.text)) {
          diagnostics.push({
            category: tsc.DiagnosticCategory.Error,
            code: CustomCodes.InvalidRelativeTimeString,
            file: { fileName: sourceFile.fileName },
            length: firstArg.getEnd() - firstArg.getStart(sourceFile),
            messageText: `Incorrectly formatted relative time string. Expected format: hh:mm:ss[.sss]`,
            start: firstArg.getStart(sourceFile),
          });
        }
      }
    }
  }

  return diagnostics;
}

function generateAbsoluteTimeStringDiagnostics(
  fileName: string,
  languageService: tsc.LanguageService,
): ResponseDiagnostic[] {
  const diagnostics: ResponseDiagnostic[] = [];

  const program = languageService.getProgram();
  if (program === undefined) {
    return [];
  }
  const typechecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    return [];
  }
  const sourceFileSymbol = typechecker.getSymbolAtLocation(sourceFile)?.getDeclarations()?.[0] as
    | tsc.SourceFile
    | undefined;

  if (sourceFileSymbol === undefined) {
    return [];
  }

  const absoluteTimeNodes = getDescendants(
    sourceFileSymbol,
    node =>
      tsc.isIdentifier(node) &&
      node.escapedText === 'A' &&
      (tsc.isTaggedTemplateExpression(node.parent) || tsc.isCallExpression(node.parent)),
  ).map(node => node.parent);

  for (const absoluteTimeNode of absoluteTimeNodes) {
    if (tsc.isTaggedTemplateExpression(absoluteTimeNode)) {
      if (tsc.isNoSubstitutionTemplateLiteral(absoluteTimeNode.template)) {
        if (!DOY_REGEX.test(absoluteTimeNode.template.text)) {
          diagnostics.push({
            category: tsc.DiagnosticCategory.Error,
            code: CustomCodes.InvalidAbsoluteTimeString,
            file: { fileName: sourceFile.fileName },
            length: absoluteTimeNode.template.getEnd() - absoluteTimeNode.template.getStart(sourceFile),
            messageText: `Incorrectly formatted absolute time string. Expected format: YYYY-DOYThh:mm:ss[.sss]`,
            start: absoluteTimeNode.template.getStart(sourceFile),
          });
        }
      }
    } else if (tsc.isCallExpression(absoluteTimeNode)) {
      const firstArg = absoluteTimeNode.arguments[0];
      if (tsc.isStringLiteral(firstArg) || tsc.isNoSubstitutionTemplateLiteral(firstArg)) {
        if (!DOY_REGEX.test(firstArg.text)) {
          diagnostics.push({
            category: tsc.DiagnosticCategory.Error,
            code: CustomCodes.InvalidAbsoluteTimeString,
            file: { fileName: sourceFile.fileName },
            length: firstArg.getEnd() - firstArg.getStart(sourceFile),
            messageText: `Incorrectly formatted absolute time string. Expected format: YYYY-DOYThh:mm:ss[.sss]`,
            start: firstArg.getStart(sourceFile),
          });
        }
      }
    }
  }

  return diagnostics;
}

function parentNodeKinds(node: tsc.Node): [string, string][] {
  if (node.parent === undefined) {
    return [];
  }
  return [...parentNodeKinds(node.parent), [SyntaxKind[node.kind], node.getText()]];
}

function childNodeKinds(node: tsc.Node): [string, string][] {
  const children = node.getChildren();

  return [[SyntaxKind[node.kind], node.getText()], ...children.flatMap(child_node => childNodeKinds(child_node))];
}

function findNodeWithParentOfKind(node: tsc.Node, kind: SyntaxKind): tsc.Node | undefined {
  if (node.parent === undefined) {
    return undefined;
  }

  if (node.parent.kind === kind) {
    return node;
  }

  return findNodeWithParentOfKind(node.parent, kind);
}

function findNextChildOfKind(
  node: tsc.Node,
  kind: SyntaxKind,
  filter: (this_node: tsc.Node) => boolean,
): tsc.Node | undefined {
  const children = node.getChildren();

  if (node.kind === kind) {
    return node;
  }

  if (children.length === 0) {
    return undefined;
  }

  return children
    .filter(child => filter(child))
    .map(child => findNextChildOfKind(child, kind, filter))
    .reverse()
    .find(child => child !== undefined);
}

/**
 * Find a list of all command nodes (at the level of C.COMMAND_NAME)
 *                                                     ^^^^^^^^^^^^
 * @param sourceFile The root node to start looking under
 * @returns The list of command nodes, all the way back at the time elements
 */
function findCommandNodes(sourceFile: tsc.Node): tsc.Node[] {
  return getDescendants(
    sourceFile,
    node =>
      tsc.isIdentifier(node) &&
      (((node.escapedText === 'E' || node.escapedText === 'R' || node.escapedText === 'A') &&
        (tsc.isTaggedTemplateExpression(node.parent) || tsc.isCallExpression(node.parent))) ||
        (node.escapedText === 'C' && tsc.isIdentifier(node))),
  ).map(command_node_timestamp =>
    getFirstInParent(command_node_timestamp, node => {
      const siblings = node.getChildren();

      return siblings[1]?.kind === SyntaxKind['DotToken'] && siblings[2]?.kind === SyntaxKind['Identifier'];
    }),
  );
}

/**
 * Given some argument to a command, process it.
 *
 * Processes a single object, string, number, or similar. Objects can have many properites, each of which is checked independantly.
 * @param argument The `tsc.Expression` that this argument acutally is
 * @param commandName The name of this command as a string
 * @param commandNode The command node
 * @returns
 */
function processCommandArgument(
  argument: tsc.Expression,
  commandName: string,
  commandNode: tsc.Node,
  commandDictEntry: FswCommand,
  enumMap: EnumMap,
  sourceFile: tsc.SourceFile,
): ResponseDiagnostic[] {
  if (tsc.isObjectLiteralExpression(argument)) {
    // If the arg is a string literal, we need to strip quotes
    const discoveredArgs = argument.properties.filter(tsc.isPropertyAssignment);
    const expectedArgMap = commandDictEntry.argumentMap;
    const diagnostics = validateArguments(discoveredArgs, expectedArgMap, enumMap, sourceFile);
    console.log({ discoveredArgs, expectedArgMap, foundDiagnostics: diagnostics });
    return diagnostics;
  } else if (tsc.isStringLiteral(argument)) {
    if (commandName === 'GROUND_EVENT') {
      return [];
    } else {
      console.error('Found a command with an argument of an uncaught type', commandNode.getText(), argument.getText());
      return [
        makeDiagnostic(
          'Uncaught argument object property type',
          CustomCodes.UncaughtArgumentType,
          sourceFile,
          argument,
        ),
      ];
    }
  } else {
    console.error('Found a command with an argument of an uncaught type', commandNode.getText(), argument.getText());
    return [makeDiagnostic('Uncaught argument type', CustomCodes.UncaughtArgumentType, sourceFile, argument)];
  }
}

/**
 * Generate diagnostics
 *
 * Extracts the commands by starting with the timing letters and recursing up the parent tree
 *
 * Let -> represent "access parent"
 *
 * A, E, R all work like this:
 *  A -> A("time") -> A("time").COMMAND -> A("time").COMMAND({args})
 *
 * C works like this:
 *  C -> C.COMMAND -> C.COMMAND({args})
 *
 * Any node (.*)\.COMMAND has the children:
 *  [$1.kind ($1), DotToken (.), Identifier (COMMAND)]
 * And we can match on that!!
 * The first setup that looks like this up the parent tree will always be the command.
 *
 * Furthermore, the parent of this node will have the SyntaxList where the text will be the string of an object.
 *  We should parse this into an object and validate that every key:
 *  1. Is supposed to be there
 *  2. Is within the correct range
 *
 * @param sourceFile The starting point for analysis
 */
function diagnoseBottomUp(sourceFile: tsc.SourceFile, commandDict: CommandDictionary): ResponseDiagnostic[] {
  // Finds a node of the format `(.*)\.COMMAND`
  // It should be a PropertyAccessExpression
  const commandNodes = findCommandNodes(sourceFile).filter(node => tsc.isPropertyAccessExpression(node));

  let diagnostics = [];

  for (const commandNode of commandNodes) {
    // The command name will be the identifier child
    const commandName = commandNode.getChildren().reverse().find(tsc.isIdentifier);

    if (commandName === undefined) {
      console.error('Found a bad command node: ', commandNode.getText());
      continue;
    }

    const commandDictEntry = commandDict.fswCommandMap[commandName.getText()];

    if (commandDictEntry === undefined) {
      console.error('Failed to find a command dict entry for command', commandName.getText());
    }

    // The parent of the commandNode will be a CallExpression (in the case of `C.COMMAND_NAME(...)`)
    //  Or it won't (in the no argument + no call case)
    // Note that it doesn't matter if arguments or properites are missing or not - tsc will handle that for us.
    if (tsc.isCallExpression(commandNode.parent)) {
      const commandCall = commandNode.parent;
      const command_arguments = commandCall.arguments;
      const this_diagnostics: ResponseDiagnostic[] = command_arguments.flatMap(argument => {
        return processCommandArgument(
          argument,
          commandName.getText(),
          commandNode,
          commandDictEntry,
          commandDict.enumMap,
          sourceFile,
        );
      });

      diagnostics = [...diagnostics, ...this_diagnostics];

      // console.log(
      //   'Found a command with arguments',
      //   command_arguments.map(arg => arg.getText()),
      //   commandDictEntry.arguments,
      // );
    } else {
      // The case where the function isn't called and it's just a bare command
      console.log('Found a bare command', commandName.escapedText);
      // Validate that we expected this
    }
  }

  console.log({ diagnostics });

  return diagnostics;
}

/**
 * Find validation issues with a particular file and it's command dict
 *
 * Assumptions:
 *  Command arguments will all be basic types (objects, strings, numbers, etc)
 *    -> NOT IIFEs or function executions
 *
 *
 *
 * @param fileName The internal name of a file, used to get the symbols
 * @param languageService The TS langauge service. comes from the worker
 * @param commandDict The command dict relevant to this file
 * @returns A set of diagnostics
 */
export function generateValidationDiagnostics(
  fileName: string,
  languageService: tsc.LanguageService,
  commandDict: CommandDictionary,
): ResponseDiagnostic[] {
  const program = languageService.getProgram();
  if (program === undefined) {
    return [];
  }
  const typechecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    return [];
  }
  const sourceFileSymbol = typechecker.getSymbolAtLocation(sourceFile)?.getDeclarations()?.[0] as
    | tsc.SourceFile
    | undefined;

  if (sourceFileSymbol === undefined) {
    return [];
  }

  return diagnoseBottomUp(sourceFileSymbol, commandDict);
}
