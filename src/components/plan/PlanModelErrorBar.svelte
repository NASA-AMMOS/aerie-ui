<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let hasErrors: boolean = false;

  let isVisible: boolean = hasErrors;

  $: isVisible = hasErrors;

  const dispatch = createEventDispatcher<{
    viewModelErrors: void;
  }>();

  function onClickViewConsole() {
    dispatch('viewModelErrors');
  }

  function onDismiss() {
    isVisible = false;
  }
</script>

{#if isVisible}
  <div class="model-error-bar">
    <div class="info"></div>

    <div class="buttons">
      <button on:click={onClickViewConsole} class="st-button secondary view-button">View errors in console</button>
      <button class="st-button secondary" on:click={onDismiss}>Dismiss</button>
    </div>
  </div>
{/if}

<style>
  .model-error-bar {
    align-items: center;
    background-color: var(--st-primary-10, #e6e6ff);
    border-bottom: 1px solid var(--st-primary-30, #a1a4fc);
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
  }

  .model-error-bar .info {
    align-items: center;
    color: var(--st-primary-90, #1a237e);
    column-gap: 10px;
    display: flex;
    display: flex;
    font-weight: 500;
  }
</style>
