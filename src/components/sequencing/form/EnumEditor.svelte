<svelte:options immutable={true} />

<script lang="ts">
  import type { CommandDictionary, FswCommandArgumentEnum } from '@nasa-jpl/aerie-ampcs';
  import { quoteEscape, unquoteUnescape } from './utils';

  export let argDef: FswCommandArgumentEnum;
  export let commandDictionary: CommandDictionary;
  export let initVal: string;
  export let setInEditor: (val: string) => void;

  let enumValues: string[];
  let isValueInEnum: boolean = false;
  let value: string;

  $: value = unquoteUnescape(initVal);
  $: enumValues = commandDictionary.enumMap[argDef.enum_name]?.values?.map(v => v.symbol) ?? argDef.range ?? [];
  $: isValueInEnum = !!enumValues.find(ev => ev === value);
  $: {
    setInEditor(quoteEscape(value));
  }
</script>

<div>
  <select class="st-select" required bind:value>
    {#if !isValueInEnum}
      <option>{value}</option>
    {/if}
    {#each enumValues as ev}
      <option>{ev}</option>
    {/each}
  </select>
</div>

<style>
  select {
    width: 90%;
  }
</style>
