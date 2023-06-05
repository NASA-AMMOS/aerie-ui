import type { EnumMap, FswCommandArgumentMap, FswCommandArgumentNumeric, NumericRange } from '@nasa-jpl/aerie-ampcs';
import tsc, { SyntaxKind } from 'typescript';
import type { Diagnostic as ResponseDiagnostic } from '../types/monaco-internal';
import { CustomCodes } from './sequencingDiagnostics';

export function getSourceFileData(
  fileName: string,
  languageService: tsc.LanguageService,
): [tsc.SourceFile, tsc.SourceFile] | undefined {
  const program = languageService.getProgram();
  if (program === undefined) {
    return undefined;
  }
  const typechecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    return undefined;
  }

  const sourceFileSymbol = typechecker.getSymbolAtLocation(sourceFile)?.getDeclarations()?.[0] as
    | tsc.SourceFile
    | undefined;

  if (sourceFileSymbol === undefined) {
    return undefined;
  }

  return [sourceFile, sourceFileSymbol];
}

/**
 * Creates a list of all descents of the given node matching the selector, recursively
 * @param node The tsc Node we want to use as our root
 * @param selector A selector function run on every recursive child Node
 * @returns A list of nodes matching the selector
 */
export function getDescendants(node: tsc.Node, selector: (node: tsc.Node) => boolean): tsc.Node[] {
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
export function getFirstInParent(node: tsc.Node, selector: (node: tsc.Node) => boolean): tsc.Node | undefined {
  if (selector(node)) {
    return node;
  }

  if (node.parent === undefined) {
    return undefined;
  } else {
    return getFirstInParent(node.parent, selector);
  }
}

// Gets a model name as a string `model\d*`, which matches the syntax of `.getModel()`
export function getModelName(fileName: string): string {
  const regex = /^inmemory:\/\/model\/(\d*)$/;
  let result = '$model';
  result += fileName.match(regex)[1];
  console.log({ result });

  return result;
}

/**
 * A helpful debugging function to figure out the SyntaxKind of all child nodes of some given node.
 *
 * @param node A node to start on
 * @returns A tuple [SyntaxKind, node_text]
 */
export function parentNodeKinds(node: tsc.Node): [string, string][] {
  if (node.parent === undefined) {
    return [];
  }
  return [...parentNodeKinds(node.parent), [SyntaxKind[node.kind], node.getText()]];
}

export function childNodeKinds(node: tsc.Node): [string, string][] {
  const children = node.getChildren();

  return [[SyntaxKind[node.kind], node.getText()], ...children.flatMap(child_node => childNodeKinds(child_node))];
}

export function findNodeWithParentOfKind(node: tsc.Node, kind: SyntaxKind): tsc.Node | undefined {
  if (node.parent === undefined) {
    return undefined;
  }

  if (node.parent.kind === kind) {
    return node;
  }

  return findNodeWithParentOfKind(node.parent, kind);
}

export function findNextChildOfKind(
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

export function stripQuotes(input: string): string {
  return input.replaceAll(/["']/g, '');
}

export function zip<A, B>(arr1: Array<A>, arr2: B[]): [A, B][] {
  return arr1.map((k, i) => [k, arr2[i]]);
}

export function makeDiagnostic(
  message: string,
  code: CustomCodes,
  sourceFile: tsc.SourceFile,
  arg: tsc.Node,
): ResponseDiagnostic {
  return {
    category: tsc.DiagnosticCategory.Error,
    code,
    file: { fileName: sourceFile.fileName },
    length: arg.getEnd() - arg.getStart(sourceFile),
    messageText: message,
    start: arg.getStart(sourceFile),
  };
}

type ValidationReturn = string | false;

// Is it a number (not NAN or anything weird)
function isNumeric(str: string): ValidationReturn {
  // Both are needed: https://stackoverflow.com/a/175787
  return isNaN(Number(str)) || isNaN(parseFloat(str))
    ? `Argument is wrong type\n Got ${str} but expected a number`
    : false;
}

function rangeValidation(value: number, range: NumericRange | null): ValidationReturn {
  // If range is null, ignore
  return range !== null && (value > range.max || value < range.min)
    ? `Argument outside range\n Got ${value} but expected a number in range [${range.min}, ${range.max}]`
    : false;
}

function validateFloat(value: string, range: NumericRange | null): ValidationReturn {
  let error_string: ValidationReturn;

  if ((error_string = isNumeric(value)) !== false) {
    return error_string;
  }
  if ((error_string = rangeValidation(Number(value), range)) !== false) {
    return error_string;
  }

  return false;
}

function validateInteger(value: string, range: NumericRange | null): ValidationReturn {
  // The mod 1 thing asserts an integer
  let error_string: ValidationReturn;

  if ((error_string = validateFloat(value, range)) !== false) {
    return error_string;
  }
  if (Number(value) % 1 != 0) {
    return 'Argument is not integer';
  }

  return false;
}

function validateUnsigned(value: string, range: NumericRange | null): ValidationReturn {
  // The mod 1 thing asserts an integer
  let error_string: ValidationReturn;

  if ((error_string = validateInteger(value, range)) !== false) {
    return error_string;
  }
  if (Number(value) < 0) {
    return 'Argument is not unsigned';
  }
  return false;
}

function validateNumeric(value: string, expectation: FswCommandArgumentNumeric): ValidationReturn {
  switch (expectation.type) {
    case 'float':
      return validateFloat(value, expectation.range);
    case 'integer':
      return validateInteger(value, expectation.range);
    case 'unsigned':
      return validateUnsigned(value, expectation.range);
  }
}

function validateEnum(value: string, options: string[] | null): ValidationReturn {
  console.log({ value, options });

  return options !== null && !options.includes(value)
    ? `Unexpected enum argument\n Got "${value}" but expected one of ${JSON.stringify(options)}`
    : false;
}

// NOTE: Does not check bit lenght, only range right now!
export function validateArguments(
  discoverdArgs: tsc.PropertyAssignment[],
  expectedArgMap: FswCommandArgumentMap,
  enumMap: EnumMap,
  sourceFile: tsc.SourceFile,
): ResponseDiagnostic[] {
  const diagnostics = [];
  for (const argument of discoverdArgs) {
    const clean_arg_name = stripQuotes(argument.name.getText());
    const expected_argument = expectedArgMap[clean_arg_name];

    if (expected_argument === undefined) {
      continue;
    }

    const arg_val = stripQuotes(argument.initializer.getText());
    console.log({ arg_val, type: expected_argument.arg_type });

    let validation_resp: ValidationReturn;

    switch (expected_argument.arg_type) {
      case 'integer':
        if ((validation_resp = validateInteger(arg_val, expected_argument.range)) !== false) {
          diagnostics.push(makeDiagnostic(validation_resp, CustomCodes.InvalidInteger, sourceFile, argument));
        }
        break;
      case 'unsigned':
        if ((validation_resp = validateUnsigned(arg_val, expected_argument.range)) !== false) {
          console.log('Found bad unsigned');
          diagnostics.push(makeDiagnostic(validation_resp, CustomCodes.InvalidUnsignedInteger, sourceFile, argument));
        }
        break;
      case 'float':
        if ((validation_resp = validateFloat(arg_val, expected_argument.range)) !== false) {
          diagnostics.push(makeDiagnostic(validation_resp, CustomCodes.InvalidFloat, sourceFile, argument));
        }
        break;
      case 'numeric':
        if ((validation_resp = validateNumeric(arg_val, expected_argument)) !== false) {
          diagnostics.push(makeDiagnostic(validation_resp, CustomCodes.InvalidFloat, sourceFile, argument));
        }
        break;
      case 'boolean':
        // No check required, the type system will assert this for us
        break;
      case 'enum': {
        // Defined flexibly because some things need to pull from the top level of the command dict
        const enum_options =
          expected_argument.range ?? enumMap[expected_argument.enum_name].values.map(value => value.symbol);
        if ((validation_resp = validateEnum(arg_val, enum_options)) !== false) {
          diagnostics.push(makeDiagnostic(validation_resp, CustomCodes.InvalidFloat, sourceFile, argument));
        }
        break;
      }
      case 'repeat':
        expected_argument.repeat;
        break;
      case 'time':
        expected_argument.units;
        break;
      case 'var_string':
        expected_argument.valid_regex;
        break;
      case 'fill':
        expected_argument.arg_type;
        break;
      case 'fixed_string':
        expected_argument.arg_type;
    }
  }

  return diagnostics;
}
