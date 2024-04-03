import type { SyntaxNode } from '@lezer/common';

export function customFoldInside(node: SyntaxNode): { from: number; to: number } | null {
  if (node.name === 'Command') {
    return foldCommand(node);
  }
  return null;
}

function foldCommand(node: SyntaxNode): { from: number; to: number } | null {
  const stemNode = node.getChild('Stem');
  const argsNodes = node.getChildren('Args');
  const commetNode = node.getChild('LineComment');
  const metadataNode = node.getChildren('Metadata');
  const modelNodes = node.getChildren('Models');

  if (stemNode == null) {
    return null;
  }

  const from = calculateStartAndEnd([stemNode, ...argsNodes, commetNode]).to;
  const to = calculateStartAndEnd([...metadataNode, ...modelNodes]).to;
  return { from, to };
}

function calculateStartAndEnd(nodes: (SyntaxNode | null)[]): { from: number; to: number } {
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
