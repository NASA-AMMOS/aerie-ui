<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DatePicker from '../ui/DatePicker/DatePicker.svelte';
  import FieldError from './FieldError.svelte';

  export let field: FieldStore<any>;
  export let name: string = '';
  export let label: string = '';

  const dispatch = createEventDispatcher();

  async function onChange({ detail: event }: CustomEvent) {
    const { value } = event;
    const valid = await field.validateAndSet(value);
    dispatch('change', { valid });
  }

  async function onKeyDown({ detail: event }: CustomEvent) {
    const { key } = event;

    if (key === 'Enter') {
      event.preventDefault();
      const { value } = event;
      const valid = await field.validateAndSet(value);
      dispatch('keydown', { valid });
    }
  }
</script>

<fieldset>
  <label class={$field.invalid ? 'error' : ''} for={name}>{label}</label>
  <DatePicker {name} hasError={$field.invalid} on:change={onChange} on:keydown={onKeyDown} />
  <FieldError {field} />
</fieldset>
