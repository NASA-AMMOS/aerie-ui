<svelte:options immutable={true} />

<script lang="ts">
  import type { ExternalEventProperty } from '../../types/external-event-property';
  import { compare } from '../../utilities/generic';
  import ExternalEventPropertyRecObject from './ExternalEventPropertyRecObject.svelte';
  
  export let formProperty: ExternalEventProperty;
  export let highlightKeysMap: Record<string, boolean> = {};

  $: formProperties = formProperty.value === undefined ? [{name: "-", value: "-"}] : Object.entries(formProperty.value).map(e => {
    return {
      name: e[0],
      value: e[1]
    }
  }).sort((a, b) => compare(a.name, b.name))
  $: formPropertyName = formProperty.name

</script>

<ExternalEventPropertyRecObject
  {formPropertyName}
  {formProperties}
  {highlightKeysMap}
/>