import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import effects from '../../../src/utilities/effects';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Plans from './index.svelte';
import * as subscribable from '../../stores/subscribable';

describe('Plans view', () => {
  beforeAll(() => {
    vi.spyOn(subscribable, 'gqlSubscribable').mockResolvedValue({} as GqlSubscribable<unknown>);
    vi.spyOn(effects, 'getPlansAndModels').mockResolvedValue({
      models: [],
      plans: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('Should update the duration string when both start and end times are valid', async () => {
    const { getByLabelText } = render(Plans);

    fireEvent.blur(getByLabelText('Start Time', { exact: false }), { target: { value: '2022-010T00:00:00' } });
    fireEvent.blur(getByLabelText('End Time', { exact: false }), { target: { value: '2022-100T00:00:00' } });

    await waitFor(() => {
      expect((getByLabelText('Plan Duration') as HTMLInputElement).value).toEqual('0y 90d 0h 0m 0s 0ms 0us');
    });
  });

  it('Should not update the duration string when the start or end times are invalid', async () => {
    const { getByLabelText } = render(Plans);

    fireEvent.blur(getByLabelText('Start Time', { exact: false }), { target: { value: '2022-010T00' } });
    fireEvent.blur(getByLabelText('End Time', { exact: false }), { target: { value: '2022-100T00:00:00' } });

    await waitFor(() => {
      expect((getByLabelText('Plan Duration') as HTMLInputElement).value).toEqual('None');
    });
  });
});
