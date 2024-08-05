<svelte:options immutable={true} />

<script lang="ts">
  type Item = $$Generic<{ name: string; [key: string]: any }>;

  export let item: Item | undefined = undefined;

  $: console.log('item :>> ', item);
</script>

<div>1</div>
