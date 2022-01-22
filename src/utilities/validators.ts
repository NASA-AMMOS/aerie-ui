import type { ValidatorFn } from '../types';

export function validate<T>(validators: ValidatorFn<T>[], value: T): string[] {
  const errors: string[] = [];

  for (const validator of validators) {
    const error = validator(value);

    if (error !== null) {
      errors.push(error);
    }
  }

  return errors;
}

export function required(value: number | string): string | null {
  if (
    (typeof value === 'number' && Number.isNaN(value as number)) ||
    (typeof value === 'string' && value === '')
  ) {
    return 'Field is required';
  }
  return null;
}

export function timestamp(value: string): string | null {
  const re =
    /^(\d{4})-((?=\d*[1-9])\d{3})T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?$/;
  const match = re.exec(value);
  const error = 'DOY format required: YYYY-DDDThh:mm:ss';

  if (match) {
    const [, , doy] = match;
    const dayOfYear = parseInt(doy, 10);
    if (dayOfYear > 0 && dayOfYear < 366) {
      return null;
    } else {
      return 'Day-of-year must be between 0 and 365';
    }
  } else {
    return error;
  }
}
