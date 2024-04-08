<svelte:options immutable={true} />

<script lang="ts">
  // This uses JS number to represents arguments which shoul

  // ("+" | "-")? (@digit ("_" | @digit)* ("." ("_" | @digit)*)? | "." @digit ("_" | @digit)*)
  // (("e" | "E") ("+" | "-")? ("_" | @digit)+)? |
  // @digit ("_" | @digit)* "n" |

  import { isFswCommandArgumentInteger, isFswCommandArgumentUnsigned, type NumberArg } from './utils';

  // const PAT_INT = "^[-+]?\\d+$";
  // const PAT_FLOAT = "^[-+]?\\d+\.?\\d*$";

  export let argDef: NumberArg;
  export let initVal: string;
  export let setInEditor: (val: string) => void;

  // $: pattern = isFswCommandArgumentUnsigned(argDef) ? PAT_INT : PAT_FLOAT;

  $: max = argDef.range?.max ?? Infinity;
  $: min =
    argDef.range?.min ?? (isFswCommandArgumentUnsigned(argDef) || isFswCommandArgumentInteger(argDef) ? 0 : -Infinity);
  $: value = initVal;
  $: {
    const valFloat = Number(value);
    //  && valFloat > min && valFloat < max
    if (value && !isNaN(valFloat)) {
      setInEditor(value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function customValidate(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    // const val = (e.target as HTMLInputElement).value;
    const numVal = Number(value);
    if (numVal < min) {
      (e.target as HTMLInputElement).setCustomValidity('value is too low');
    } else if (numVal > max) {
      (e.target as HTMLInputElement).setCustomValidity('value is too low');
    } else {
      (e.target as HTMLInputElement).setCustomValidity('');
    }
  }
</script>

<div>
  <input class="st-input" type="string" bind:value required />
  <!-- {pattern} -->
  <!-- on:input={customValidate} -->
</div>

<style>
  input {
    width: 90%;
  }

  input:invalid {
    color: red;
  }
</style>
