<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import type { Writable } from 'svelte/store';
  import type { Field, ValidationResult } from '../../types';
  import { getTarget } from '../../utilities/generic';
  import { tooltip } from '../../utilities/tooltip';
  import { validateField } from '../../utilities/validators';

  const dispatch = createEventDispatcher();

  export let field: Writable<Field<any>>;

  let container: HTMLFieldSetElement;
  let error: HTMLDivElement | null;
  let input: HTMLInputElement | null;
  let label: HTMLLabelElement | null;
  let select: HTMLSelectElement | null;

  $: if (container && field && input) {
    if (input.value !== $field.value) {
      input.value = $field.value;
    }

    if ($field.invalid) {
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  }

  $: if (container && field && label) {
    if ($field.invalid) {
      label.classList.add('error');
    } else {
      label.classList.remove('error');
    }
  }

  $: if (container && field && select) {
    if (select.value !== $field.value) {
      select.value = $field.value;
    }

    if ($field.invalid) {
      select.classList.add('error');
    } else {
      select.classList.remove('error');
    }
  }

  $: if (error && field) {
    const errorMessageDiv = error.querySelector('div');
    if ($field.invalid) {
      errorMessageDiv.innerHTML = $field.firstError;
    } else {
      errorMessageDiv.innerHTML = '';
    }
  }

  onMount(() => {
    input = container.querySelector('input');
    label = container.querySelector('label');
    select = container.querySelector('select');

    if (input) {
      input.addEventListener('blur', onBlur);
      input.addEventListener('input', onInput);
      input.value = $field.value;
    }

    if (select) {
      select.addEventListener('blur', onBlur);
      select.addEventListener('input', onInput);
      select.value = $field.value;
    }
  });

  onDestroy(() => {
    if (input) {
      input.removeEventListener('blur', onBlur);
      input.removeEventListener('input', onInput);
    }

    if (select) {
      select.removeEventListener('blur', onBlur);
      select.removeEventListener('input', onInput);
    }
  });

  function onBlur(event: FocusEvent) {
    const { value } = getTarget(event);
    $field.value = value;
    $field.pending = true;
    validateField($field).then((errors: ValidationResult[]) => {
      $field.errors = errors;
      $field.pending = false;
      if ($field.valid) {
        dispatch('valid');
      }
    });
  }

  function onInput(event: Event) {
    const { value } = getTarget(event);
    $field.value = value;
  }
</script>

<fieldset bind:this={container}>
  <slot name="label" />
  <slot>No input element provided!</slot>
  {#if $$slots.error && $field.invalid}
    <div
      bind:this={error}
      class="error"
      use:tooltip={{
        content: $field.firstError,
        maxWidth: 'none',
        placement: 'bottom',
        theme: 'error',
      }}
    >
      <slot name="error" />
    </div>
  {/if}
</fieldset>

<style>
  fieldset {
    border: 0;
    margin: 0;
  }

  .error {
    cursor: default;
    display: table;
    table-layout: fixed;
    width: 100%;
  }

  .error > :global(div) {
    color: var(--st-red);
    display: table-cell;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
