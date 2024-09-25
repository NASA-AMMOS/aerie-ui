import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { LRLanguage, LanguageSupport, foldInside, foldNodeProp, syntaxTree } from '@codemirror/language';
import { linter, type Diagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { SyntaxNode, Tree } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import type { CommandDictionary, FswCommand, FswCommandArgument } from '@nasa-jpl/aerie-ampcs';
import { EditorView } from 'codemirror';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import { RULE_TIME_TAGGED_STATEMENT, TOKEN_ERROR, TOKEN_STRING_CONST } from './vml-constants';
import { computeBlocks, isBlockCommand, vmlBlockFolder } from './vml-folder';
import { parser } from './vml.grammar';

// Limit how many grammar problems are annotated
const MAX_PARSER_ERRORS = 100;

const blockMark = Decoration.mark({ class: 'cm-block-match' });

export const blockTheme = EditorView.baseTheme({
  '.cm-block-match': {
    outline: '1px dashed',
  },
});

const FoldBehavior: {
  [tokenName: string]: (node: SyntaxNode, _state: EditorState) => ReturnType<typeof foldInside>;
} = {
  // only called on multi-line rules, may need custom service to handle FOR, WHILE, etc.
  Body: foldInside,
  If: foldInside,
  VML_HEADER: foldInside,
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
        VML_EOF: t.docComment,
        VML_HEADER: t.docComment,
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

export function highlightBlock(viewUpdate: ViewUpdate): SyntaxNode[] {
  const tree = syntaxTree(viewUpdate.state);
  const selectionLine = viewUpdate.state.doc.lineAt(viewUpdate.state.selection.asSingle().main.from);
  const leadingWhiteSpaceLength = selectionLine.text.length - selectionLine.text.trimStart().length;
  const updatedSelectionNode = tree.resolveInner(selectionLine.from + leadingWhiteSpaceLength, 1);
  // walk up the tree to Time_tagged_statement, and then back down to the block command e.g. "ELSE"
  const timeTaggedNode = getNearestAncestorNodeOfType(updatedSelectionNode, [RULE_TIME_TAGGED_STATEMENT]);
  const statementNode = timeTaggedNode?.firstChild?.nextSibling?.firstChild;
  if (!statementNode || !isBlockCommand(statementNode.name)) {
    return [];
  }

  const stemNode = statementNode.firstChild;
  if (!stemNode) {
    return [];
  }

  const blocks = computeBlocks(viewUpdate.state);
  if (!blocks) {
    return [];
  }

  const pairs = Object.values(blocks);
  const matchedNodes: SyntaxNode[] = [stemNode];

  // when cursor on end -- select else and if
  let current: SyntaxNode | undefined = timeTaggedNode;
  while (current) {
    current = pairs.find(block => block.end?.from === current!.from)?.start;
    const pairedStemToken = current?.firstChild?.nextSibling?.firstChild?.firstChild;
    if (pairedStemToken) {
      matchedNodes.push(pairedStemToken);
    }
  }

  // when cursor on if -- select else and end
  current = timeTaggedNode;
  while (current) {
    current = pairs.find(block => block.start?.from === current!.from)?.end;
    const pairedStemToken = current?.firstChild?.nextSibling?.firstChild?.firstChild;
    if (pairedStemToken) {
      matchedNodes.push(pairedStemToken);
    }
  }

  return matchedNodes;
}

export const blockHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor() {
      this.decorations = Decoration.none;
    }
    update(viewUpdate: ViewUpdate): DecorationSet | null {
      if (viewUpdate.selectionSet || viewUpdate.docChanged || viewUpdate.viewportChanged) {
        const blocks = highlightBlock(viewUpdate);
        this.decorations = Decoration.set(
          // codemirror requires marks to be in sorted order
          blocks.sort((a, b) => a.from - b.from).map(block => blockMark.range(block.from, block.to)),
        );
        return this.decorations;
      }
      return null;
    }
  },
  {
    decorations: viewPluginSpecification => viewPluginSpecification.decorations,
  },
);

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
          diagnostics.push(...validateArguments(commandDictionary, commandDef, node, functionNameNode, docText));
        }
      }
    }
  } while (cursor.next());
  return diagnostics;
}

function validateArguments(
  commandDictionary: CommandDictionary,
  commandDef: FswCommand,
  functionNode: SyntaxNode,
  functionNameNode: SyntaxNode,
  docText: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const parametersNode = functionNode.getChild('Call_parameters')?.getChildren('Call_parameter') ?? [];

  for (let i = 0; i < commandDef.arguments.length; i++) {
    const argDef: FswCommandArgument | undefined = commandDef.arguments[i];
    const argNode = parametersNode[i];

    const functionName = docText.slice(functionNameNode.from, functionNameNode.to);
    if (argDef && argNode) {
      diagnostics.push(...validateArgument(commandDictionary, argDef, argNode, docText));
    } else if (!argNode && !!argDef) {
      const { from, to } = functionNameNode;
      diagnostics.push({
        from,
        message: `${functionName} missing argument ${argDef.name}`,
        severity: 'error',
        to,
      });
    }

    console.log(`Extras: ${parametersNode.slice(commandDef.arguments.length).length}`);

    diagnostics.push(
      ...parametersNode.slice(commandDef.arguments.length).map((extraArg: SyntaxNode) => {
        const { from, to } = extraArg;
        return {
          from,
          message: `${functionName} has extra argument ${docText.slice(from, to)}`,
          severity: 'error',
          to,
        } as const;
      }),
    );
  }
  return diagnostics;
}

function validateArgument(
  commandDictionary: CommandDictionary,
  argDef: FswCommandArgument,
  argNode: SyntaxNode,
  docText: string,
): Diagnostic[] {
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
        if (TOKEN_STRING_CONST !== constantNode.name) {
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
      case 'enum': {
        if (TOKEN_STRING_CONST !== constantNode.name) {
          return [
            {
              from,
              message: `Expected type ${constantNode.name} for enum argument`,
              severity: 'error',
              to,
            },
          ];
        } else {
          const enumVal = unquote(docText.slice(constantNode.from, constantNode.to));
          const enumDef = commandDictionary.enumMap[argDef.enum_name];
          if (enumDef) {
            if (!enumDef.values.find(ev => ev.symbol === enumVal)) {
              return [
                {
                  from,
                  message: `Expected enum value ${enumVal}`,
                  severity: 'error',
                  to,
                },
              ];
            }
          }
        }
        break;
      }
    }
  }

  return diagnostics;
}

function unquote(s: string) {
  return s.slice(1, s.length - 1);
}

/**
 * Checks for unexpected tokens.
 *
 * @param tree
 * @returns
 */
function validateParserErrors(tree: Tree): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
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
