<svelte:options immutable={true} />

<script lang="ts">
  import { onMount } from 'svelte';
  import type { ActivityDirective, ActivityDirectiveRevision } from '../../types/activity';
  import type { User } from '../../types/app';
  import effects from '../../utilities/effects';

  export let activityDirective: ActivityDirective;
  export let user: User | null;

  let activityRevisions: ActivityDirectiveRevision[];
  $: activityRevisions = [];
  $: activityRevisionChangeMap = {};

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString().replace(',', '').replace(' PM', 'pm').replace(' AM', 'am');
  }

  function diffRevisions(next: ActivityDirectiveRevision, prev: ActivityDirectiveRevision) {
    console.log('DIFFING REVISIONS', next, prev);
    if (!next || !prev) {
      return [];
    }

    let differences = [];
    Object.keys(next.arguments).forEach(argument => {
      if (next.arguments[argument] !== prev.arguments[argument]) {
        differences.push({ key: argument, next: next.arguments[argument], prev: prev.arguments[argument] });
      }
    });

    return differences;
  }

  onMount(async () => {
    const { id: activityId, plan_id: planId } = activityDirective;
    activityRevisions = await effects.getActivityDirectiveChangelog(planId, activityId, user);

    for (let i = 0; i < activityRevisions.length - 1; i++) {
      activityRevisionChangeMap[activityRevisions[i].revision] = diffRevisions(
        activityRevisions[i],
        activityRevisions[i + 1],
      );
    }

    console.log('RETURNED REVISIONS', activityRevisions);
    console.log('CHANGE MAPPING', activityRevisionChangeMap);
  });
</script>

<div class="activity-revisions">
  {#each activityRevisions as revision}
    <div class="activity-revision">
      <div class="date st-typography-medium">{formatDate(revision.changed_at)}</div>
      <div class="change-summary st-typography-body">Change Summary</div>
      <div class="changed-by st-typography-label">{revision.changed_by}</div>
      <div class="new-value st-typography-body">New Value</div>
      <div class="actions"><button class="st-button">Restore</button></div>
      <div class="previous-value st-typography-body">Previous Value</div>
    </div>
  {/each}
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

  .actions button {
    display: none;
    height: 16px;
    line-height: 16px;
    margin: 0;
    padding: 0 8px;
  }

  .activity-revision:hover .actions button {
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
