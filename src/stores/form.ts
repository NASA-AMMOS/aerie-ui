import { writable } from 'svelte/store';
import type { Field, ValidatorFn } from '../types';
import { validate } from '../utilities/validators';

function initialField<T>(
  initialValue: T,
  initialValidators: ValidatorFn<T>[] = [],
): Field<T> {
  return {
    dirty: false,
    dirtyAndValid: false,
    errors: [],
    firstError: null,
    initialValue,
    invalid: false,
    pristine: true,
    touched: false,
    touchedAndValid: false,
    valid: true,
    validators: initialValidators,
    value: initialValue,
  };
}

export function field<T>(
  initialValue: T,
  initialValidators: ValidatorFn<T>[] = [],
) {
  const field: Field<T> = initialField(initialValue, initialValidators);
  const { set, subscribe, update } = writable<Field<T>>(field);

  return {
    async set(newField: Field<T>) {
      const dirty = newField.initialValue !== newField.value;
      const errors = await validate(newField.validators, newField.value);
      const firstError = errors.length ? errors[0] : null;
      const invalid = errors.length > 0;
      const pristine = !dirty;
      const touched = true;
      const valid = !invalid;
      const dirtyAndValid = dirty && valid;
      const touchedAndValid = touched && valid;

      return set({
        ...newField,
        dirty,
        dirtyAndValid,
        errors,
        firstError,
        invalid,
        pristine,
        touched,
        touchedAndValid,
        valid,
      });
    },
    subscribe,
    update,
  };
}
