<svelte:options immutable={true} />

<script lang="ts">
  import Tab from '../ui/Tabs/Tab.svelte';

  export let numberOfErrors: number = 0;
</script>

<Tab>
  <div class="error-tab">
    <slot /><span class="error-number-display">{numberOfErrors}</span>
  </div>
</Tab>

<style>
  .error-tab {
    align-items: center;
    column-gap: 0.5rem;
    display: grid;
    font-weight: 500;
    grid-template-columns: repeat(2, min-content);
  }

  .error-number-display {
    background-color: var(--st-gray-20);
    border-radius: 11px;
    color: var(--st-gray-60);
    padding: 0 4px;
  }
</style>
