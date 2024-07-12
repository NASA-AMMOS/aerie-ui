import type { SyntaxNode } from '@lezer/common';
import { assert, describe, it } from 'vitest';
import { TOKEN_ERROR, VmlLanguage } from './vml';

describe('vml tree', () => {
  it('module with variables', () => {
    const input = `
;**************************************************
; This module contains examples of VML constructs
;**************************************************
MODULE
VARIABLES
  DECLARE DOUBLE partial_product := 0.0
  DECLARE STRING file_base := "d:/cfg/instrument_"
END_VARIABLES

;**************************************************
; Purpose: provide a special watch for spacecraft components
;**************************************************


END_MODULE
`;
    // printNodes(input);
    assertNoErrorNodes(input);
  });

  it('module with absolute sequence', () => {
    const input = `
;**************************************************
; This module contains examples of VML constructs
;**************************************************
MODULE

ABSOLUTE_SEQUENCE master_sequence_day_154
BODY
A2003-154T10:00:00.0 SPAWN 65535 observe 12, "abc", 37.8
A2003-154T10:19:21.0 gv_success := CALL special_watch 15.1
A2003-154T10:19:45.0 CALL special_watch 18
END_BODY

END_MODULE
`;
    // printNodes(input);
    assertNoErrorNodes(input);
  });

  it('module with block', () => {
    const input = `
  ;**************************************************
  ; This module contains examples of VML constructs
  ;**************************************************
  MODULE

BLOCK special_watch
INPUT delay_time
INPUT INT mode := 3 VALUES 1..6, 8..9
DECLARE INT i := 0
DECLARE INT value := 0
DECLARE UINT mask := 0xffff
DECLARE STRING file_name := ""
DECLARE STRING str := ""
BODY

R00:00:00.1 value := delay_time + 47
R00:00:00.1 str := value
R00:00:00.1 file_name := "d:/cfg/high_gain_" CONCAT str
R00:00:00.1 mask := mask BIT_AND 0x132
R00:00:00.1 mask := BIT_NOT mask
R00:00:00.1 EXTERNAL_CALL "issue_cmd", "SSPA_LEVEL", mask i := 1
R00:00:00.1 i := 1
R00:00:00.1 WHILE i <= 5 DO
R00:00:02.0         ISSUE INCREMENT_GAIN
R00:00:00.1         i := i + 1 R00:00:00.1 END_WHILE
R00:00:00.1 FOR i := 1 to mode STEP 2 DO
R00:00:02.0         ISSUE INCREMENT_mode
R00:00:00.1 END_FOR
R00:00:00.1 IF delay_time > 100.0 THEN
R00:00:00.1         delay_time := 100.0
R00:00:00.0 ELSE_IF delay_time > 80.0 THEN
R00:00:00.1         delay_time := delay_time * 0.98
R00:00:00.0 ELSE_IF delay_time > 60.0 THEN
R00:00:00.1         delay_time := delay_time * 0.95
R00:00:00.0 ELSE_IF delay_time < 0.0 THEN
R00:00:00.1         RETURN FALSE
R00:00:00.0 ELSE
R00:00:00.1         delay_time := delay_time * 0.9
R00:00:00.0 END_IF

R00:00:00.0 DELAY_BY delay_time
R00:00:00.0 value := WAIT gv_complete = 1 TIMEOUT
R00:05:00.0 RETURN TRUE

END_BODY

END_MODULE
  `;
    printNodes(input);
    assertNoErrorNodes(input, true);
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertNoErrorNodes(input: string, printPrefix?: boolean) {
  const cursor = VmlLanguage.parser.parse(input).cursor();
  do {
    const { node } = cursor;
    if (printPrefix) {
      if (node.type.name === TOKEN_ERROR) {
        console.log(input.substring(0, node.to));
      }
    }
    assert.notStrictEqual(node.type.name, TOKEN_ERROR);
  } while (cursor.next());
}

function nodeContents(input: string, node: SyntaxNode) {
  return input.substring(node.from, node.to);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNode(input: string, node: SyntaxNode) {
  console.log(`${node.type.name}[${node.from}.${node.to}] --> '${nodeContents(input, node)}'`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNodes(input: string, filter?: (name: string) => boolean) {
  const cursor = VmlLanguage.parser.parse(input).cursor();
  do {
    const { node } = cursor;
    if (!filter || filter(node.type.name)) {
      printNode(input, node);
    }
  } while (cursor.next());
}
