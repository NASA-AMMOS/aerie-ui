<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ModelLog, ModelSlim } from '../../types/model';
  import ModelStatusIcon from './ModelStatusIcon.svelte';

  type Mode = 'full' | 'rollup' | 'iconOnly';
  type ModelStatus = 'extracting' | 'complete' | 'error' | 'none';

  export let flow: 'horizontal' | 'vertical' = 'vertical';
  export let mode: Mode = 'full';
  export let model:
    | Pick<ModelSlim, 'refresh_activity_type_logs' | 'refresh_model_parameter_logs' | 'refresh_resource_type_logs'>
    | undefined;
  export let selectable: boolean = false;
  export let showCompleteStatus: boolean = true;

  const dispatch = createEventDispatcher<{
    select: ModelLog | null;
  }>();
  const rollupTooltipMessages: Record<ModelStatus, string> = {
    complete: 'Model extraction complete',
    error: 'Model has extraction errors',
    extracting: 'Extracting model',
    none: '',
  };
  const activityLogTooltipMessages: Record<ModelStatus, string> = {
    complete: 'Activity type extraction complete',
    error: 'Activity type extraction has errors',
    extracting: 'Extracting activity types',
    none: '',
  };
  const parameterLogTooltipMessages: Record<ModelStatus, string> = {
    complete: 'Model parameter extraction complete',
    error: 'Model parameter extraction has errors',
    extracting: 'Extracting model parameters',
    none: '',
  };
  const resourceLogTooltipMessages: Record<ModelStatus, string> = {
    complete: 'Resource type extraction complete',
    error: 'Resource type extraction has errors',
    extracting: 'Extracting resource types',
    none: '',
  };

  let activityLog: ModelLog | null = null;
  let activityLogStatus: ModelStatus = 'none';
  let parameterLog: ModelLog | null = null;
  let parameterLogStatus: ModelStatus = 'none';
  let resourceLog: ModelLog | null = null;
  let resourceLogStatus: ModelStatus = 'none';
  let selectedLog: 'activity' | 'parameter' | 'resource' | null = null;
  let status: ModelStatus = 'none';

  $: {
    if (model) {
      const {
        refresh_activity_type_logs: activityLogs,
        refresh_model_parameter_logs: parameterLogs,
        refresh_resource_type_logs: resourceLogs,
      } = model;

      activityLog = activityLogs[0] ?? null;
      parameterLog = parameterLogs[0] ?? null;
      resourceLog = resourceLogs[0] ?? null;

      if (activityLog) {
        if (activityLog.success) {
          activityLogStatus = 'complete';
        } else {
          activityLogStatus = 'error';
        }
      } else {
        activityLogStatus = 'extracting';
      }

      if (parameterLog) {
        if (parameterLog.success) {
          parameterLogStatus = 'complete';
        } else {
          parameterLogStatus = 'error';
        }
      } else {
        parameterLogStatus = 'extracting';
      }

      if (resourceLog) {
        if (resourceLog.success) {
          resourceLogStatus = 'complete';
        } else {
          resourceLogStatus = 'error';
        }
      } else {
        resourceLogStatus = 'extracting';
      }

      if (activityLogStatus === 'error' || parameterLogStatus === 'error' || resourceLogStatus === 'error') {
        status = 'error';
      } else if (
        activityLogStatus === 'complete' &&
        parameterLogStatus === 'complete' &&
        resourceLogStatus === 'complete'
      ) {
        status = 'complete';
      } else if (
        activityLogStatus === 'extracting' &&
        parameterLogStatus === 'extracting' &&
        resourceLogStatus === 'extracting'
      ) {
        status = 'extracting';
      }
    } else {
      status = 'none';
    }
  }

  function selectActivityLog() {
    selectedLog = 'activity';
    dispatch('select', activityLog);
  }

  function selectParameterLog() {
    selectedLog = 'parameter';
    dispatch('select', parameterLog);
  }

  function selectResourceLog() {
    selectedLog = 'resource';
    dispatch('select', resourceLog);
  }
</script>

<div class="model-status-container">
  {#if mode === 'rollup' || mode === 'iconOnly'}
    <div class="model-status-rollup" class:icon-only={mode === 'iconOnly'}>
      <ModelStatusIcon {showCompleteStatus} {status} tooltipContent={status && rollupTooltipMessages[status]} />
      {#if mode === 'rollup'}
        {#if status === 'extracting'}
          Extracting
        {:else if status === 'complete' && showCompleteStatus}
          Extracted
        {:else if status === 'error'}
          Errors extracting
        {/if}
      {/if}
    </div>
  {:else}
    <div class="model-status-logs-container" class:horizontal={flow === 'horizontal'}>
      <button
        disabled={!selectable}
        class="model-status-button"
        class:selected={selectedLog === 'activity'}
        on:click={selectActivityLog}
      >
        <ModelStatusIcon
          {showCompleteStatus}
          status={activityLogStatus}
          tooltipContent={activityLog?.error_message ?? activityLogTooltipMessages[activityLogStatus]}
        />
        Extract activity types
      </button>
      <button
        disabled={!selectable}
        class="model-status-button"
        class:selected={selectedLog === 'parameter'}
        on:click={selectParameterLog}
      >
        <ModelStatusIcon
          {showCompleteStatus}
          status={parameterLogStatus}
          tooltipContent={parameterLog?.error_message ?? parameterLogTooltipMessages[parameterLogStatus]}
        />
        Extract resource types
      </button>
      <button
        disabled={!selectable}
        class="model-status-button"
        class:selected={selectedLog === 'resource'}
        on:click={selectResourceLog}
      >
        <ModelStatusIcon
          {showCompleteStatus}
          status={resourceLogStatus}
          tooltipContent={resourceLog?.error_message ?? resourceLogTooltipMessages[resourceLogStatus]}
        />
        Extract mission model parameters
      </button>
    </div>
  {/if}
</div>

<style>
  .model-status-container {
    --model-status-gap: 2px;
  }

  .model-status-rollup {
    align-items: center;
    column-gap: var(--model-status-gap);
    display: grid;
    grid-template-columns: min-content auto;
    white-space: nowrap;
    width: fit-content;
  }

  .model-status-rollup.icon-only {
    grid-template-columns: min-content;
  }

  .model-status-logs-container {
    display: grid;
    grid-template-rows: repeat(3, min-content);
    row-gap: 8px;
  }

  .model-status-logs-container.horizontal {
    column-gap: 8px;
    grid-template-columns: repeat(3, min-content);
  }

  .model-status-logs-container .model-status-button {
    background: none;
    border: 0;
    border-radius: 8px;
    column-gap: var(--model-status-gap);
    cursor: pointer;
    display: grid;
    grid-template-columns: min-content min-content;
    padding: 6px;
    white-space: nowrap;
  }

  .model-status-logs-container .model-status-button:hover {
    background-color: var(--tab-hover-background-color, var(--st-gray-15));
  }

  .model-status-logs-container .model-status-button.selected {
    background: var(--st-white, #fff);
  }

  .model-status-logs-container .model-status-button:disabled {
    background-color: inherit;
    border: 0;
    color: var(--st-primary-text-color);
    cursor: inherit;
    padding: 0;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }
</style>
