<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { activityDirectivesList, activityDirectivesMap } from '../../stores/activities';
  import type {
    ActivityDirective,
    ActivityDirectiveDeletionMap,
    ActivityDirectiveId,
    AnchoredActivityDirectivesMap,
  } from '../../types/activity';
  import { ActivityDeletionAction } from '../../utilities/activities';
  import { getTarget } from '../../utilities/generic';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let width: number = 380;

  export let activityIds: ActivityDirectiveId[] = [];

  let anchoredActivitiesMap: AnchoredActivityDirectivesMap;
  let activityDirectiveDeletionMap: ActivityDirectiveDeletionMap = {};

  const dispatch = createEventDispatcher();

  $: if ($activityDirectivesList.length) {
    anchoredActivitiesMap = $activityDirectivesList.reduce(
      (previousValue: AnchoredActivityDirectivesMap, directive: ActivityDirective) => {
        if (!activityIds.includes(directive.id)) {
          if (directive.anchor_id !== null) {
            const { anchor_id: anchorId } = directive;
            if (!previousValue[anchorId]) {
              return {
                ...previousValue,
                [anchorId]: [directive],
              };
            }

            return {
              ...previousValue,
              [anchorId]: [...previousValue[anchorId], directive],
            };
          }
        }
        return previousValue;
      },
      {},
    );

    activityDirectiveDeletionMap = activityIds.reduce(
      (previousValue: ActivityDirectiveDeletionMap, activityId: ActivityDirectiveId) => {
        if (previousValue[activityId]) {
          return previousValue;
        }

        if (anchoredActivitiesMap[activityId]?.length) {
          return {
            [activityId]: ActivityDeletionAction.ANCHOR_ROOT,
            ...previousValue,
          };
        }

        return {
          [activityId]: ActivityDeletionAction.NORMAL,
          ...previousValue,
        };
      },
      activityDirectiveDeletionMap,
    );
  }

  function confirmDelete() {
    dispatch('delete', activityDirectiveDeletionMap);
  }

  function onChange(event: Event) {
    const { name, value } = getTarget(event);
    activityDirectiveDeletionMap = {
      ...activityDirectiveDeletionMap,
      [name]: value,
    };
  }
</script>

<Modal height="auto" {width}>
  <ModalHeader on:close>Delete {activityIds.length > 1 ? 'Activities' : 'Activity'}</ModalHeader>
  <ModalContent>
    <div class="message">You will delete {activityIds.length} {activityIds.length > 1 ? 'Activities' : 'Activity'}</div>
    <div class="anchoredForm">
      {#each activityIds as activityId}
        {#if anchoredActivitiesMap[activityId]?.length}
          <div class="anchorItem">
            There {anchoredActivitiesMap[activityId].length > 1 ? 'are' : 'is'}
            {anchoredActivitiesMap[activityId].length} remaining linked {anchoredActivitiesMap[activityId].length > 1
              ? 'activities'
              : 'activity'} to
            <strong>{activityId} - {$activityDirectivesMap[activityId]?.name}</strong>
            <div class="choices">
              <label>
                <input
                  type="radio"
                  bind:group={activityDirectiveDeletionMap[activityId]}
                  name={`${activityId}`}
                  value={ActivityDeletionAction.ANCHOR_ROOT}
                  on:change={onChange}
                />
                Leave activities in place
              </label>
              <label>
                <input
                  type="radio"
                  bind:group={activityDirectiveDeletionMap[activityId]}
                  name={`${activityId}`}
                  value={ActivityDeletionAction.DELETE_CHAIN}
                  on:change={onChange}
                />
                Delete rest of chain
              </label>
              <label>
                <input
                  type="radio"
                  bind:group={activityDirectiveDeletionMap[activityId]}
                  name={`${activityId}`}
                  value={ActivityDeletionAction.ANCHOR_PLAN}
                  on:change={onChange}
                />
                Re-anchor to plan start
              </label>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>
    <button class="st-button" on:click={confirmDelete}> Confirm </button>
  </ModalFooter>
</Modal>

<style>
  .message {
    font-weight: 500;
  }

  .anchoredForm {
    max-height: 300px;
    overflow-y: auto;
  }

  .anchorItem {
    margin-top: 0.5rem;
  }

  .choices {
    display: flex;
    flex-flow: column;
  }
</style>
