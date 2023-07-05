/* eslint-disable sort-keys */
import ts from 'typescript';

export function generateAutoCompletion(entries: ts.CompletionEntry[], commandTypes: any): ts.CompletionEntry[] {
  if (entries.length !== 0) {
    const commandSource = ts.createSourceFile('command-types.ts', commandTypes.content, ts.ScriptTarget.ESNext);

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
        return commandTypes.content;
      },
    };

    const programm = ts.createProgram(
      [''],
      { lib: ['lib.esnext.d.ts'], module: ts.ModuleKind.ES2022, sourceMap: true, target: ts.ScriptTarget.ESNext },
      defaultCompilerHost,
    );

    const eDSLChecker = programm.getTypeChecker();

    // Find the matching node in the source code
    entries.forEach(entry => {
      const matchFunction = findMatchingFunction(entry.name, commandSource);
      if (matchFunction) {
        let functionParameters = '';
        if (matchFunction.parameters.length > 0) {
          const parameter = matchFunction.parameters[0];

          if (parameter.type && ts.isTupleTypeNode(parameter.type)) {
            const properties = parameter.type.elements.filter(ts.isTypeLiteralNode)[0]?.members;
            if (properties) {
              functionParameters = `({${properties
                .filter(ts.isPropertySignature)
                .map((property, index) => {
                  if (ts.isStringLiteral(property.name)) {
                    if (eDSLChecker.getTypeAtLocation(property).getFlags() === ts.TypeFlags.String) {
                      return `${property.name.text}: '\${${index + 1}}'`;
                    } else {
                      return `${property.name.text}: \${${index + 1}}`;
                    }
                  }
                  return '';
                })
                .join(',')}})`;
            }
          }
        }
        entry.insertText = entry.name + functionParameters + '${0}';
      }
    });
  }

  return entries;
}

function findMatchingFunction(functionName: string, source: ts.Node): ts.FunctionDeclaration | undefined {
  let matchingNode: ts.FunctionDeclaration | undefined;

  function find(currentNode: ts.Node): boolean {
    if (ts.isFunctionDeclaration(currentNode) && currentNode.name && currentNode.name.text === functionName) {
      matchingNode = currentNode;
      return true;
    }
    return ts.forEachChild(currentNode, find);
  }

  find(source);

  return matchingNode;
}
