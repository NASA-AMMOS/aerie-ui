import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp, syntaxTree } from '@codemirror/language';
import { linter, type Diagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import type { CommandDictionary, FswCommand, FswCommandArgument } from '@nasa-jpl/aerie-ampcs';
import { vmlBlockFolder } from './vml-folder';
import { parser } from './vml.grammar';

export const TOKEN_ERROR = '⚠';

export const TOKEN_WAIT = 'WAIT';
export const TOKEN_WAIT_CHANGE = 'WAIT_CHANGE';

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode, _state: EditorState) => ReturnType<typeof foldInside>;
} = {
  // only called on multi-line rules, may need custom service to handle FOR, WHILE, etc.
  Body: foldInside,
  If: foldInside,
};

export const VmlLanguage = LRLanguage.define({
  languageData: {
    commentTokens: { line: ';' },
  },
  parser: parser.configure({
    props: [
      foldNodeProp.add(FoldBehavior),
      styleTags({
        ADD: t.arithmeticOperator,
        ASSIGNMENT: t.updateOperator,
        BLOCK: t.namespace,
        BODY: t.namespace,
        Comment: t.comment,
        DAY_TIME_CONST: t.className,
        DECLARE: t.keyword,
        DELAY_BY: t.keyword,
        DIVIDE: t.arithmeticOperator,
        DO: t.controlKeyword,
        DOUBLE_CONST: t.number,
        ELSE: t.controlKeyword,
        ELSE_IF: t.controlKeyword,
        END_BODY: t.namespace,
        END_FOR: t.controlKeyword,
        END_IF: t.controlKeyword,
        END_MODULE: t.namespace,
        END_WHILE: t.controlKeyword,
        FOR: t.controlKeyword,
        FULL_TIME_CONST: t.className,
        HEX_CONST: t.number,
        IF: t.controlKeyword,
        INPUT: t.keyword,
        INT_CONST: t.number,
        MODULE: t.namespace,
        MODULO: t.arithmeticOperator,
        MULTIPLY: t.arithmeticOperator,
        POWER: t.arithmeticOperator,
        RETURN: t.keyword,
        SHORT_TIME_CONST: t.className,
        SPACECRAFT_TIME_CONST: t.className,
        STEP: t.controlKeyword,
        STRING_CONST: t.string,
        SUBTRACT: t.arithmeticOperator,
        THEN: t.controlKeyword,
        TIMEOUT: t.keyword,
        UINT_CONST: t.number,
        Variable_name: t.variableName,
        WAIT: t.keyword,
        WHILE: t.controlKeyword,
      }),
    ],
  }),
});

export function setupVmlLanguageSupport(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = VmlLanguage.data.of({ autocomplete });
    return new LanguageSupport(VmlLanguage, [vmlBlockFolder, autocompleteExtension]);
  } else {
    return new LanguageSupport(VmlLanguage, [vmlBlockFolder]);
  }
}

export function vmlLinter(commandDictionary: CommandDictionary | null = null): Extension {
  return linter(view => {
    const diagnostics: Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    // const treeNode = tree.topNode;
    // const docText = view.state.doc.toString();
    diagnostics.push(...validateParserErrors(tree));
    if (!commandDictionary) {
      return diagnostics;
    }

    const sequence = view.state.sliceDoc();
    const parsed = VmlLanguage.parser.parse(sequence);

    diagnostics.push(...validateCommands(commandDictionary, sequence, parsed));

    return diagnostics;
  });
}

function validateCommands(commandDictionary: CommandDictionary, docText: string, parsed: Tree): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const cursor = parsed.cursor();
  do {
    const { node } = cursor;
    const tokenType = node.type.name;

    if (tokenType === 'Issue') {
      const functionNameNode = node.getChild('Function_name');
      if (functionNameNode) {
        const functionName = docText.slice(functionNameNode.from, functionNameNode.to);
        const commandDef = commandDictionary.fswCommandMap[functionName];
        if (!commandDef) {
          const { from, to } = functionNameNode;
          diagnostics.push({
            from,
            message: `Unknown function name ${functionName}`,
            severity: 'error',
            to,
          });
        } else {
          diagnostics.push(...validateArguments(commandDef, node, functionNameNode, docText));
        }
      }
    }
  } while (cursor.next());
  return diagnostics;
}

function validateArguments(
  commandDef: FswCommand,
  functionNode: SyntaxNode,
  functionNameNode: SyntaxNode,
  docText: string,
) {
  const diagnostics: Diagnostic[] = [];
  const parametersNode = functionNode.getChild('Call_parameters')?.getChildren('Call_parameter');
  if (parametersNode) {
    for (let i = 0; i < commandDef.arguments.length; i++) {
      const argDef = commandDef.arguments[i];
      const argNode = parametersNode[i];
      if (argDef && argNode) {
        diagnostics.push(...validateArgument(argDef, argNode, docText));
      } else if (!argNode && argDef) {
        const functionName = docText.slice(functionNameNode.from, functionNameNode.to);
        const { from, to } = functionNameNode;
        diagnostics.push({
          from,
          message: `${functionName} missing argument ${argDef.name}`,
          severity: 'error',
          to,
        });
      }
    }
  }
  return diagnostics;
}

function validateArgument(argDef: FswCommandArgument, argNode: SyntaxNode, _docText: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // could also be a variable
  const constantNode = argNode.getChild('Simple_expr')?.getChild('Constant')?.firstChild;

  if (constantNode) {
    const { from, to } = constantNode;
    switch (argDef.arg_type) {
      case 'integer':
        {
          if (!['INT_CONST', 'UINT_CONST', 'HEX_CONST'].includes(constantNode.name)) {
            return [
              {
                from,
                message: `Expected integer value`,
                severity: 'error',
                to,
              },
            ];
          }
        }
        break;
      case 'float':
        if (!['INT_CONST', 'DOUBLE_CONST'].includes(constantNode.name)) {
          return [
            {
              from,
              message: `Expected float or integer value`,
              severity: 'error',
              to,
            },
          ];
        }
        break;
      case 'var_string':
        if ('STRING_CONST' === constantNode.name) {
          return [
            {
              from,
              message: `Expected string value`,
              severity: 'error',
              to,
            },
          ];
        }
        break;
    }
  }

  return diagnostics;
}

/**
 * Checks for unexpected tokens.
 *
 * @param tree
 * @returns
 */
function validateParserErrors(tree: Tree) {
  const diagnostics: Diagnostic[] = [];
  const MAX_PARSER_ERRORS = 100;
  tree.iterate({
    enter: node => {
      if (node.name === TOKEN_ERROR && diagnostics.length < MAX_PARSER_ERRORS) {
        const { from, to } = node;
        diagnostics.push({
          from,
          message: `Unexpected token`,
          severity: 'error',
          to,
        });
      }
    },
  });
  return diagnostics;
}
