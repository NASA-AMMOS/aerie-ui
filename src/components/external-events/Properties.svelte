<svelte:options immutable={true} />

<script lang="ts">
  import type { Property } from '../../types/property';
  import { compare } from '../../utilities/generic';
  import Highlight from '../ui/Highlight.svelte';
  import PropertyBase from './PropertyBase.svelte';
  import PropertyRec from './PropertyRec.svelte';

  export let formProperties: Property[] = [];
  export let highlightKeysMap: Record<string, boolean> = {};

  $: sortedFormProperties = formProperties.sort((a, b) => compare(a.name, b.name));
</script>

<div>
  {#each sortedFormProperties as formProperty (formProperty.name)}
    <Highlight highlight={highlightKeysMap[formProperty.name]}>
      {#if typeof formProperty.value === 'string' || typeof formProperty.value === 'number'}
        <PropertyBase {formProperty} {highlightKeysMap} />
      {:else if typeof formProperty.value === 'object'}
        <PropertyRec {formProperty} {highlightKeysMap} />
      {/if}
    </Highlight>
  {/each}
</div>

<style>
</style>
