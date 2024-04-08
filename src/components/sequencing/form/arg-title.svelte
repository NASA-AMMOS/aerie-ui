<svelte:options immutable={true} />

<script lang="ts">
  import type { FswCommandArgument } from '@nasa-jpl/aerie-ampcs';

  export let argDef: FswCommandArgument;

  function getArgTitle(argDef: FswCommandArgument) {
    if ("units" in argDef) {
      return `${argDef.name} - (${argDef.units})`;
    }
    return argDef.name;
  }
</script>

<details>
  <summary>{getArgTitle(argDef)}</summary>
  {argDef.description}
</details>
