import type { SyntaxNode } from '@lezer/common';
import type { FswCommand, Header } from '@nasa-jpl/aerie-ampcs';
import { readFileSync } from 'fs';
import { assert, describe, expect, test } from 'vitest';
import { CdlLanguage, parseHeader, parseStem, TOKEN_ERROR } from './cdl';

describe('parse cdl dictionary', () => {
  const dictionaryPath = '/Users/joswig/Documents/Aerie/Juno/JNO_6.0.4_REV_M00';
  // const dictionaryPath = '/Users/joswig/Documents/Aerie/MRO/MRO_6.1.REV_W26';
  const contents = readFileSync(dictionaryPath, 'utf8');

  test('load from file', async () => {
    // console.log(contents.substring(0, 100));
    expect(true).toEqual(true);
    // printNodes(contents, (nodeName: string) => 'Cdl_program' !== nodeName, 20);
    assertNoErrorNodes(contents, true);
  });

  test('print tokens', () => {
    const parsed = CdlLanguage.parser.parse(contents);
    let cursor = parsed.cursor();
    do {
      const { node } = cursor;
      if (node.name !== TOKEN_ERROR) {
        console.log(node.type.name);
      }
    } while (cursor.next());
    cursor = parsed.cursor();
    let header: Header | undefined = undefined;
    const stems: FswCommand[] = [];
    do {
      const { node } = cursor;
      switch (node.type.name) {
        case 'Header':
          header = parseHeader(contents, node);
          break;
        case 'Processing_routine':
          stems.push(parseStem(contents, node));
          break;
      }
    } while (cursor.next());
    stems.forEach(stem => console.log(stem.stem));
    console.log(header);
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nodeContents(input: string, node: SyntaxNode) {
  // Check if this handles skipped nodes correctly
  return input.substring(node.from, node.to);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertNoErrorNodes(input: string, printPrefix?: boolean) {
  const cursor = CdlLanguage.parser.parse(input).cursor();
  do {
    const { node } = cursor;
    if (printPrefix) {
      if (node.type.name === TOKEN_ERROR) {
        // printNodes(input.substring(0, node.to + 10));
        console.log(`${input.substring(node.to - 60, node.to)}\nXXXXXX\n${input.substring(node.to, node.to + 60)}`);
      }
    }
    assert.notStrictEqual(node.type.name, TOKEN_ERROR);
  } while (cursor.next());
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNode(input: string, node: SyntaxNode) {
  console.log(`${node.type.name}[${node.from}.${node.to}] --> '''${nodeContents(input, node)}'''`);
  // console.log(`${node.type.name}`);
}
