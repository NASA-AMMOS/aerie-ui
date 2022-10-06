<svelte:options immutable={true} />

<script lang="ts">
  import TabPanel from '../ui/Tabs/TabPanel.svelte';

  export let errors: BaseError[];
  export let title: string;
</script>

<TabPanel>
  <div class="console-section">
    <div class="console-header">{title}</div>
    <div class="errors">
      {#each errors as error}
        <div class="error">
          <div class="reason">
            <div>{error.reason}</div>
          </div>
          <pre class="trace">{error.trace}</pre>
        </div>
      {/each}
    </div>
  </div>
</TabPanel>

<style>
  .console-section {
    height: 100%;
  }

  .console-header {
    color: var(--st-gray-60);
    font-size: 11px;
    font-weight: 700;
    line-height: 1rem;
    margin: 0.65rem 1rem;
    text-transform: uppercase;
  }

  .errors {
    display: flex;
    flex-flow: column;
    height: 100%;
    overflow-y: auto;
    row-gap: 12px;
  }

  .error {
    margin: 0 1rem;
  }

  .reason {
    display: inline-block;
    font-size: 12px;
    font-weight: 400;
    margin-bottom: 8px;
  }

  pre.trace {
    margin: 0;
    white-space: pre-wrap;
  }

  .reason,
  .trace {
    background-color: var(--st-primary-background-color);
    padding: 0.5rem;
  }
</style>
