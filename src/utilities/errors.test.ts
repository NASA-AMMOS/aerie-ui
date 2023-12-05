import { describe, expect, test } from 'vitest';
import {
  ErrorTypes,
  generateActivityValidationErrorRollups,
  isInstantiationError,
  isUnknownTypeError,
  isValidationNoticesError,
} from './errors';

describe('Errors Util', () => {
  test('isInstantiationError - Should correctly determine if the error is an instantiation error', () => {
    expect(
      isInstantiationError({
        errors: {
          extraneousArguments: [],
          missingArguments: [],
          unconstructableArguments: [],
        },
        success: false,
        type: ErrorTypes.INSTANTIATION_ERRORS,
      }),
    ).toEqual(true);

    expect(
      isInstantiationError({
        errors: {
          noSuchActivityError: {
            activity_type: 'foobar',
            message: '',
          },
        },
        success: false,
        type: ErrorTypes.NO_SUCH_ACTIVITY_TYPE,
      }),
    ).toEqual(false);
  });

  test('isUnknownTypeError - Should correctly determine if the error is an instantiation error', () => {
    expect(
      isUnknownTypeError({
        errors: {
          noSuchActivityError: {
            activity_type: 'foobar',
            message: '',
          },
        },
        success: false,
        type: ErrorTypes.NO_SUCH_ACTIVITY_TYPE,
      }),
    ).toEqual(true);

    expect(
      isUnknownTypeError({
        errors: {
          extraneousArguments: [],
          missingArguments: [],
          unconstructableArguments: [],
        },
        success: false,
        type: ErrorTypes.INSTANTIATION_ERRORS,
      }),
    ).toEqual(false);
  });

  test('isValidationNoticesError - Should correctly determine if the error is a validation error', () => {
    expect(
      isValidationNoticesError({
        errors: {
          validationNotices: [
            {
              message: '',
              subjects: ['fuu', 'bur'],
            },
          ],
        },
        success: false,
        type: ErrorTypes.VALIDATION_NOTICES,
      }),
    ).toEqual(true);

    expect(
      isValidationNoticesError({
        errors: {
          extraneousArguments: [],
          missingArguments: [],
          unconstructableArguments: [],
        },
        success: false,
        type: ErrorTypes.INSTANTIATION_ERRORS,
      }),
    ).toEqual(false);
  });

  test('generateActivityValidationErrorRollups - Should generate an accurate count of the types of errors per activity', () => {
    expect(
      generateActivityValidationErrorRollups([
        {
          activityId: 1,
          errors: [
            {
              errors: {
                extraneousArguments: ['foo', 'bar'],
                missingArguments: ['baz'],
                unconstructableArguments: [
                  {
                    failure: '',
                    name: 'buzz',
                  },
                ],
              },
              success: false,
              type: ErrorTypes.INSTANTIATION_ERRORS,
            },
            {
              errors: {
                noSuchActivityError: {
                  activity_type: 'foobar',
                  message: '',
                },
              },
              success: false,
              type: ErrorTypes.NO_SUCH_ACTIVITY_TYPE,
            },
            {
              errors: {
                validationNotices: [
                  {
                    message: '',
                    subjects: ['fuu', 'bur'],
                  },
                ],
              },
              success: false,
              type: ErrorTypes.VALIDATION_NOTICES,
            },
          ],
          type: 'banana',
        },
      ]),
    ).toEqual([
      {
        errorCounts: {
          extra: 2,
          invalidAnchor: 0,
          invalidParameter: 3,
          missing: 1,
          outOfBounds: 0,
          wrongType: 1,
        },
        id: 1,
        location: ['foo', 'bar', 'baz', 'buzz', 'fuu', 'bur'],
        type: 'banana',
      },
    ]);
  });
});
