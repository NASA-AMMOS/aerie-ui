<svelte:options immutable={true} />

<script lang="ts">
  import CloseIcon from '@nasa-jpl/stellar/icons/close.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { SimulationDataset } from '../../types/simulation';
  import { hexToRgba } from '../../utilities/color';
  import { getNumberWithOrdinal } from '../../utilities/generic';
  import { getSimulationProgress } from '../../utilities/simulation';
  import { Status, statusColors } from '../../utilities/status';
  import { getDoyTime, getTimeAgo, getUnixEpochTimeFromInterval } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import Input from '../form/Input.svelte';
  import StatusBadge from '../ui/StatusBadge.svelte';

  export let checked: boolean = false;
  export let simulationDataset: SimulationDataset;
  export let planStartTimeMs: number;
  export let planEndTimeMs: number;
  export let queuePosition: number = -1;

  const dispatch = createEventDispatcher();
  const planDuration = planEndTimeMs - planStartTimeMs;

  let simulationBoundsVizRangeLeft = 0;
  let simulationBoundsVizRangeWidth = 0;
  let simulationExtentVizRangeWidth = 0;
  let startTimeText = '';
  let endTimeText = '';
  let progress = 0;
  let status: Status = Status.Pending;

  $: simulationBoundsVizRangeWidthStyle =
    simulationBoundsVizRangeWidth < 1 ? '4px' : `${simulationBoundsVizRangeWidth}%`;
  $: simulationExtentVizRangeWidthStyle =
    simulationExtentVizRangeWidth < 1
      ? '4px'
      : `${(simulationExtentVizRangeWidth / simulationBoundsVizRangeWidth) * 100}%`;

  $: {
    status = toSimulationStatus(simulationDataset);

    // Compute time range left and width
    if (simulationDataset.simulation_start_time) {
      const simulationStartTimeMS = new Date(simulationDataset.simulation_start_time).getTime();
      simulationBoundsVizRangeLeft = ((simulationStartTimeMS - planStartTimeMs) / planDuration) * 100 || 0;

      if (simulationStartTimeMS === planStartTimeMs) {
        startTimeText = 'Plan Start';
      } else {
        startTimeText = getDoyTime(new Date(simulationDataset.simulation_start_time)).split('+')[0];
      }

      if (simulationDataset.simulation_end_time) {
        const simulationEndTimeMS = new Date(simulationDataset.simulation_end_time).getTime();
        simulationBoundsVizRangeWidth = ((simulationEndTimeMS - simulationStartTimeMS) / planDuration) * 100 || 0;

        let simulationExtentMS = 0;
        if ((status === Status.Incomplete || status === Status.Failed) && simulationDataset.extent?.extent) {
          simulationExtentMS =
            getUnixEpochTimeFromInterval(simulationDataset.simulation_start_time, simulationDataset.extent?.extent) -
            simulationStartTimeMS;
        } else if (status === Status.Complete) {
          simulationExtentMS = simulationEndTimeMS - simulationStartTimeMS;
        }
        progress = getSimulationProgress(simulationDataset);
        simulationExtentVizRangeWidth = (simulationExtentMS / planDuration) * 100 || 0;
        if (simulationEndTimeMS === planEndTimeMs) {
          endTimeText = 'Plan End';
        } else {
          endTimeText = getDoyTime(new Date(simulationDataset.simulation_end_time)).split('+')[0];
        }
      }
    }
  }

  function onCheckboxClick(e: Event) {
    (e.target as HTMLInputElement).checked = checked;
  }

  function toSimulationStatus(simulationDataset: SimulationDataset) {
    if (simulationDataset.status === 'success') {
      return Status.Complete;
    } else if (simulationDataset.status === 'failed') {
      return Status.Failed;
    } else if (simulationDataset.status === 'incomplete') {
      return Status.Incomplete;
    } else if (simulationDataset.status === 'pending') {
      if (simulationDataset.canceled) {
        return Status.Canceled;
      }
      return Status.Pending;
    }
    return Status.Pending;
  }

  function toHumanReadableStatus(status: Status): string {
    if (status === Status.Complete) {
      return Status.Complete;
    } else if (status === Status.Failed) {
      return Status.Failed;
    } else if (status === Status.Incomplete) {
      return 'In Progress';
    } else if (status === Status.Pending) {
      return 'Queued';
    } else if (status === Status.Canceled) {
      return 'Canceled';
    }
    return 'Unknown';
  }

  function getSimulationProgressColor(status: SimulationDataset['status']): string {
    if (status === 'success') {
      return '#969696';
    } else if (status === 'failed') {
      return statusColors.red;
    } else if (status === 'incomplete') {
      return '#2f80ed'; // var(--st-utility-blue);
    } else if (status === 'pending') {
      return '#545f64';
    } else {
      return '#FF0000';
    }
  }

  function formatRequestedAtTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  }

  function onCancelSimulation(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('cancel', { id: simulationDataset.id });
  }
</script>

<button class="simulation-dataset st-typography-label" class:active={checked} on:click={() => dispatch('click')}>
  <div class="simulation-dataset-top-row">
    <div class="simulation-dataset-input-container">
      <Input class="simulation-dataset-input">
        <input {checked} type="checkbox" tabIndex={-1} on:click={onCheckboxClick} />
      </Input>
      Simulation ID: {simulationDataset.id}
    </div>
    <div class="simulation-dataset-status-container">
      {#if status === Status.Complete || status === Status.Failed}
        <StatusBadge status={toSimulationStatus(simulationDataset)} {progress} determinateProgress />
      {:else}
        <div
          class={`simulation-dataset-status-chip simulation-dataset-status-chip--${status.toLowerCase()} st-typography-label`}
        >
          {#if status === Status.Pending}
            {#if queuePosition === 1}
              Next in Queue
            {:else}
              {getNumberWithOrdinal(queuePosition)} in Queue
            {/if}
          {:else}
            {toHumanReadableStatus(status)}
          {/if}
        </div>
        {#if status === Status.Pending}
          <button
            use:tooltip={{ content: 'Cancel Simulation', placement: 'top' }}
            class="st-button icon simulation-dataset-status-cancel"
            type="button"
            on:click={onCancelSimulation}
          >
            <CloseIcon />
          </button>
        {/if}
      {/if}
    </div>
  </div>

  <div class="simulation-dataset-metadata">
    <div class="st-typography-body">
      {formatRequestedAtTime(simulationDataset.requested_at)}
    </div>
    <div class="simulation-dataset-metadata-time-ago">
      {getTimeAgo(new Date(simulationDataset.requested_at), new Date(), Number.MAX_SAFE_INTEGER)}
    </div>
    <div class="simulation-dataset-metadata-user">
      @{simulationDataset.requested_by || 'Unknown User'}
    </div>
  </div>

  <div class="simulation-range-indicator st-typography-">
    <div class="simulation-range-label">{startTimeText}</div>
    <div class="simulation-range-label">{endTimeText}</div>
  </div>

  <div class="simulation-range-visualization">
    <div class="simulation-range-background">
      <div
        class="simulation-range-bounds"
        style={`margin-left: ${simulationBoundsVizRangeLeft}%; width: ${simulationBoundsVizRangeWidthStyle}; background: ${hexToRgba(
          getSimulationProgressColor(simulationDataset.status),
          0.2,
        )}`}
      >
        <div
          class="simulation-extent-fill"
          style={`margin-left: 0%; width: ${simulationExtentVizRangeWidthStyle}; background: ${getSimulationProgressColor(
            simulationDataset.status,
          )}`}
        />
      </div>
    </div>
    <div>
      {progress.toFixed()}%
    </div>
  </div>
</button>

<style>
  .simulation-dataset {
    background: none;
    border: 1px solid var(--st-gray-15);
    border-radius: 4px;
    color: var(--st-gray-60);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.8;
    padding: 8px;
  }

  .simulation-dataset.active {
    background: #0275ff05;
    border-color: #015cc836;
    opacity: 1;
  }

  .simulation-dataset:hover:not(.active) {
    border-color: var(--st-gray-30);
  }

  .simulation-dataset-top-row {
    align-items: center;
    display: flex;
    gap: 8px;
    height: 24px;
    justify-content: space-between;
    width: 100%;
  }

  .simulation-dataset-input-container {
    display: flex;
    gap: 8px;
  }

  .simulation-dataset-metadata {
    display: flex;
    gap: 8px;
  }

  .simulation-dataset-metadata {
    color: var(--st-gray-50) dataset-metadata-time-ago;
    display: flex;
    gap: 8px;
  }

  .simulation-dataset-metadata-user {
    color: var(--st-gray-70);
  }

  .simulation-dataset-metadata-time-ago {
    color: var(--st-gray-50);
  }

  .simulation-dataset-top-row :global(.input.simulation-dataset-input) {
    width: min-content;
  }

  .simulation-dataset-top-row :global(.input.simulation-dataset-input input) {
    cursor: pointer;
    margin: 0;
    padding: 0;
  }

  .simulation-range-indicator {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .simulation-range-label {
    display: flex;
    gap: 8px;
    position: relative;
    z-index: 0;
  }

  .simulation-range-label :global(svg) {
    color: var(--st-gray-40);
    flex-shrink: 0;
    z-index: 0;
  }

  .simulation-dataset.active .simulation-range-label :global(svg) {
    color: var(--st-gray-60);
  }

  /* .simulation-range-label.start {
    margin-left: -3px;
    text-align: left;
  }

  .simulation-range-label.end {
    margin-right: -3px;
    text-align: right;
  } */

  /* .simulation-range-label.start:before { */
  /* White color block for the interior of the start icon's cut out so
    that the gradient does not appear inside the icon */
  /* background: white;
    content: ' ';
    height: 5px;
    left: 6px;
    position: absolute;
    top: 4px;
    width: 5px;
    z-index: 0;
  } */
  /*
  .simulation-range-label.start:after {
    background: linear-gradient(90deg, #717171 54.17%, rgba(188, 188, 188, 0) 104.17%);
    content: ' ';
    height: 16px;
    left: 8px;
    opacity: 0.15;
    position: absolute;
    top: 0;
    width: 12px;
    z-index: -1;
  } */

  /* .simulation-range-label.end:before { */
  /* White color block for the interior of the end icon's cut out so
    that the gradient does not appear inside the icon */
  /* background: white;
    content: ' ';
    height: 6px;
    position: absolute;
    right: 6px;
    top: 3px;
    width: 5px;
    z-index: 0;
  } */
  /*
  .simulation-range-label.end:after {
    background: linear-gradient(270deg, #717171 45.83%, rgba(188, 188, 188, 0) 95.83%);
    content: ' ';
    height: 16px;
    opacity: 0.15;
    position: absolute;
    right: 8px;
    top: 0px;
    width: 12px;
    z-index: -1;
  }

  .simulation-dataset.active .simulation-range-label.start:after,
  .simulation-dataset.active .simulation-range-label.end:after {
    opacity: 0.3;
  } */

  .simulation-range-visualization {
    align-items: center;
    display: flex;
    gap: 4px;
    width: 100%;
  }

  .simulation-range-background {
    align-items: center;
    background: var(--st-gray-20);
    border-radius: 8px;
    display: flex;
    flex: 1;
    height: 4px;
    /* padding: 2px; */
  }

  .simulation-range-bounds {
    align-items: center;
    background: var(--st-gray-40);
    border-radius: 8px;
    display: flex;
    height: 4px;
  }

  .simulation-extent-fill {
    background: var(--st-gray-90);
    border-radius: 8px;
    height: 4px;
    transition: width 250ms;
  }

  .simulation-dataset-status-chip {
    border-radius: 16px;
    padding: 4px 8px;
  }
  .simulation-dataset-status-chip--incomplete {
    background: #d1dbf13d;
    color: #295eda;
  }
  .simulation-dataset-status-chip--pending {
    background: var(--st-gray-15);
    color: var(--st-gray-70);
  }
  .simulation-dataset-status-chip--canceled {
    background: #f1d1d13d;
    color: #c34242;
  }

  .simulation-dataset-status-container {
    display: flex;
    gap: 4px;
  }

  .simulation-dataset-status-cancel {
    background: var(--st-gray-15);
    border-radius: 16px;
    color: var(--st-gray-70);
  }

  .simulation-dataset-status-cancel:hover {
    background: var(--st-gray-30);
  }
</style>
