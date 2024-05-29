<svelte:options immutable={true} />

<script lang="ts">
  import type { ModelLog, ModelSlim } from '../../../types/model';
  import ModelStatusRollup from '../../model/ModelStatusRollup.svelte';
  import TabPanel from '../../ui/Tabs/TabPanel.svelte';
  import { ConsoleContextKey } from '../Console.svelte';

  export let model: ModelSlim | undefined;
  export let title: string;

  let selectedModelLog: ModelLog | null = null;

  function onSelectCategory(event: CustomEvent<ModelLog | null>) {
    const { detail: value } = event;
    selectedModelLog = value;
  }
</script>

<TabPanel tabContextKey={ConsoleContextKey}>
  <div class="model-errors-container">
    <div class="console-header">
      <div class="console-title">{title}</div>
      <div class="model-statuses">
        <ModelStatusRollup {model} selectable on:select={onSelectCategory} flow="horizontal" />
      </div>
    </div>
    <div class="errors">
      {#if selectedModelLog && !selectedModelLog.success}
        <div class="error">
          <div class="reason">
            <div>
              {selectedModelLog?.error_message}
            </div>
          </div>
          <div class="trace">
            <pre>{JSON.stringify(selectedModelLog?.error)}</pre>
          </div>
        </div>
      {/if}
    </div>
  </div>
</TabPanel>

<style>
  .model-errors-container {
    display: grid;
    grid-template-rows: min-content auto;
    height: 100%;
  }

  .console-header .console-title {
    color: var(--st-gray-60);
    font-size: 11px;
    font-weight: 700;
    line-height: 1rem;
    margin: 0.65rem 1rem;
    text-transform: uppercase;
  }

  .model-statuses {
    padding-left: 1rem;
  }

  .errors {
    overflow-y: auto;
  }

  .error {
    margin: 0 1rem 12px;
  }

  .trace pre {
    margin: 0;
    white-space: pre-wrap;
  }

  .reason,
  .trace {
    background-color: var(--st-primary-background-color);
    padding: 0.5rem;
  }
</style>
