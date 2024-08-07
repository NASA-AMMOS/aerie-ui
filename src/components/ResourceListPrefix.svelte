<svelte:options immutable={true} />

<script lang="ts">
  import type { ResourceType } from '../types/simulation';

  export let item: ResourceType | undefined = undefined;

  let prefix: string = '';

  $: units = item?.schema.metadata?.unit?.value;
  $: type = item?.schema.type ?? 'Unk';
  $: if (type) {
    prefix = `(${type}${units ? ` • ${units}` : ''})`;
  }
</script>

<i class="resource-list-prefix st-typography-body" style:margin-left={units || type ? '4px' : '0'}>
  {prefix}
</i>

<style>
  .resource-list-prefix {
    color: var(--st-gray-50);
  }
</style>
