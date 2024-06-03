import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ModelStatusIcon from './ModelStatusIcon.svelte';

describe('Model Status Icon', () => {
  afterEach(() => {
    cleanup();
  });

  it('Should display an error icon', () => {
    const { getByTestId } = render(ModelStatusIcon, {
      props: {
        status: 'error',
        tooltipContent: 'Test 1 tooltip',
      },
    });

    expect(getByTestId('error')).not.toBeNull();
  });

  it('Should display an check icon', () => {
    const { getByTestId } = render(ModelStatusIcon, {
      props: {
        status: 'complete',
        tooltipContent: 'Test 2 tooltip',
      },
    });

    expect(getByTestId('complete')).not.toBeNull();
  });

  it('Should not display an check icon when `showCompleteStatus` is false', () => {
    const { queryByTestId } = render(ModelStatusIcon, {
      props: {
        showCompleteStatus: false,
        status: 'complete',
        tooltipContent: 'Test 3 tooltip',
      },
    });

    expect(queryByTestId('complete')).toBeNull();
  });

  it('Should display a spinner icon', () => {
    const { getByTestId } = render(ModelStatusIcon, {
      props: {
        status: 'extracting',
        tooltipContent: 'Test 4 tooltip',
      },
    });

    expect(getByTestId('extracting')).not.toBeNull();
  });
});
