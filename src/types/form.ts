export type Field<T> = {
  dirty: boolean;
  errors: string[];
  firstError: string | null;
  initialValue: T;
  invalid: boolean;
  pristine: boolean;
  touched: boolean;
  touchedAndValid: boolean;
  valid: boolean;
  validators: ValidatorFn<T>[];
  value: T;
};

export type ValidatorFn<T> = (value: T) => string | null;
