import { foldService, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { T_ELSE, T_ELSE_IF, T_END_IF, T_IF } from './vml-constants';

type BlockStackNode = Readonly<{
  node: SyntaxNode;
  stem: string;
}>;

type BlockStack = BlockStackNode[];

export type PairedCommands = {
  end: SyntaxNode;
  endPos: number;
  start: SyntaxNode;
  startPos: number;
};

type PartialPairedCommands = Partial<PairedCommands>;

type TreeState = {
  [startPos: number]: PartialPairedCommands;
};

export function isPairedCommands(pair: unknown): pair is PairedCommands {
  const pc = pair as PairedCommands;
  return !!pc?.start && !!pc?.end;
}

// type BlockType = Readonly<{
//   close: string;
//   open: string[];
//   partition?: string;
// }>;

const blocksForState = new WeakMap<EditorState, TreeState>();

const blockOpeningStems: Set<string> = new Set([T_IF, T_ELSE_IF, T_ELSE]);

const blockClosingStems: Set<string> = new Set([T_ELSE, T_ELSE_IF, T_END_IF]);

export function isBlockCommand(stem: string): boolean {
  return blockOpeningStems.has(stem) || blockClosingStems.has(stem);
}

function closesBlock(stem: string, blockStem: string) {
  switch (stem) {
    case T_END_IF:
      return [T_IF, T_ELSE_IF, T_ELSE].includes(blockStem);
    case T_ELSE:
    case T_ELSE_IF:
      return [T_IF, T_ELSE_IF].includes(blockStem);
  }
  return false;
}

export function computeBlocks(state: EditorState): TreeState {
  // avoid scanning for each command
  const blocks = blocksForState.get(state);
  if (!blocks) {
    // find all command nodes in sequence
    const statementAndCategory: [SyntaxNode, string][] = [];
    syntaxTree(state).iterate({
      enter: node => {
        if (node.name === 'Time_tagged_statement') {
          const statementCategory = node.node.getChild('Statement')?.firstChild?.name;
          if (statementCategory && isBlockCommand(statementCategory)) {
            statementAndCategory.push([node.node, statementCategory]);
          }
        }
      },
    });

    const treeState: TreeState = {};
    const stack: BlockStack = [];
    const docString = state.sliceDoc();

    statementAndCategory
      // filter out ones that don't impact blocks
      // .filter(stemNode => isBlockCommand(state.sliceDoc(stemNode.from, stemNode.to)))
      .forEach(([node, category]) => {
        // const stem = state.sliceDoc(stemNode.from, stemNode.to);
        const topStem = stack.at(-1)?.stem;

        if (topStem && closesBlock(category, topStem)) {
          // close current block
          const blockInfo: BlockStackNode | undefined = stack.pop();
          if (blockInfo) {
            // pair end with existing start to provide info for fold region
            const commandStr = state.toText(docString).lineAt(node.from).text;
            const leadingSpaces = commandStr.length - commandStr.trimStart().length;
            const endPos: undefined | number = node.from - leadingSpaces - 1;
            Object.assign(treeState[blockInfo.node.from], { end: node, endPos });

            // works but wrong line
            // Object.assign(treeState[blockInfo.node.from], { end: node, endPos: node.from });
          }
        } else if (blockClosingStems.has(category)) {
          // unexpected close
          treeState[node.from] = {
            end: node,
          };
          return; // don't open a new block for else_if type
        }

        if (blockOpeningStems.has(category)) {
          // open new block

          treeState[node.from] = {
            start: node,
            startPos: node.to - 1,
          };

          stack.push({
            node: node,
            stem: category,
          });
        }
      });
    blocksForState.set(state, treeState);
  }
  return blocksForState.get(state)!;
}

// function blockFolder(stemNode: SyntaxNode, state: EditorState): { from: number; to: number } | null {
//   const localBlock = computeBlocks(state)?.[stemNode.from];
//   if (isPairedCommands(localBlock) && localBlock.startPos !== undefined && localBlock.endPos !== undefined) {
//     // display lines that open and close block
//     return {
//       from: localBlock.startPos,
//       to: localBlock.endPos,
//     };
//   }

//   return null;
// }

export const vmlBlockFolder = foldService.of((state: EditorState, start, end) => {
  for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(end, -1); node; node = node.parent) {
    if (node.from < start) {
      break;
    }

    const blocks = computeBlocks(state);
    const foo = blocks[node.from];
    if (foo !== undefined && foo.startPos !== undefined && foo.endPos !== undefined) {
      return {
        from: foo.startPos,
        to: foo.endPos,
      };
    }

    // generates a hard coded fold
    // if (node.type.name === 'If') {
    //   console.log(`folding checked ${start} ${node.type.name}`);
    //   return {
    //     from: 100,
    //     to: 150,
    //   };
    // }

    // const upto = findSectionEnd(node, heading);
    // if (upto > end) {
    //   return { from: end, to: upto };
    // }
  }

  return null;
});
