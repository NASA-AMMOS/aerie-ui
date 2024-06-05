import { describe, expect, it } from 'vitest';
import { TimeTypes, isTimeBalanced } from './time-utils';

describe('Sequence Editor Time Utils Tests', () => {
  it('Absolute Time', () => {
    expect(isTimeBalanced('2024-001T00:00:00', TimeTypes.ABSOLUTE)).toStrictEqual({});

    expect(isTimeBalanced('2024-001T12:90:00', TimeTypes.ABSOLUTE).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: 2024-001T13:30:00.[000]`);

    expect(isTimeBalanced('9999-365T23:59:60.999', TimeTypes.ABSOLUTE).error?.message)
      .toBe(`Time Error: Maximum time reached
Received: Balanced time - 10000-001T00:00:00.[999].
Expected: 10000-001T00:00:00.[999] <= 9999-365T23:59:59.999`);

    expect(isTimeBalanced('2024-365T23:59:60', TimeTypes.ABSOLUTE).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: 2025-000T00:00:00.[000]`);

    expect(isTimeBalanced('2023-365T23:59:60', TimeTypes.ABSOLUTE).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: 2024-001T00:00:00.[000]`);

    expect(isTimeBalanced('0000-000T00:00:00', TimeTypes.ABSOLUTE)).toStrictEqual({});

    expect(isTimeBalanced('0000-000T24:60:60', TimeTypes.ABSOLUTE).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: 0000-001T01:01:00.[000]`);

    expect(isTimeBalanced('24:60:60', TimeTypes.ABSOLUTE).error?.message)
      .toBe(`Time Error: Incorrectly formatted absolute time string.
Received : Malformed Absolute time.
Expected: YYYY-DOYThh:mm:ss[.sss]`);
  });

  it('Relative Time', () => {
    expect(isTimeBalanced('001T12:43:20.000', TimeTypes.RELATIVE)).toStrictEqual({});
    expect(isTimeBalanced('09:04:00.340', TimeTypes.RELATIVE)).toStrictEqual({});
    expect(isTimeBalanced('001T23:59:60.000', TimeTypes.RELATIVE).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: 002T00:00:00[.000]`);

    expect(isTimeBalanced('365T23:59:60.000', TimeTypes.RELATIVE).error?.message)
      .toBe(`Time Error: Maximum time reached.
Received: Balanced time - 366T00:00:00[.000].
Expected: 366T00:00:00[.000] <= 365T23:59:59.999`);

    expect(isTimeBalanced('2023-365T23:59:60', TimeTypes.RELATIVE).error?.message)
      .toBe(`Time Error: Incorrectly formatted duration string.
Received: A malformed duration.
Expected: hh:mm:ss[.sss] or DDDThh:mm:ss[.sss]`);
  });

  it('epoch Time', () => {
    expect(isTimeBalanced('+001T12:43:20.000', TimeTypes.EPOCH)).toStrictEqual({});
    expect(isTimeBalanced('-09:04:00.340', TimeTypes.EPOCH)).toStrictEqual({});
    expect(isTimeBalanced('-001T23:59:60.000', TimeTypes.EPOCH).warning?.message)
      .toBe(`Time Warning: Unbalanced time used.
Suggestion: -002T00:00:00[.000]`);

    expect(isTimeBalanced('-365T23:59:60.000', TimeTypes.EPOCH).error?.message).toBe(`Time Error: Maximum time reached.
Received: Balanced time : -366T00:00:00[.000].
Expected: -366T00:00:00[.000] >= -365T23:59:59.999`);

    expect(isTimeBalanced('365T23:59:60.000', TimeTypes.EPOCH).error?.message).toBe(`Time Error: Maximum time reached.
Received: Balanced time : 366T00:00:00[.000].
Expected: 366T00:00:00[.000] <= 365T23:59:59.999`);

    expect(isTimeBalanced('2023-365T23:59:60', TimeTypes.EPOCH).error?.message)
      .toBe(`Time Error: Incorrectly formatted duration string.
Received: A malformed duration.
Expected: [+/-]hh:mm:ss[.sss] or [+/-]DDDThh:mm:ss[.sss]`);
  });

  expect(isTimeBalanced('3:59:60', TimeTypes.EPOCH).error?.message)
    .toBe(`Time Error: Incorrectly formatted duration string.
Received: A malformed duration.
Expected: [+/-]hh:mm:ss[.sss] or [+/-]DDDThh:mm:ss[.sss]`);
});
