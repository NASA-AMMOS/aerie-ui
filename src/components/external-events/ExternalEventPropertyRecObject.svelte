<svelte:options immutable={true} />

<script lang="ts">
  import type { ExternalEventProperty } from '../../types/external-event-property';
  import { compare } from '../../utilities/generic';
  import Collapse from '../Collapse.svelte';
  import Highlight from '../ui/Highlight.svelte';
  import ExternalEventPropertyBase from './ExternalEventPropertyBase.svelte';
  import ExternalEventPropertyRec from './ExternalEventPropertyRec.svelte';

  export let formPropertyName: string = "";
  export let formProperties: ExternalEventProperty[] = [];
  export let highlightKeysMap: Record<string, boolean> = {};

  let expanded = true;
  
  $: sortedFormProperties = formProperties.sort((a, b) => compare(a.name, b.name));
</script>

<div>
  <Collapse defaultExpanded={expanded}>
    <div slot="left">
      {formPropertyName}
    </div>
    {#each sortedFormProperties as formProperty (formProperty.name)}
      <Highlight highlight={highlightKeysMap[formProperty.name]}>
        <div>
          {#if typeof formProperty.value == 'string' || typeof formProperty.value == 'number'}
            <ExternalEventPropertyBase
              formProperty={formProperty}
              highlightKeysMap={highlightKeysMap}
            />
          {:else if typeof formProperty.value == 'object'}
            <ExternalEventPropertyRec
              formProperty={formProperty}
              highlightKeysMap={highlightKeysMap}
            />
          {/if}
        </div>
      </Highlight>
    {/each}
  </Collapse>
</div>

<style>
</style>
