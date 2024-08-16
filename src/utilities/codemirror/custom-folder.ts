import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { getFromAndTo } from '../sequence-editor/tree-utils';

export function customFoldInside(node: SyntaxNode, state: EditorState): { from: number; to: number } | null {
  switch (node.name) {
    case 'Activate':
    case 'Load':
      return foldActivateLoad(node, state);
    case 'Command':
      return foldCommand(node, state);
    case 'GroundBlock':
    case 'GroundEvent':
      return foldGround(node, state);
    case 'Request':
      return foldRequest(node, state);
    case 'Metadata':
      return foldMetadataOrModel(node, state, '@Metadata');
    case 'Models':
      return foldMetadataOrModel(node, state, '@Model');
  }
  return null;
}

/**
 * Returns the range of the `Command` node, folding the node on the Stem name.
 * @param commandNode The `Command` node to fold.
 * @param state The EditorState to get the document from.
 * @returns The range of the `Command` node, or null if the Stem node is missing.
 */
export function foldCommand(commandNode: SyntaxNode, state: EditorState): { from: number; to: number } | null {
  const stemNode = commandNode.getChild('Stem');
  if (stemNode == null) {
    return null;
  }

  // fold the node on the Stem name
  return foldSteps(commandNode, stemNode, state);
}

/**
 * Returns the range of the `GroundBlock` or `GroundEvent` node, folding the node on the GroundName.
 * @param groundNode The `GroundBlock` or `GroundEvent` node to fold.
 * @param state The EditorState to get the document from.
 * @returns The range of the `GroundBlock` or `GroundEvent` node, or null if the GroundName node is missing.
 */
export function foldGround(groundNode: SyntaxNode, state: EditorState): { from: number; to: number } | null {
  // Get the GroundName node
  const groundNameNode = groundNode.getChild('GroundName');
  // If the GroundName node is missing, return null
  if (groundNameNode == null) {
    return null;
  }

  // Fold the node on the GroundName
  return foldSteps(groundNode, groundNameNode, state);
}

/**
 * Returns the range of the `Activate` or `Load` node, folding the node on the `SequenceName`.
 * @param activateNode The `Activate` or `Load` node to fold.
 * @param state The EditorState to get the document from.
 * @returns The range of the `Activate` or `Load` node, or null if the `SequenceName` node is missing.
 */
export function foldActivateLoad(activateNode: SyntaxNode, state: EditorState): { from: number; to: number } | null {
  // Get the SequenceName node
  const sequenceNameNode = activateNode.getChild('SequenceName');
  // If the SequenceName node is missing, return null
  if (sequenceNameNode == null) {
    return null;
  }

  // Fold the node on the SequenceName
  return foldSteps(activateNode, sequenceNameNode, state);
}

/**
 * Returns a fold range object for a Command, Load, or Ground block.
 * The fold range starts after the target node (Stem or SequenceName)
 * and ends after any Args, LineComment, Metadata, Models, Epoch, and Engine nodes.
 * If the text ends with a line break, the end of the fold range will be adjusted to the start of the line break.
 *
 * @param containerNode - The parent node of the target node.
 * @param targetNode - The node to start the fold range after (Stem or SequenceName).
 * @param state - The EditorState object.
 * @returns A fold range object with "from" and "to" properties.
 *          Returns null if any of the necessary nodes are not present.
 */
function foldSteps(
  containerNode: SyntaxNode,
  targetNode: SyntaxNode,
  state: EditorState,
): { from: number; to: number } | null {
  // Get all Args nodes, LineComment node, Metadata nodes, and Models nodes.
  const argsNodes = containerNode.getChildren('Args');
  const commentNode = containerNode.getChild('LineComment');
  const metadataNode = containerNode.getChildren('Metadata');
  const modelNodes = containerNode.getChildren('Models');

  // Get the Epoch and Engine nodes.
  const epochNode = containerNode.getChild('Epoch');
  const engineNode = containerNode.getChild('Engine');

  // Calculate the start of the fold range after the target node and any Args, LineComment nodes
  const from = getFromAndTo([targetNode, ...argsNodes, commentNode]).to;

  // Calculate the end of the fold range after the Epoch, Engine, Metadata, and Model nodes.
  const groundAttributesEnd = getFromAndTo([epochNode, engineNode, ...metadataNode, ...modelNodes]).to;

  // Get the text between the start and end of the fold range.
  const text = state.sliceDoc(from, groundAttributesEnd).trimEnd() + '\n';

  // Calculate the end of the fold range by finding the index of the last line break in the text.
  const to = from + text.lastIndexOf('\n');

  return { from, to };
}

/**
 * Calculate the fold range for a Request node.
 * The fold range starts after the RequestName node and any LineComment node
 * and ends after the Request node.
 * If the text ends with a line break, the end of the fold range will be adjusted to the start of the line break.
 *
 * @param requestNode - The Request node to calculate the fold range for.
 * @param state - The EditorState object.
 * @returns A fold range object with "from" and "to" properties.
 *          Returns null if any of the necessary nodes are not present.
 */
export function foldRequest(requestNode: SyntaxNode, state: EditorState): { from: number; to: number } | null {
  const requestNameNode = requestNode.getChild('RequestName');
  const argsNodes = requestNode.getChildren('Args');
  const commentNode = requestNode.getChild('LineComment');

  // Calculate the start of the fold range after the RequestName node and any LineComment node
  const from = getFromAndTo([requestNameNode, ...argsNodes, commentNode]).to + (commentNode == null ? 1 : 0);

  // Calculate the end of the fold range after the Request node
  let endRequest = getFromAndTo([requestNode]).to;

  // If the text ends with a line break, adjust the end of the fold range to the start of the line break
  const text = state.sliceDoc(from, endRequest).trimEnd() + '\n';
  endRequest = from + text.lastIndexOf('\n');

  return { from, to: endRequest };
}

/**
 * Calculate the fold range for a Metadata or Model node.
 * The fold range starts after the node's prefix (e.g. "@Metadata" or "@Model") and ends after the node.
 * If the text ends with a line break, the end of the fold range will be adjusted to the start of the line break.
 *
 * @param node - The Metadata or Model node to calculate the fold range for.
 * @param state - The EditorState object.
 * @param prefix - The prefix of the node (e.g. "@Metadata" or "@Model").
 * @returns A fold range object with "from" and "to" properties.
 *          Returns null if the node is not present.
 */
function foldMetadataOrModel(
  node: SyntaxNode,
  state: EditorState,
  prefix: string,
): { from: number; to: number } | null {
  if (node === null) {
    return null;
  }

  const { from: start, to: end } = getFromAndTo([node]);

  // If the text ends with a line break, adjust the end of the fold range to the start of the line break
  const text = state.sliceDoc(start, end).trimEnd() + '\n';
  const newEnd = start + text.lastIndexOf('\n');

  return {
    from: start + prefix.length,
    to: newEnd,
  };
}
