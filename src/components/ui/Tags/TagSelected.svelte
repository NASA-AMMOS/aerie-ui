<svelte:options immutable={true} />

<script lang="ts">
  import type { ObjectOption } from 'svelte-multiselect';
  import Tag from './Tag.svelte';

  export let option: ObjectOption;
  $: optionAsTag = {
    color: option.color as string,
    name: typeof option === 'string' ? (option as Option) : ((option.name || option.label) as string),
  };
  $: console.log('option :>> ', option);
  $: console.log('optionAsTag :>> ', optionAsTag);
</script>

<div class="tag-selected" style:background={`${option.color}`}><Tag tag={optionAsTag}>{option.name}</Tag></div>

<style>
  .tag-selected {
    border-radius: 16px;
    padding-right: 14px;
  }
</style>
