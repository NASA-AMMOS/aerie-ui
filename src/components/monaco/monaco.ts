import type {
  editor,
  Environment,
} from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

declare global {
  interface Window {
    MonacoEnvironment: Environment;
  }
}

export type Editor = editor.IStandaloneCodeEditor;
export type ModelContentChangedEvent = editor.IModelContentChangedEvent;
export type Options = editor.IStandaloneEditorConstructionOptions;
export type OverrideServices = editor.IEditorOverrideServices;

export async function createMonacoEditor(
  domElement: HTMLElement,
  options?: Options,
  override?: OverrideServices,
): Promise<Editor> {
  self.MonacoEnvironment = self.MonacoEnvironment ?? {
    getWorker(_moduleId: unknown, label: string): Worker {
      if (label === 'json') {
        return new jsonWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };

  // TODO: Import only what we need instead of everything.
  const monaco = await import('monaco-editor');
  const editor = monaco.editor.create(domElement, options, override);

  return editor;
}
