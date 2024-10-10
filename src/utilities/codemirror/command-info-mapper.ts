import type { SyntaxNode } from '@lezer/common';

export interface CommandInfoMapper {
  getArgumentNodeContainer(commandNode: SyntaxNode | null): SyntaxNode | null;

  getArgumentsFromContainer(containerNode: SyntaxNode): SyntaxNode[];

  getContainingCommand(node: SyntaxNode | null): SyntaxNode | null;

  getNameNode(stepNode: SyntaxNode | null): SyntaxNode | null;

  nodeTypeEnumCompatible(node: SyntaxNode | null): boolean;

  nodeTypeHasArguments(node: SyntaxNode | null): boolean;

  nodeTypeNumberCompatible(node: SyntaxNode | null): boolean;
}
