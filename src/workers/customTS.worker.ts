import type { CompletionInfo } from 'typescript';
import type { Diagnostic, TypeScriptWorker as InternalTsWorker } from '../types/monaco-internal';

// Appease the TSC - this special window object is read by the Custom Worker implementation of Monaco
declare class TsWorkerOverride implements Partial<InternalTsWorker> {}

declare global {
  interface Window {
    customTSWorkerFactory: (tsw: any) => typeof TsWorkerOverride;
  }
}

export interface WorkerOverrideProps {
  setSuggestionName(name: string): Promise<void>;
}

// Partial is required here as we only need to provide some subclass methods
// However, we must implement all of our override methods, as there is no superclass
//  implementation present!
export interface WorkerSubclass extends Partial<InternalTsWorker>, WorkerOverrideProps {}

// Implement whatever overrides we want!
self.customTSWorkerFactory = tsw => {
  return class extends tsw implements WorkerSubclass {
    private completion_name = 'test';
    constructor(...args: any) {
      console.log('New worker construction with libs', Object.keys(args[1].extraLibs));

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
