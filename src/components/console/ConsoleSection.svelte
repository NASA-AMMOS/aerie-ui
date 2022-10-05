<svelte:options immutable={true} />

<script lang="ts">
  import TabPanel from '../ui/Tabs/TabPanel.svelte';

  export let errors: BaseError[];
  export let title: string;
</script>

<TabPanel>
  <summary>{title} ({errors.length})</summary>
  <div class="errors">
    {#each errors as error}
      <details>
        <summary>{error.reason}</summary>
        <div class="error">
          <div class="reason">{error.trace}</div>
        </div>
      </details>
    {/each}
  </div>
</TabPanel>
