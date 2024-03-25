import type { SyntaxNode } from '@lezer/common';

export function customFoldInside(node: SyntaxNode): { from: number; to: number } | null {
  if (node.name === 'GroundBlock') {
    return foldGroundBlock(node);
  } else if (node.name === 'Command') {
    return foldCommand(node);
  }
  return null;
}

function foldCommand(node: SyntaxNode): { from: number; to: number } | null {
  const stemNode = node.getChild('Stem');
  const argsNodes = node.getChildren('Args');
  const descriptionNode = node.getChild('Description');
  const modelNodes = node.getChildren('Model');

  if (stemNode == null) {
    return null;
  }

  let from = calculateStartAndEnd([stemNode]).to;
  if (argsNodes.length > 0) {
    from = calculateStartAndEnd(argsNodes).to - 1;
  }

  // determine which node starts sooner if both exist
  if (descriptionNode && modelNodes.length > 0) {
    const { to: to } = calculateStartAndEnd(modelNodes.concat([descriptionNode]));
    return { from, to };
  } else if (descriptionNode) {
    const { to: to } = calculateStartAndEnd([descriptionNode]);
    return { from, to };
  } else if (modelNodes.length > 0) {
    const { to: to } = calculateStartAndEnd(modelNodes);
    return { from, to };
  }
  return null;
}

function foldGroundBlock(node: SyntaxNode): { from: number; to: number } | null {
  const descriptionNode = node.getChild('Description');
  const modelNodes = node.getChildren('Model');
  const nameNode = node.getChild('Name');
  const argsNodes = node.getChildren('Args');

  if (nameNode === null) {
    return null;
  }

  let from = calculateStartAndEnd([nameNode]).to + 1;
  if (argsNodes.length > 0) {
    from = calculateStartAndEnd(argsNodes).to - 1;
  }

  // determine which node starts sooner if both exist
  if (descriptionNode && modelNodes.length > 0) {
    const { to: to } = calculateStartAndEnd(modelNodes.concat([descriptionNode]));
    return { from, to };
  } else if (descriptionNode) {
    const { to: to } = calculateStartAndEnd([descriptionNode]);
    return { from, to };
  } else if (modelNodes.length > 0) {
    const { to: to } = calculateStartAndEnd(modelNodes);
    return { from, to };
  }
  return null;
}

function calculateStartAndEnd(nodes: SyntaxNode[]): { from: number; to: number } {
  return nodes.reduce(
    (acc, node) => ({
      from: Math.min(acc.from, node.from),
      to: Math.max(acc.to, node.to),
    }),
    { from: Number.MAX_VALUE, to: Number.MIN_VALUE },
  );
}
