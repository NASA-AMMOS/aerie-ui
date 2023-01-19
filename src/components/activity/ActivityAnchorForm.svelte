<svelte:options immutable={true} />

<script lang="ts">
  import SearchIcon from '@nasa-jpl/stellar/icons/search.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { ActivitiesMap, Activity, ActivityId } from '../../types/activity';
  import { getActivityDirectiveUniqueId, isDirective } from '../../utilities/activities';
  import { getTarget } from '../../utilities/generic';
  import { convertDurationStringToInterval, convertUsToDurationString, getDurationInMs } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import Input from '../form/Input.svelte';
  import Highlight from '../ui/Highlight.svelte';

  export let activity: Activity;
  export let activitiesMap: ActivitiesMap = {};
  export let anchorId: ActivityId | null = null;
  export let highlightKeysMap: Record<string, boolean> = {};
  export let isAnchoredToStart: boolean = true;
  export let planId: number;
  export let startOffset: string = null;

  const dispatch = createEventDispatcher();
  const anchorTextDelimiter = ' - ';

  let anchorableActivityDirectives: string[] = [];
  let anchoredActivity: Activity | null = null;
  let anchorInputString: string = '';
  let anchoredActivityError: string | null = null;
  let previousActivityId: ActivityId;
  let isRelativeOffset: boolean = false;
  let startOffsetString: string = '';
  let startOffsetError: string | null = null;

  $: anchoredActivity = anchorId !== null ? activitiesMap[getActivityDirectiveUniqueId(planId, anchorId)] : null;
  $: anchorInputString = anchoredActivity ? formatActivityAnchorText(anchoredActivity) : '';
  $: anchorableActivityDirectives = Object.values(activitiesMap)
    .filter(directive => isDirective(directive) && directive.id !== activity.id)
    .map(formatActivityAnchorText);
  $: startOffsetError = validateStartOffset(startOffsetString, activity);

  $: if (startOffset) {
    const offsetString = convertUsToDurationString(getDurationInMs(startOffset) * 1000, true);
    // remove `y` if 0 to keep the string shorter
    startOffsetString = offsetString.replace(/0y\s?/, '');
  }
  // only set this when the viewed activity is changed
  $: if (activity.id !== previousActivityId) {
    previousActivityId = activity.id;
    isRelativeOffset =
      !!activity.anchor_id || (!activity.anchor_id && !activity.anchored_to_start) || !!startOffsetError;
  }

  function formatActivityAnchorText(activity: Activity) {
    return `${activity.id}${anchorTextDelimiter}${activity.name}`;
  }

  function getIdFromAnchorText(anchorText: string) {
    return anchorText.split(anchorTextDelimiter)[0];
  }

  function resetForm() {
    updateAnchor(null);
    updateAnchorEdge(true);
    anchoredActivityError = null;
  }

  function validateStartOffset(offsetString: string, activity: Activity) {
    let validationError = activity.anchor_validations?.reason_invalid
      ? activity.anchor_validations.reason_invalid
      : null;

    try {
      convertDurationStringToInterval(`${offsetString}`);
    } catch (error) {
      validationError = error.message;
    }

    return validationError;
  }

  function updateAnchor(activity: Activity | null) {
    anchoredActivity = activity;
    if (activity === null) {
      dispatch('updateAnchor', null);
      anchorInputString = '';
    } else {
      dispatch('updateAnchor', anchoredActivity.id);
      anchorInputString = formatActivityAnchorText(anchoredActivity);
    }
  }

  function updateAnchorEdge(isStart: boolean) {
    isAnchoredToStart = isStart;
    dispatch('updateAnchorEdge', isStart);
  }

  function updateStartOffset(offset: string) {
    dispatch('updateStartOffset', offset);
  }

  function onIsRelativeChange(event: Event) {
    const target = event.target as HTMLInputElement;

    isRelativeOffset = target.checked;

    if (!isRelativeOffset) {
      resetForm();
    }
  }

  function onUpdateAnchor() {
    const activityId = getIdFromAnchorText(anchorInputString);

    anchoredActivityError = null;

    if (activityId !== '') {
      try {
        const activityToAnchorTo = activitiesMap[getActivityDirectiveUniqueId(planId, parseInt(activityId))];

        if (!activityToAnchorTo) {
          throw Error('Activity corresponding to chosen anchor was not found');
        }

        if (activityToAnchorTo.id === activity.id) {
          throw Error('Current selected activity anchor cannot be itself');
        }

        updateAnchor(activityToAnchorTo);
      } catch (e) {
        anchoredActivityError = e.message;
      }
    } else {
      updateAnchor(null);
    }
  }

  function onAnchorToStart() {
    updateAnchorEdge(true);
  }

  function onAnchorToEnd() {
    updateAnchorEdge(false);
  }

  function onUpdateStartOffset(event: Event) {
    const { value } = getTarget(event);

    startOffsetError = activity.anchor_validations?.reason_invalid ? activity.anchor_validations.reason_invalid : null;

    try {
      updateStartOffset(convertDurationStringToInterval(`${value}`));
    } catch (error) {
      startOffsetError = error.message;
    }
  }
</script>

<Input layout="inline">
  <label use:tooltip={{ content: 'Is Relative To Another Activity Directive', placement: 'top' }} for="isRelativeOffset"
    >Relative start time</label
  >
  <div>
    <input
      class="st-input"
      name="isRelativeOffset"
      type="checkbox"
      checked={isRelativeOffset}
      on:change={onIsRelativeChange}
    />
  </div>
</Input>
{#if isRelativeOffset}
  <div class="anchor-container">
    <Highlight highlight={highlightKeysMap.anchor_id}>
      <Input layout="inline">
        <label use:tooltip={{ content: 'Activity to anchor to', placement: 'top' }} for="anchor_id">Relative to</label>
        <Input>
          <div class="search-icon" slot="left"><SearchIcon /></div>
          <input
            class="st-input w-100"
            class:error={!!anchoredActivityError}
            list="anchors"
            name="anchor_id"
            bind:value={anchorInputString}
            on:change={onUpdateAnchor}
            use:tooltip={{ content: anchoredActivityError, placement: 'top' }}
          />
          <datalist id="anchors">
            {#each anchorableActivityDirectives as anchorableActivity}
              <option value={anchorableActivity} />
            {/each}
          </datalist>
        </Input>
      </Input>
    </Highlight>
    <Highlight highlight={highlightKeysMap.anchored_to_start}>
      <Input layout="inline">
        <label
          use:tooltip={{ content: 'Where to anchor to activity directive', placement: 'top' }}
          for="isAnchoredToStart"
        >
          Anchor
        </label>
        <div class="anchor-boundaries">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class:st-button={isAnchoredToStart}
            class="secondary anchor-boundary"
            class:selected={isAnchoredToStart}
            on:click={onAnchorToStart}
          >
            Start
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class:st-button={!isAnchoredToStart}
            class="secondary anchor-boundary"
            class:selected={!isAnchoredToStart}
            on:click={onAnchorToEnd}
          >
            End
          </div>
        </div>
      </Input>
    </Highlight>
    <Highlight highlight={highlightKeysMap.start_offset}>
      <Input layout="inline">
        <label use:tooltip={{ content: 'The offset duration for the anchor', placement: 'top' }} for="start-offset">
          Offset
        </label>
        <input
          class="st-input w-100"
          class:error={!!startOffsetError}
          name="start-offset"
          bind:value={startOffsetString}
          on:change={onUpdateStartOffset}
          use:tooltip={{ content: startOffsetError, placement: 'top' }}
        />
      </Input>
    </Highlight>
  </div>
{/if}

<style>
  .anchor-container {
    border: 1px solid var(--st-gray-15);
    border-radius: 4px;
    padding: 0.5rem;
  }

  .anchor-boundaries {
    background: var(--st-input-background-color);
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .anchor-boundaries .anchor-boundary {
    align-items: center;
    cursor: pointer;
    display: grid;
    height: var(--st-grid-unit3x);
    text-align: center;
  }

  .anchor-boundaries .anchor-boundary:hover {
    color: var(--st-black);
  }

  .anchor-boundaries .anchor-boundary.selected:hover {
    background-color: var(--st-white);
    color: inherit;
    cursor: default;
  }
</style>
