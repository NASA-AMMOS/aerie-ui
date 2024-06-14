import { syntaxTree } from '@codemirror/language';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';

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

export const commandNumberGutter = gutter({
  initialSpacer: () => new LineNumberGutter(),
  lineMarker(view, line) {
    const topNode = syntaxTree(view.state).topNode;
    const commands = topNode.getChild('Commands')?.getChildren('Command');
    let commandIndex: number | undefined =
      commands?.findIndex(cmd => line.from <= cmd.from && line.to >= cmd.from) ?? -1;
    if (commandIndex === -1) {
      commandIndex = undefined;
    } else {
      // 1-based count
      commandIndex++;
    }

    return new LineNumberGutter(commandIndex);
  },
});
