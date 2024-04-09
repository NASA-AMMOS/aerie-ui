import type { SeqJson } from '@nasa-jpl/seq-json-schema/types';
import { describe, expect, it } from 'vitest';
import { seqJsonToSequence } from './from-seq-json';

describe('from-seq-json.ts', () => {
  it('converts a seq json file to a correct sequence', () => {
    const seqJson: SeqJson = {
      id: '42',
      metadata: {},
      steps: [
        {
          args: [
            {
              type: 'boolean',
              value: true,
            },
            {
              type: 'hex',
              value: '0xFF',
            },
            {
              type: 'string',
              value: 'Hello',
            },
            {
              type: 'symbol',
              value: 'World',
            },
            {
              type: 'repeat',
              value: [
                [
                  {
                    type: 'boolean',
                    value: false,
                  },
                  {
                    type: 'hex',
                    value: '0xAA',
                  },
                  {
                    type: 'string',
                    value: 'Foo',
                  },
                  {
                    type: 'symbol',
                    value: 'BAR',
                  },
                ],
                [
                  {
                    type: 'boolean',
                    value: true,
                  },
                  {
                    type: 'hex',
                    value: '0xBB',
                  },
                  {
                    type: 'string',
                    value: 'Baz',
                  },
                  {
                    type: 'symbol',
                    value: 'BAT',
                  },
                ],
              ],
            },
          ],
          stem: 'FSW_CMD_0',
          time: {
            tag: '2024-001T00:00:00',
            type: 'ABSOLUTE',
          },
          type: 'command',
        },
        {
          args: [{ type: 'number', value: 22 }],
          stem: 'FSW_CMD_1',
          time: {
            tag: '00:01:00',
            type: 'COMMAND_RELATIVE',
          },
          type: 'command',
        },
        {
          args: [{ type: 'string', value: 'Fab' }],
          stem: 'FSW_CMD_2',
          time: {
            tag: '15:00:00',
            type: 'EPOCH_RELATIVE',
          },
          type: 'command',
        },
        {
          args: [],
          stem: 'FSW_CMD_3',
          time: {
            type: 'COMMAND_COMPLETE',
          },
          type: 'command',
        },
      ],
    };
    const sequence = seqJsonToSequence(seqJson);
    const expectedSequence = `id("42")

abs(2024-001T00:00:00) FSW_CMD_0(true, 0xFF, "Hello", World, [[false, 0xAA, "Foo", BAR], [true, 0xBB, "Baz", BAT]])
rel(00:01:00) FSW_CMD_1(22)
epc(15:00:00) FSW_CMD_2("Fab")
cpl FSW_CMD_3
`;
    expect(sequence).toEqual(expectedSequence);
  });
});
