import type { TypeScriptWorker, Diagnostic } from 'monaco/languages/typescript';

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
    constructor(...args: any) {
      super(...args);
    }
    async getCompletionsAtPosition(fileName: string, position: number) {
      const completions = await super.getCompletionsAtPosition(fileName, position);
      const funny_entry = completions.entries[0];
      funny_entry.name = 'TEST COMPLETION';
      completions.entries.unshift(funny_entry);
      return completions;
    }
    async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
      const diagnostics = await super.getSemanticDiagnostics(fileName);

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
  };
};
