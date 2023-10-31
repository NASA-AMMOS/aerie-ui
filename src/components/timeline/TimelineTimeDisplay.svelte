<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { field } from '../../stores/form';
  import type { FieldStore } from '../../types/form';
  import type { TimeRange } from '../../types/timeline';
  import { getDoyTime, getUnixEpochTime } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import { required, timestamp } from '../../utilities/validators';
  import DatePickerField from '../form/DatePickerField.svelte';

  export let width: number | undefined;
  export let viewTimeRange: TimeRange;
  export let planEndTimeDoy: string | undefined;
  export let planStartTimeDoy: string | undefined;

  const dispatch = createEventDispatcher();

  let startTimeDoyField: FieldStore<string>;
  let open = false;

  $: startTimeDoy = getDoyTime(new Date(viewTimeRange.start));
  $: startTimeDoyField = field<string>(startTimeDoy, [required, timestamp]);
  $: planStartTime = planStartTimeDoy ? new Date(getUnixEpochTime(planStartTimeDoy)) : new Date();
  $: planEndTime = planEndTimeDoy ? new Date(getUnixEpochTime(planEndTimeDoy)) : new Date();

  function onUpdateStartTime() {
    if ($startTimeDoyField.valid && startTimeDoy !== $startTimeDoyField.value) {
      dispatch('viewTimeRangeChanged', { end: viewTimeRange.end, start: getUnixEpochTime($startTimeDoyField.value) });
    }
  }
</script>

<div style:width={`${width ?? 10}px`} class="timeline-time-display">
  <div use:tooltip={{ content: 'View Start Time' }} class="timeline-time-display--date st-typography-medium">
    {getDoyTime(new Date(viewTimeRange.start), true)}
  </div>
  {#if open}
    <div class="timeline-time-display--input">
      <DatePickerField
        minDate={planStartTime}
        maxDate={planEndTime}
        field={startTimeDoyField}
        layout="inline"
        name="start-time"
        on:change={onUpdateStartTime}
        on:keydown={onUpdateStartTime}
      />
    </div>
  {/if}
  <div use:tooltip={{ content: 'View End Time' }} class="timeline-time-display--date st-typography-medium">
    {getDoyTime(new Date(viewTimeRange.end), true)}
  </div>
</div>

<style>
  .timeline-time-display {
    display: flex;
    flex-direction: column;
    gap: 2px;
    justify-content: center;
  }

  .timeline-time-display--date {
    color: var(--st-gray-70);
    display: flex;
    font-size: 11px;
    font-variant: tabular-nums;
    padding: 0 4px;
    width: max-content;
  }

  .timeline-time-display--input {
    position: absolute;
    top: 0px;
  }
</style>
