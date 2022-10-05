<svelte:options immutable={true} />

<div class="tab-list">
  <slot />
</div>

<style>
  .tab-list {
    border-bottom: 1px solid teal;
  }
</style>
