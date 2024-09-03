import type { SyntaxNode } from '@lezer/common';
import { readFileSync } from 'fs';
import { assert, describe, expect, test } from 'vitest';
import { CdlLanguage, TOKEN_ERROR } from './cdl';
// import { parseStem } from './cdlParser';

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

  //   test('stem parsing', () => {
  //     const input = `
  // STEM : CMD_TEST1 ( ccode : 1, data : 2 )

  // cmd-type : INST

  // READ ARGUMENT arg_1
  // READ ARGUMENT arg_2

  // ccode := [ 1 ] '07E9' HEX

  // data := crm_opcode_0x07//crm_macro//[1920]'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'BINARY

  // !@ ATTACHMENT : desc
  // !@    "Terminates macro definition."
  // !@ END ATTACHMENT

  // !@ ATTACHMENT : tci
  // !@    "No specific telemetry measurement(s) identified."
  // !@ END ATTACHMENT

  // !@ ATTACHMENT : con
  // !@    "Routed to the same message ID in FSW as the CRM_PASS_THRU command.  This command will be rejected if no macro is being defined."
  // !@ END ATTACHMENT

  // !@ ATTACHMENT : imm
  // !@    "Yes"
  // !@ END ATTACHMENT

  // !@ ATTACHMENT : res
  // !@    "See MRO-03-0080 Flight Rules and Constraints"
  // !@ END ATTACHMENT

  // !@ ATTACHMENT : seq
  // !@    "Yes"
  // !@ END ATTACHMENT

  // END STEM

  // STEM : CRM_ROM_BOOT ( ccode : 16, data : 1936 )

  //     `;

  //     // printNodes(input);
  //     assertNoErrorNodes(input);
  //   });
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
        printNodes(input.substring(0, node.to + 10));
        console.log(input.substring(0, node.to));
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNodes(input: string, filter?: (name: string) => boolean, limit?: number) {
  const cursor = CdlLanguage.parser.parse(input).cursor();
  let count = 0;
  do {
    const { node } = cursor;
    if (!filter || filter(node.type.name)) {
      printNode(input, node);
    }
    count++;
  } while (cursor.next() && count < (limit ?? Infinity));
}
