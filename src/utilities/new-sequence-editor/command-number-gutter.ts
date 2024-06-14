import { syntaxTree } from '@codemirror/language';
import { BlockInfo, EditorView, gutter, GutterMarker, ViewUpdate } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';

class LineNumberGutter extends GutterMarker {
  constructor(readonly commandNumber?: number) {
    super();
  }

  eq(other: GutterMarker) {
    return 'commandNumber' in other && this.commandNumber === other.commandNumber;
  }

  toDOM(_view: EditorView): Node {
    return document.createTextNode(this.commandNumber === undefined ? '' : `(${this.commandNumber})`);
  }
}

function maxLineNumber(lines) {
  let last = 9;
  while (last < lines) {
    last = last * 10 + 9;
  }
  return last;
}

let lineNumberToCommandNumberMap: { [line: number]: number } = {};

export function commandNumberUpdateListener() {
  return EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const topNode = syntaxTree(viewUpdate.view.state).topNode;
      const commands: SyntaxNode[] | undefined = topNode.getChild('Commands')?.getChildren('Command');
      if (commands) {
        lineNumberToCommandNumberMap = {};
        commands.forEach((cmd, cmdIndex) => {
          lineNumberToCommandNumberMap[viewUpdate.view.state.doc.lineAt(cmd.from).number] = cmdIndex + 1;
        });
        // console.table(lineNumberToCommandNumberMap);
      }
    }
  });
}

function getCommandNumber(view: EditorView, line: BlockInfo) {
  const commandIndex = lineNumberToCommandNumberMap[view.state.doc.lineAt(line.from).number];
  return new LineNumberGutter(commandIndex);
}

export const commandNumberGutter = gutter({
  initialSpacer: view => new LineNumberGutter(maxLineNumber(view.state.doc.lines)),
  lineMarker: getCommandNumber,
});
