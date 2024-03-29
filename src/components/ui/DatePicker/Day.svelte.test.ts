import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Day from './Day.svelte';

describe('DatePicker Day Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('Should render the DOY and day of month', () => {
    const { getByText } = render(Day, {
      date: new Date(Date.UTC(2020, 2, 15)),
      maxDate: new Date(Date.UTC(2023, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 2,
      selectedDate: null,
    });

    expect(getByText('75')).not.toBeNull();
    expect(getByText('15')).not.toBeNull();
  });

  it('Should not have any indicators present', () => {
    const { container } = render(Day, {
      date: new Date(Date.UTC(2020, 2, 15)),
      maxDate: new Date(Date.UTC(2023, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 2,
      selectedDate: null,
    });

    expect(container.querySelector('.is-selected')).toBeNull();
    expect(container.querySelector('.is-today')).toBeNull();
    expect(container.querySelector('.is-outside-current-month')).toBeNull();
    expect(container.querySelector('.is-outside-bounds')).toBeNull();
  });

  it('Should indicate that the day is the current selected date', () => {
    const { container } = render(Day, {
      date: new Date(Date.UTC(2020, 2, 15)),
      maxDate: new Date(Date.UTC(2023, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 2,
      selectedDate: new Date(Date.UTC(2020, 2, 15)),
    });

    expect(container.querySelector('.is-selected')).not.toBeNull();
  });

  it('Should indicate that the day is today', () => {
    const { container } = render(Day, {
      date: new Date(),
      maxDate: new Date(Date.UTC(2023, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 2,
    });

    expect(container.querySelector('.is-today')).not.toBeNull();
  });

  it('Should indicate that the day is outside the current month', () => {
    const { container } = render(Day, {
      date: new Date(Date.UTC(2020, 2, 15)),
      maxDate: new Date(Date.UTC(2023, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 3,
    });

    expect(container.querySelector('.is-outside-current-month')).not.toBeNull();
  });

  it('Should be disabled if outside of the min/max range', () => {
    const { container } = render(Day, {
      date: new Date(Date.UTC(2020, 2, 15)),
      maxDate: new Date(Date.UTC(2019, 1, 1)),
      minDate: new Date(Date.UTC(2018, 1, 1)),
      month: 2,
    });

    expect(container.querySelector('.is-outside-bounds')).not.toBeNull();
  });
});
