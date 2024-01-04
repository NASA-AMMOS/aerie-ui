<svelte:options immutable={true} />

<script lang="ts">
  export let tree: Array;
</script>

<div>
  {tree.length}
</div>
