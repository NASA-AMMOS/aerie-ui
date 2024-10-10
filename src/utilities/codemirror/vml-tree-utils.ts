import type { SyntaxNode } from '@lezer/common';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import type { CommandInfoMapper } from './command-info-mapper';
import {
  RULE_CALL_PARAMETER,
  RULE_CALL_PARAMETERS,
  RULE_CONSTANT,
  RULE_FUNCTION_NAME,
  RULE_ISSUE,
  RULE_SIMPLE_EXPR,
  RULE_STATEMENT,
  RULE_TIME_TAGGED_STATEMENT,
  TOKEN_INT_CONST,
  TOKEN_STRING_CONST,
} from './vml-constants';

export class VmlCommandInfoMapper implements CommandInfoMapper {
  getArgumentNodeContainer(commandNode: SyntaxNode | null): SyntaxNode | null {
    return commandNode?.getChild(RULE_STATEMENT)?.firstChild?.getChild(RULE_CALL_PARAMETERS) ?? null;
  }

  getArgumentsFromContainer(containerNode: SyntaxNode): SyntaxNode[] {
    return containerNode?.getChildren(RULE_CALL_PARAMETER) ?? [];
  }

  getContainingCommand(node: SyntaxNode | null): SyntaxNode | null {
    return getNearestAncestorNodeOfType(node, [RULE_TIME_TAGGED_STATEMENT]);
  }

  getNameNode(statementNode: SyntaxNode | null): SyntaxNode | null {
    const statementSubNode = statementNode?.getChild(RULE_STATEMENT)?.getChild(RULE_ISSUE);
    if (statementSubNode?.name === RULE_ISSUE) {
      return statementSubNode.getChild(RULE_FUNCTION_NAME);
    }
    // once block library is implemented allow spawn here too
    return null;
  }

  nodeTypeEnumCompatible(node: SyntaxNode | null): boolean {
    return !!node?.getChild(RULE_SIMPLE_EXPR)?.getChild(RULE_CONSTANT)?.getChild(TOKEN_STRING_CONST);
  }

  nodeTypeHasArguments(node: SyntaxNode | null): boolean {
    return node?.name === RULE_TIME_TAGGED_STATEMENT;
  }

  nodeTypeNumberCompatible(node: SyntaxNode | null): boolean {
    return !!node?.getChild(RULE_SIMPLE_EXPR)?.getChild(RULE_CONSTANT)?.getChild(TOKEN_INT_CONST);
  }
}

export function getArgumentPosition(argNode: SyntaxNode): number {
  return (
    getNearestAncestorNodeOfType(argNode, [RULE_STATEMENT])
      ?.firstChild?.getChild(RULE_CALL_PARAMETERS)
      ?.getChildren(RULE_CALL_PARAMETER)
      ?.findIndex(par => par.from === argNode.from && par.to === argNode.to) ?? -1
  );
}
