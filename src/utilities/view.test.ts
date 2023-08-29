import { describe, expect, test } from 'vitest';
import { generateDefaultView, validateViewJSONAgainstSchema } from './view';

describe('generateDefaultView', () => {
  test('Should generate a valid view', async () => {
    const view = generateDefaultView(
      [],
      [
        { definition: { schema: { type: 'boolean' } }, name: 'resource1' },
        { definition: { schema: { type: 'int' } }, name: 'resource2' },
        { definition: { schema: { items: { type: 'boolean' }, type: 'series' } }, name: 'resource2' },
      ],
    );
    const { valid, errors } = validateViewJSONAgainstSchema(view.definition);
    expect(errors).to.deep.equal([]);
    expect(valid).toBe(true);
  });
});
