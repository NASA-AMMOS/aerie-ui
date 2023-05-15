import type { CompletionInfo } from 'typescript';
import type { Diagnostic, TypeScriptWorker } from '../types/monaco-internal';
// import { generateEdslDiagnostics } from './edslDiagnostics';
// Appease the TSC - this special window object is read by the Custom Worker implementation of Monaco
declare class TsWorkerOverride implements Partial<TypeScriptWorker> {}

declare global {
  interface Window {
    customTSWorkerFactory: (tsw: any) => typeof TsWorkerOverride;
  }
}

// Implement whatever overrides we want!
self.customTSWorkerFactory = tsw => {
  return class extends tsw implements Partial<TypeScriptWorker> {
    private completion_name = 'test';
    constructor(...args: any) {
      super(...args);
    }
    async getCompletionsAtPosition(fileName: string, position: number) {
      const completions = await (super.getCompletionsAtPosition(fileName, position) as Promise<
        CompletionInfo | undefined
      >);

      const completion = completions.entries[0];
      completion.name = this.completion_name;

      completions.entries.push(completion);

      return completions;
    }
    async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
      const diagnostics = await super.getSemanticDiagnostics(fileName);

      const ls = super.getLanguageService;

      const thing = generateEdslDiagnostics(fileName, ls);

      return diagnostics;
    }

    async getSuggestionDiagnostics(fileName: string): Promise<Diagnostic[]> {
      const diagnostics = await super.getSuggestionDiagnostics(fileName);

      return diagnostics;
    }

    async getSyntacticDiagnostics(fileName: string): Promise<Diagnostic[]> {
      const diagnostics = await super.getSyntacticDiagnostics(fileName);

      return diagnostics;
    }

    async setSuggestionName(name: string): Promise<void> {
      this.completion_name = name;
    }
  };
};
