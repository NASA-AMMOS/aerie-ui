import type { SyntaxNode } from '@lezer/common';

export function numberOfChildren(node: SyntaxNode): number {
  let count = 0;
  let child = node.firstChild;
  while (child) {
    count++;
    child = child.nextSibling;
  }
  return count;
}

export function getChildrenNode(node: SyntaxNode): SyntaxNode[] {
  const children = [];
  let child = node.firstChild;
  while (child) {
    children.push(child);
    child = child.nextSibling;
  }
  return children;
}

export function getDeepestNode(node: SyntaxNode): SyntaxNode {
  let currentNode = node;
  while (currentNode.firstChild) {
    currentNode = currentNode.firstChild;
  }
  while (currentNode.nextSibling) {
    currentNode = currentNode.nextSibling;
  }
  return currentNode;
}

export function getFromAndTo(nodes: (SyntaxNode | null)[]): { from: number; to: number } {
  return nodes.reduce(
    (acc, node) => {
      if (node === null) {
        return acc;
      }
      return {
        from: Math.min(acc.from, node.from),
        to: Math.max(acc.to, node.to),
      };
    },
    { from: Number.MAX_VALUE, to: Number.MIN_VALUE },
  );
}

export function getAncestorNode(node: SyntaxNode | null, name: string) {
  let commandNode: SyntaxNode | null = node;
  while (commandNode && commandNode.name !== name) {
    commandNode = commandNode.parent;
  }
  return commandNode;
}
