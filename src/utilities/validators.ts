import type { ValidationResult, ValidatorFn } from '../types';

export async function validate<T>(
  validators: ValidatorFn<T>[],
  value: T,
): Promise<string[]> {
  const errors: string[] = [];

  for (const validator of validators) {
    const error = await validator(value);

    if (error !== null) {
      errors.push(error);
    }
  }

  return errors;
}

export function min(min: number): (value: number) => Promise<ValidationResult> {
  return (value: number): Promise<ValidationResult> => {
    if (value < min) {
      return Promise.resolve(`Field cannot be less than ${min}`);
    } else {
      return Promise.resolve(null);
    }
  };
}

export function required(value: number | string): Promise<ValidationResult> {
  if (
    (typeof value === 'number' && Number.isNaN(value as number)) ||
    (typeof value === 'string' && value === '')
  ) {
    return Promise.resolve('Field is required');
  } else {
    return Promise.resolve(null);
  }
}

export function timestamp(value: string): Promise<ValidationResult> {
  const re =
    /^(\d{4})-((?=\d*[1-9])\d{3})T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?$/;
  const match = re.exec(value);
  const error = 'DOY format required: YYYY-DDDThh:mm:ss';

  if (match) {
    const [, , doy] = match;
    const dayOfYear = parseInt(doy, 10);
    if (dayOfYear > 0 && dayOfYear < 366) {
      return Promise.resolve(null);
    } else {
      return Promise.resolve('Day-of-year must be between 0 and 365');
    }
  } else {
    return Promise.resolve(error);
  }
}
