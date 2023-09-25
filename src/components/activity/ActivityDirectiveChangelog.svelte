<svelte:options immutable={true} />

<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    ActivityDirective,
    ActivityDirectiveRevision,
    ActivityDirectivesMap,
    ActivityType,
  } from '../../types/activity';
  import type { User } from '../../types/app';
  import type { ArgumentsMap } from '../../types/parameter';
  import effects from '../../utilities/effects';

  export let activityDirective: ActivityDirective;
  export let activityDirectivesMap: ActivityDirectivesMap = {};
  export let activityTypes: ActivityType[] = [];
  export let modelId: number;
  export let user: User | null;

  let activityRevisions: ActivityDirectiveRevision[];
  $: activityRevisions = [];
  let activityRevisionChangeMap = [];
  $: activityRevisionChangeMap = [];
  $: activityType =
    (activityTypes ?? []).find(({ name: activityTypeName }) => activityDirective?.type === activityTypeName) ?? null;
  let defaultArguments: ArgumentsMap | undefined;
  $: defaultArguments = {};
  let effectiveRevisionArguments: ArgumentsMap[];
  $: effectiveRevisionArguments = [];

  function formatDate(dateString: string) {
    return new Date(dateString)
      .toLocaleString(undefined, {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'numeric',
        year: '2-digit',
      })
      .replace(',', '');
  }

  function diffRevisions(current: ActivityDirectiveRevision, previous: ActivityDirectiveRevision) {
    const differences: { [name: string]: { currentValue: any; previousValue: any } } = {};

    Object.keys(current.arguments).forEach(argument => {
      if (current.arguments[argument] !== previous.arguments[argument]) {
        differences[argument] = {
          currentValue: current.arguments[argument],
          previousValue: previous.arguments[argument],
        };
      }
    });

    if (current.start_offset !== previous.start_offset) {
      differences['Start Time'] = {
        currentValue: current.start_offset,
        previousValue: previous.start_offset,
      };
    }

    if (current.anchored_to_start !== previous.anchored_to_start) {
      differences['Anchor'] = {
        currentValue: current.anchored_to_start ? 'Start' : 'End',
        previousValue: previous.anchored_to_start ? 'Start' : 'End',
      };
    }

    if (current.anchor_id !== previous.anchor_id) {
      const currentAnchorDirective = current.anchor_id
        ? activityDirectivesMap[current.anchor_id].name
        : 'Unknown Directive';
      const previousAnchorDirective = previous.anchor_id
        ? activityDirectivesMap[previous.anchor_id]
        : 'Unknown Directive';
      differences['Anchored To'] = {
        currentValue: current.anchor_id ? `${current.anchor_id} - ${currentAnchorDirective}` : 'Plan',
        previousValue: previous.anchor_id ? `${previous.anchor_id} - ${previousAnchorDirective}` : 'Plan',
      };
    }

    const changedProperties = Object.keys(differences);
    const firstChange = changedProperties.length
      ? differences[changedProperties[0]]
      : { currentValue: '', name: '', previousValue: '' };

    if (changedProperties.length > 1) {
      return { currentValue: `${changedProperties.length} Changes`, name: '', previousValue: '' };
    }

    return {
      currentValue: firstChange.currentValue,
      name: changedProperties[0],
      previousValue: firstChange.previousValue,
    };
  }

  onMount(async () => {
    const { id: activityId, plan_id: planId } = activityDirective;
    activityRevisions = await effects.getActivityDirectiveChangelog(planId, activityId, user);
    const effectiveArguments = await effects.getEffectiveActivityArguments(modelId, activityType.name, {}, user);
    defaultArguments = effectiveArguments?.arguments;

    // Get effective arguments for all revisions
    const effectiveArgumentsRequests = activityRevisions.map(revision =>
      effects.getEffectiveActivityArguments(modelId, activityType.name, revision.arguments, user),
    );
    const effectiveArgumentsResponses = await Promise.all(effectiveArgumentsRequests);
    effectiveRevisionArguments = effectiveArgumentsResponses.map(effectiveArguments => effectiveArguments?.arguments);

    // Build a summary of changes by comparing two revisions and their effective arguments
    activityRevisionChangeMap = activityRevisions.map((activityRevision, i) => {
      const previousRevision = activityRevisions[i + 1];

      if (!previousRevision) {
        return { currentValue: '', name: 'Last Known Revision', previousValue: '' };
      }

      return diffRevisions(
        { ...activityRevision, arguments: effectiveRevisionArguments[i] },
        { ...previousRevision, arguments: effectiveRevisionArguments[i + 1] },
      );
    });
  });
</script>

<div class="activity-revisions">
  {#if activityRevisionChangeMap.length}
    {#each activityRevisions as revision, i}
      <div class="activity-revision">
        <div class="date st-typography-medium">{formatDate(revision.changed_at)}</div>
        <div class="change-summary st-typography-body">
          {activityRevisionChangeMap[i].name}
        </div>
        <div class="changed-by st-typography-label">{revision.changed_by}</div>
        <div class="new-value st-typography-body">
          {activityRevisionChangeMap[i].currentValue}
        </div>
        <div class="actions">
          {#if i == 0}
            <span>Current Revision</span>
          {:else}
            <button class="st-button">Restore</button>
          {/if}
        </div>
        <div class="previous-value st-typography-body">
          {activityRevisionChangeMap[i].previousValue}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .activity-revision {
    align-content: center;
    border: 1px solid transparent;
    border-radius: 4px;
    column-gap: 2px;
    display: grid;
    font-size: 12px;
    font-weight: 400;
    grid-template-columns: 1fr 1fr;
    line-height: 16px;
    margin: 8px 8px 0px 8px;
    padding: 4px;
    row-gap: 4px;
  }

  .activity-revision:hover {
    background-color: #f8f8f8;
    border-color: #ebecec;
  }

  .new-value,
  .previous-value,
  .change-summary {
    text-align: right;
  }

  .actions > * {
    display: none;
    height: 16px;
    line-height: 16px;
    margin: 0;
  }

  .actions button {
    padding: 0 8px;
  }

  .activity-revision:hover .actions > * {
    display: inline-flex;
  }

  .new-value {
    color: #265fc5;
  }

  .previous-value {
    color: #a91900;
    text-decoration: line-through;
  }
</style>
