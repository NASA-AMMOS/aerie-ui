import type { SyntaxNode } from '@lezer/common';
import {
  RULE_ARGS,
  RULE_GROUND_NAME,
  RULE_REQUEST_NAME,
  RULE_SEQUENCE_NAME,
  RULE_STEM,
  TOKEN_ACTIVATE,
  TOKEN_COMMAND,
  TOKEN_GROUND_BLOCK,
  TOKEN_GROUND_EVENT,
  TOKEN_LOAD,
  TOKEN_NUMBER,
  TOKEN_REPEAT_ARG,
  TOKEN_REQUEST,
  TOKEN_STRING,
} from '../../constants/seq-n-grammar-constants';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import type { CommandInfoMapper } from './command-info-mapper';

export function getNameNode(stepNode: SyntaxNode | null) {
  if (stepNode) {
    switch (stepNode.name) {
      case TOKEN_ACTIVATE:
      case TOKEN_LOAD:
        return stepNode.getChild(RULE_SEQUENCE_NAME);
      case TOKEN_GROUND_BLOCK:
      case TOKEN_GROUND_EVENT:
        return stepNode.getChild(RULE_GROUND_NAME);
      case TOKEN_COMMAND:
        return stepNode.getChild(RULE_STEM);
      case TOKEN_REQUEST:
        return stepNode.getChild(RULE_REQUEST_NAME);
    }
  }

  return null;
}

export function getAncestorStepOrRequest(node: SyntaxNode | null) {
  return getNearestAncestorNodeOfType(node, [
    TOKEN_COMMAND,
    TOKEN_ACTIVATE,
    TOKEN_GROUND_BLOCK,
    TOKEN_GROUND_EVENT,
    TOKEN_LOAD,
    TOKEN_REQUEST,
  ]);
}

export class SeqNCommandInfoMapper implements CommandInfoMapper {
  formatArgumentArray(values: string[]): string {
    return ' ' + values.join(' ');
  }

  getArgumentAppendPosition(commandNode: SyntaxNode | null): number | undefined {
    if (!commandNode) {
      return undefined;
    }
    let insertPosition: undefined | number = undefined;
    const argsNode = commandNode.getChild('Args');
    const stemNode = commandNode.getChild('Stem');
    if (stemNode) {
      insertPosition = argsNode?.to ?? stemNode.to;
    } else if (commandNode.name === TOKEN_REPEAT_ARG) {
      insertPosition = commandNode.to - 1;
    }
    return insertPosition;
  }

  getArgumentNodeContainer(commandNode: SyntaxNode | null): SyntaxNode | null {
    return commandNode?.getChild(RULE_ARGS) ?? null;
  }

  getArgumentsFromContainer(containerNode: SyntaxNode | null): SyntaxNode[] {
    const children: SyntaxNode[] = [];

    let child = containerNode?.firstChild;
    while (child) {
      children.push(child);
      child = child.nextSibling;
    }

    return children;
  }

  getContainingCommand(node: SyntaxNode | null): SyntaxNode | null {
    return getAncestorStepOrRequest(node);
  }

  getNameNode(stepNode: SyntaxNode | null): SyntaxNode | null {
    return getNameNode(stepNode);
  }

  nodeTypeEnumCompatible(node: SyntaxNode | null): boolean {
    return node?.name === TOKEN_STRING;
  }

  nodeTypeHasArguments(node: SyntaxNode | null): boolean {
    return node?.name === TOKEN_COMMAND;
  }

  nodeTypeNumberCompatible(node: SyntaxNode | null): boolean {
    return node?.name === TOKEN_NUMBER;
  }
}
