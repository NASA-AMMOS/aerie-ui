import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Parameters from './Parameters.svelte';

describe('Parameters component', () => {
  afterEach(() => {
    cleanup();
  });

  it('Should render the list of parameters in the correct order', () => {
    const formParameters: FormParameter[] = [
      {
        error: null,
        name: 'bar',
        order: 1,
        schema: {
          type: 'string',
        },
        value: 'value 2',
      },
      {
        error: null,
        name: 'foo',
        order: 0,
        schema: {
          type: 'string',
        },
        value: 'value 1',
      },
    ];
    const { getAllByRole } = render(Parameters, { formParameters });

    expect(getAllByRole('textbox').length).toBe(2);
    expect((getAllByRole('textbox')[0] as HTMLInputElement).value).toEqual('value 1');
    expect((getAllByRole('textbox')[1] as HTMLInputElement).value).toEqual('value 2');
  });

  it('Should render a star next to a required parameter', () => {
    const formParameters: FormParameter[] = [
      {
        error: null,
        name: 'bar',
        order: 1,
        schema: {
          type: 'string',
        },
        value: 'value 2',
      },
      {
        error: null,
        name: 'foo',
        order: 0,
        required: true,
        schema: {
          type: 'string',
        },
        value: 'value 1',
      },
    ];
    // Get the DOM from the render call, this should be our Parameter component
    const { container } = render(Parameters, { formParameters });

    // Get the labels by class - generally avoided pattern in testing-library but this is a
    // particularly custom component so unavoidable.
    const labels = container.getElementsByClassName('name');

    expect(labels.length).toBe(2);
    expect(labels[0].getElementsByClassName('required').length).to.equals(1);
    expect(labels[1].getElementsByClassName('required').length).to.equals(0);
  });
});
