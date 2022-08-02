<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export { className as class };
  let className: string = '';
  export let value: string | number;
  export let options: (DropdownOption | DropdownCustomOption)[] = [];

  const dispatch = createEventDispatcher();

  let displayValue: string | number = value;

  $: displayValue = getDisplayValue(value, options);

  function getDisplayValue(value: string | number, options: (DropdownOption | DropdownCustomOption)[]) {
    if ((options[0] as DropdownCustomOption).value !== undefined) {
      const option = options.find((option: DropdownCustomOption) => {
        return option.value === value;
      });
      if (option !== undefined) {
        return (option as DropdownCustomOption).label;
      }
    }
    return value;
  }

  function getOptionValue(option: DropdownOption | DropdownCustomOption) {
    if ((option as DropdownCustomOption).value !== undefined) {
      return (option as DropdownCustomOption).value;
    }

    return option;
  }

  function getOptionLabel(option: DropdownOption | DropdownCustomOption) {
    if ((option as DropdownCustomOption).label !== undefined) {
      return (option as DropdownCustomOption).label;
    }

    return option;
  }

  function onChange(event: Event) {
    dispatch('change', event);
  }
</script>

<div class={`date-picker-dropdown${className ? ` ${className}` : ''}`}>
  <div class="display-value">
    <span class="value">{displayValue}</span>
    <select class="hidden" data-type="number" {value} tabindex="-1" on:change={onChange}>
      {#each options as option}
        <option value={getOptionValue(option)}>{getOptionLabel(option)}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  .date-picker-dropdown {
    position: relative;
  }

  .date-picker-dropdown .display-value {
    display: inline-block;
    position: relative;
    min-width: 0;
  }

  .display-value .value {
    font-weight: bold;
  }

  .date-picker-dropdown select {
    position: absolute;
    left: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
