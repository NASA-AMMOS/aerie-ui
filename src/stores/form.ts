import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { Field, ValidatorFn } from '../types';

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
    pending: false,
    valid: true,
    validators: initialValidators,
    value: initialValue,
  };
}

export function field<T>(
  initialValue: T,
  initialValidators: ValidatorFn<T>[] = [],
): Writable<Field<T>> {
  const field: Field<T> = initialField(initialValue, initialValidators);
  const { set, subscribe, update } = writable<Field<T>>(field);

  return {
    set(newField: Field<T>) {
      const dirty = newField.initialValue !== newField.value;
      const firstError = newField.errors.length ? newField.errors[0] : null;
      const invalid = newField.errors.length > 0;
      const valid = !invalid;
      const dirtyAndValid = dirty && valid;

      return set({
        ...newField,
        dirty,
        dirtyAndValid,
        firstError,
        invalid,
        valid,
      });
    },
    subscribe,
    update,
  };
}
