<svelte:options immutable={true} />

<script lang="ts">
  import type { ModelLog, ModelSlim } from '../../../types/model';
  import ModelStatusRollup from '../../model/ModelStatusRollup.svelte';
  import TabPanel from '../../ui/Tabs/TabPanel.svelte';
  import { ConsoleContextKey } from '../Console.svelte';

  export let model:
    | Pick<ModelSlim, 'refresh_activity_type_logs' | 'refresh_model_parameter_logs' | 'refresh_resource_type_logs'>
    | undefined;
  export let title: string;

  let selectedLog: 'activity' | 'parameter' | 'resource' | undefined = undefined;
  let selectedModelLog: ModelLog | null = null;

  $: {
    if (model) {
      const {
        refresh_activity_type_logs: activityLogs,
        refresh_model_parameter_logs: parameterLogs,
        refresh_resource_type_logs: resourceLogs,
      } = model;

      const activityLog = activityLogs[0] ?? null;
      const parameterLog = parameterLogs[0] ?? null;
      const resourceLog = resourceLogs[0] ?? null;
      let isActivityLogError: boolean = false;
      let isParameterLogError: boolean = false;
      let isResourceLogError: boolean = false;

      if (!activityLog?.success) {
        isActivityLogError = true;
      }
      if (!parameterLog?.success) {
        isParameterLogError = true;
      }
      if (!resourceLog?.success) {
        isResourceLogError = true;
      }
      if (isActivityLogError) {
        selectedLog = 'activity';
        selectedModelLog = activityLog;
      } else if (isParameterLogError) {
        selectedLog = 'parameter';
        selectedModelLog = parameterLog;
      } else if (isResourceLogError) {
        selectedLog = 'resource';
        selectedModelLog = resourceLog;
      }
    }
  }

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
        <ModelStatusRollup {model} selectable {selectedLog} flow="horizontal" on:select={onSelectCategory} />
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
            <pre>{JSON.stringify(selectedModelLog?.error, undefined, 2)}</pre>
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
    row-gap: 5px;
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
