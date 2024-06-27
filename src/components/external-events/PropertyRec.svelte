<svelte:options immutable={true} />

<script lang="ts">
  import type { Property } from "../../types/property";
  import { compare } from '../../utilities/generic';
  import PropertyRecObject from './PropertyRecObject.svelte';
  
  export let formProperty: Property;
  export let highlightKeysMap: Record<string, boolean> = {};

  $: formProperties = formProperty.value === undefined ? [{name: "-", value: "-"}] : Object.entries(formProperty.value).map(e => {
    return {
      name: e[0],
      value: e[1]
    }
  }).sort((a, b) => compare(a.name, b.name))
  $: formPropertyName = formProperty.name

</script>

<PropertyRecObject
  {formPropertyName}
  {formProperties}
  {highlightKeysMap}
/>