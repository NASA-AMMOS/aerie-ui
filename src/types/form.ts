export type Field<T> = {
  dirty: boolean;
  dirtyAndValid: boolean;
  errors: string[];
  firstError: string;
  initialValue: T;
  invalid: boolean;
  pending: boolean;
  valid: boolean;
  validators: ValidatorFn<T>[];
  value: T;
};

export type ValidatorFn<T> = (value: T) => Promise<ValidationResult>;

export type ValidationResult = string | null;
