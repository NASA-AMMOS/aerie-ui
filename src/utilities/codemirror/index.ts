import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  foldNodeProp,
  indentNodeProp,
  syntaxTree,
} from '@codemirror/language';
import { Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import { TOKEN_COMMAND } from '../../constants/seq-n-grammar-constants';
import { getNearestAncestorNodeOfType } from '../sequence-editor/tree-utils';
import { blockMark } from './block';
import { computeBlocks, customFoldInside, isBlockCommand } from './custom-folder';
import { parser } from './sequence.grammar';

export const SeqLanguage = LRLanguage.define({
  languageData: {
    commentTokens: { line: '#' },
  },
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({ align: false, closing: ')' }),
      }),
      foldNodeProp.add({
        Activate: customFoldInside,
        Command: customFoldInside,
        GroundBlock: customFoldInside,
        GroundEvent: customFoldInside,
        Load: customFoldInside,
        Metadata: customFoldInside,
        Models: customFoldInside,
        Request: customFoldInside,
      }),
      styleTags({
        Activate: t.namespace,
        Boolean: t.bool,
        Engine: t.namespace,
        Epoch: t.namespace,
        GenericDirective: t.namespace,
        Global: t.namespace,
        GroundBlock: t.namespace,
        GroundEpoch: t.className,
        GroundEvent: t.namespace,
        HardwareCommands: t.namespace,
        IdDeclaration: t.namespace,
        ImmediateCommands: t.namespace,
        LineComment: t.comment,
        Load: t.namespace,
        LoadAndGoDirective: t.namespace,
        LocalDeclaration: t.namespace,
        MetaEntry: t.namespace,
        Model: t.namespace,
        ParameterDeclaration: t.namespace,
        Request: t.namespace,
        Stem: t.keyword,
        String: t.string,
        TimeAbsolute: t.className,
        TimeComplete: t.className,
        TimeEpoch: t.className,
        TimeGroundEpoch: t.className,
        TimeRelative: t.className,
      }),
    ],
  }),
});

export function setupLanguageSupport(autocomplete?: (context: CompletionContext) => CompletionResult | null) {
  if (autocomplete) {
    const autocompleteExtension = SeqLanguage.data.of({ autocomplete });
    return new LanguageSupport(SeqLanguage, [autocompleteExtension]);
  } else {
    return new LanguageSupport(SeqLanguage);
  }
}

export const seqqNBlockHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor() {
      this.decorations = Decoration.none;
    }
    update(viewUpdate: ViewUpdate): DecorationSet | null {
      if (viewUpdate.selectionSet || viewUpdate.docChanged || viewUpdate.viewportChanged) {
        const blocks = seqNHighlightBlock(viewUpdate);
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

export function seqNHighlightBlock(viewUpdate: ViewUpdate): SyntaxNode[] {
  const tree = syntaxTree(viewUpdate.state);
  // Command Node includes trailing newline and white space, move to next command
  const selectionLine = viewUpdate.state.doc.lineAt(viewUpdate.state.selection.asSingle().main.from);
  const leadingWhiteSpaceLength = selectionLine.text.length - selectionLine.text.trimStart().length;
  const updatedSelectionNode = tree.resolveInner(selectionLine.from + leadingWhiteSpaceLength, 1);
  const stemNode = getNearestAncestorNodeOfType(updatedSelectionNode, [TOKEN_COMMAND])?.getChild('Stem');

  if (!stemNode || !isBlockCommand(viewUpdate.state.sliceDoc(stemNode.from, stemNode.to))) {
    return [];
  }

  const blocks = computeBlocks(viewUpdate.state);
  if (!blocks) {
    return [];
  }

  const pairs = Object.values(blocks);
  const matchedNodes: SyntaxNode[] = [stemNode];

  // when cursor on end -- select else and if
  let current: SyntaxNode | undefined = stemNode;
  while (current) {
    current = pairs.find(block => block.end?.from === current!.from)?.start;
    if (current) {
      matchedNodes.push(current);
    }
  }

  // when cursor on if -- select else and end
  current = stemNode;
  while (current) {
    current = pairs.find(block => block.start?.from === current!.from)?.end;
    if (current) {
      matchedNodes.push(current);
    }
  }

  return matchedNodes;
}
