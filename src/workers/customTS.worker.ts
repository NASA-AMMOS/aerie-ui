/* eslint-disable sort-keys */
import ts, { type NodeArray } from 'typescript';
import type { Diagnostic, TypeScriptWorker as InternalTsWorker } from '../types/monaco-internal';
import { generateSequencingDiagnostics } from './sequencingDiagnostics';

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
// However, we must implement all of our override methods, as there is no superclass implementation present!
export interface WorkerSubclass extends Partial<InternalTsWorker>, WorkerOverrideProps {}

// Implement whatever overrides we want!
self.customTSWorkerFactory = tsw => {
  return class extends tsw implements WorkerSubclass {
    constructor(...args: any) {
      super(...args);
    }

    /**
     * Note: Be very careful when overriding completions to make sure you
     * are not overriding default completions.
     */
    async getCompletionsAtPosition(fileName: string, position: number) {
      const completions = await super.getCompletionsAtPosition(fileName, position);
      return completions;
    }

    async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
      const program = this._languageService.getProgram();
      console.log(super.getExtraLibs());

      if (super.getExtraLibs()['command-types.ts']) {
        let ss = super.getExtraLibs()['command-types.ts'];
        ss = {
          content: `/**
        * This command will turn on the oven
        * @param {number} minutes - The duration in minutes.
        * @range {minutes} [min=0,max=120] - The minimum valid value for minutes.
        * @param temperature Set the oven temperature
        * @range {temperature} [min=0,max=60] - The minimum valid value for minutes.
        */
       function PREHEAT_OVEN(...args: [{ temperature: U8 }]) {
         return ImmediateStem.new({
           stem: 'PREHEAT_OVEN',
           arguments: args,
         }) as PREHEAT_OVEN_IMMEDIATE;
       }`,
          version: 1,
        };

        if (program === undefined) {
          return [];
        }
        const tc = program.getTypeChecker();

        const commandSource = ts.createSourceFile('command-types.ts', ss.content, ts.ScriptTarget.ESNext);

        // const defaultCompilerHost = ts.createCompilerHost({});
        const defaultCompilerHost: ts.CompilerHost = {
          getDefaultLibFileName(options: ts.CompilerOptions) {
            return '';
          },
          getSourceFile(fileName: string, languageVersion: ts.ScriptTarget) {
            return commandSource;
          },
          writeFile: function (
            fileName: string,
            text: string,
            writeByteOrderMark: boolean,
            onError?: (message: string) => void,
            sourceFiles?: readonly ts.SourceFile[],
            data?: ts.WriteFileCallbackData,
          ): void {
            throw new Error('Function not implemented.');
          },
          getCurrentDirectory: function (): string {
            return '';
          },
          getCanonicalFileName: function (fileName: string): string {
            return 'command-types.ts';
          },
          useCaseSensitiveFileNames: function (): boolean {
            return false;
          },
          getNewLine: function (): string {
            throw new Error('Function not implemented.');
          },
          fileExists: function (fileName: string): boolean {
            return true;
          },
          readFile: function (fileName: string): string {
            return ss.content;
          },
        };

        const programm = ts.createProgram(
          [''],
          { lib: ['lib.esnext.d.ts'], module: ts.ModuleKind.ES2022, sourceMap: true, target: ts.ScriptTarget.ESNext },
          defaultCompilerHost,
        );

        const edslTS = programm.getTypeChecker();

        // ts.createProgram([commandSource.fileName], {
        // lib: ['lib.esnext.d.ts'],
        // module: ts.ModuleKind.ES2022,
        // sourceMap: true,
        // target: ts.ScriptTarget.ESNext,
        // });

        // Get the source file and find the function declaration
        const sourceFile = program.getSourceFiles()[0];
        let functionNode;

        ts.forEachChild(commandSource, node => {
          if (ts.isFunctionDeclaration(node) && node.name?.text === 'PREHEAT_OVEN') {
            functionNode = node;
          }
        });

        // Find the parameter declaration

        const parameter = functionNode.parameters[0];
        console.log('Parameter:', parameter.name.text);

        debugger;
        // Get the type of the parameter
        const parameterType = edslTS.getTypeAtLocation(parameter);
        console.log('Parameter Type:', parameter.symbol?.name);

        const jsDocTags = ts.getJSDocTags(functionNode);
        if (jsDocTags) {
          jsDocTags.forEach(tag => {
            console.log('JSDoc Tag:', tag.tagName.text, tag.comment, tag.kind);
            if (tag.tagName.text === 'range') {
              if (tag.comment) {
                // Check if the comment is a NodeArray of JSDocText
                console.log(typeof tag.comment !== 'string');
                if (typeof tag.comment !== 'string') {
                  const commentNodes = tag.comment as NodeArray<ts.JSDocText>;
                  commentNodes.forEach(commentNode => {
                    console.log(`Comment: ${commentNode.text}`);
                  });
                } else {
                  const t = this.parseJSDocCommentToRange(tag.comment);

                  console.log(`Comment: ${tag.comment}`);
                }
              }
            }
          });
        }
      }

      const diagnostics = await super.getSemanticDiagnostics(fileName);
      diagnostics.push(...generateSequencingDiagnostics(fileName, this._languageService));

      return diagnostics;
    }

    parseJSDocCommentToRange(jsDocComment: string): {
      description: string | undefined;
      max: number;
      min: number;
      parameter: string;
    } | null {
      const rangeRegex = /\{([^}]+)}\s+\[(.+?)=(.+?),(.+?)=(.+?)\]\s+-\s+(.+)/gm;
      const rangeMatch = rangeRegex.exec(jsDocComment);

      if (rangeMatch.groups) {
        const parameter = rangeMatch.groups[1];
        const rangeMinValue = rangeMatch.groups[3];
        const rangeMaxValue = rangeMatch.groups[5];
        const description = rangeMatch.groups[6] ?? undefined;

        const result = {
          min: Number(rangeMinValue),
          max: Number(rangeMaxValue),
          parameter: parameter,
          description,
        };

        return result;
      }
      return null;
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
