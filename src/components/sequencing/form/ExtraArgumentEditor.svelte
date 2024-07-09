<svelte:options immutable={true} />

<script lang="ts">
  export let initVal: string;

  export let setInEditor: () => void;
</script>

<div style="display: flex; gap: 8px">
  <input class="st-input w-100" value={initVal} disabled={true} />
  <button on:click={setInEditor} class="st-button secondary">Remove</button>
</div>
