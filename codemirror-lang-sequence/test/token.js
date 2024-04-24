/* eslint-disable no-undef */

import { SeqLanguage } from '../dist/index.js';
import assert from 'assert';
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const ERROR = '⚠';
const STEM_TOKEN = 'Stem';
const LINE_COMMENT_TOKEN = 'LineComment';
const METADATA_TOKEN = 'Metadata';
const METADATA_ENTRY_TOKEN = 'MetaEntry';

function getMetaValueType(node) {
  return node.firstChild.nextSibling.firstChild.name;
}

describe('metadata', () => {
  it('primitive types', () => {
    const input = `
@METADATA "name 1" "string val"
@METADATA "name 2" false
@METADATA "name3" 3
@METADATA "name4" 4e1
C STEM
`;
    const parseTree = SeqLanguage.parser.parse(input);
    assertNoErrorNodes(input);
    const topLevelMetaData = parseTree.topNode.getChild(METADATA_TOKEN);
    const metaEntries = topLevelMetaData.getChildren(METADATA_ENTRY_TOKEN);
    assert.equal(metaEntries.length, 4);
    assert.equal(getMetaValueType(metaEntries[0]), 'String');
    assert.equal(getMetaValueType(metaEntries[1]), 'Boolean');
    assert.equal(getMetaValueType(metaEntries[2]), 'Number');
    assert.equal(getMetaValueType(metaEntries[3]), 'Number');
  });

  it('structured types', () => {
    // @METADATA "name 1" {
    //   "level1": {
    //     "level2": [
    //       false,
    //       1,
    //       "two"
    //     ]
    //   }
    // }

    const input = `
@METADATA "name 1" [ 1,2  , 3 ]
@METADATA "name 2" ["a", "b space"  ,
  "CCCC" ]
C STEM
`;
    const parseTree = SeqLanguage.parser.parse(input);
    assertNoErrorNodes(input);
    const topLevelMetaData = parseTree.topNode.getChild(METADATA_TOKEN);
    const metaEntries = topLevelMetaData.getChildren(METADATA_ENTRY_TOKEN);
    assert.equal(metaEntries.length, 2);
  });
});

describe('error positions', () => {
  for (const { testname, input, first_error } of [
    {
      first_error: 7,
      input: 'FSW_CMD%',
      testname: 'bad stem ending',
    },
    {
      first_error: 3,
      input: 'FOO$BAR^BAZ',
      testname: 'bad stem',
    },
    {
      first_error: 4,
      input: 'FOO "',
      testname: 'bad string arg',
    },
    {
      first_error: 6,
      input: 'CMD 12,34',
      testname: 'bad number arg',
    },
    {
      first_error: 24,
      input: `COM 12345
  COM "dsa"
  @UNKNOWN DIRECTIVE`,
      testname: 'good and bad commands',
    },
  ]) {
    it(testname, () => {
      const cursor = SeqLanguage.parser.parse(input).cursor();
      do {
        const { node } = cursor;
        if (node.type.name === ERROR) {
          assert.strictEqual(cursor.from, first_error);
          break;
        }
      } while (cursor.next());
    });
  }
});

describe('seqfiles', () => {
  const seqDir = path.dirname(fileURLToPath(import.meta.url)) + '/sequences';
  for (const file of readdirSync(seqDir)) {
    if (!/\.txt$/.test(file)) {
      continue;
    }

    const name = /^[^.]*/.exec(file)[0];
    it(name, () => {
      const input = readFileSync(path.join(seqDir, file), 'utf8');
      // printNodes(input, (ttype) => ttype === ERROR);
      assertNoErrorNodes(input);
    });
  }
});

describe('token positions', () => {
  it('comment indentation', () => {
    const input = `#COMMENT01
# COMMENT2

CMD0


    COMMAND_01   ARG3       "ARG4" 5


  # COMMENT3


      COMMAND___002      "str_arg_2_0"    "str_arg_2_1"

@METADATA "md3" "foobar"`;
    const nodeLocation = (input, nodeText, position) => {
      const from = input.indexOf(nodeText, position);
      return {
        from,
        to: from + nodeText.length,
      };
    };
    const expectedCommentLocations = {
      [LINE_COMMENT_TOKEN]: [
        nodeLocation(input, '#COMMENT01'),
        nodeLocation(input, '# COMMENT2'),
        nodeLocation(input, '# COMMENT3'),
      ],
      [STEM_TOKEN]: [
        nodeLocation(input, 'CMD0'),
        nodeLocation(input, 'COMMAND_01'),
        nodeLocation(input, 'COMMAND___002'),
      ],
    };
    const actualCommentLocations = {};
    assertNoErrorNodes(input);
    const parseTree = SeqLanguage.parser.parse(input);
    const cursor = parseTree.cursor();
    do {
      const { node } = cursor;
      // printNode(input, node);
      if ([LINE_COMMENT_TOKEN, STEM_TOKEN].includes(node.type.name)) {
        const { to, from } = node;
        if (actualCommentLocations[node.type.name] === undefined) {
          actualCommentLocations[node.type.name] = [];
        }
        actualCommentLocations[node.type.name].push({ from, to });
      }
    } while (cursor.next());
    assert.deepStrictEqual(expectedCommentLocations, actualCommentLocations);

    const cmd2 = parseTree.topNode.getChild('Commands').getChildren('Command')[2];
    const cmd2args = cmd2.getChild('Args');
    assert.strictEqual('"str_arg_2_0"', nodeContents(input, cmd2args.getChildren('String')[0]));
    assert.strictEqual('"str_arg_2_1"', nodeContents(input, cmd2args.getChildren('String')[1]));
    assert.strictEqual('"str_arg_2_1"', nodeContents(input, cmd2args.firstChild.nextSibling));
    assert.strictEqual(null, cmd2args.firstChild.nextSibling.nextSibling); // only 2 arguments

    const cmd2meta = cmd2.getChild(METADATA_TOKEN).getChild(METADATA_ENTRY_TOKEN);
    assert.strictEqual('"md3"', nodeContents(input, cmd2meta.getChild('Key')));
    assert.strictEqual('"foobar"', nodeContents(input, cmd2meta.getChild('Value')));
  });
});

function assertNoErrorNodes(input) {
  const cursor = SeqLanguage.parser.parse(input).cursor();
  do {
    const { node } = cursor;
    assert.notStrictEqual(node.type.name, ERROR);
  } while (cursor.next());
}

function nodeContents(input, node) {
  return input.substring(node.from, node.to);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNode(input, node) {
  console.log(`${node.type.name}[${node.from}.${node.to}] --> '${nodeContents(input, node)}'`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function printNodes(input, filter) {
  const cursor = SeqLanguage.parser.parse(input).cursor();
  do {
    const { node } = cursor;
    if (!filter || filter(node.type.name)) {
      printNode(input, node);
    }
  } while (cursor.next());
}
