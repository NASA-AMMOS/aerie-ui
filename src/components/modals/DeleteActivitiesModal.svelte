<svelte:options immutable={true} />

<script lang="ts">
  import ActivityAnchorIconSVG from '@nasa-jpl/stellar/icons/activity_anchor.svg?component';
  import { createEventDispatcher } from 'svelte';
  import DeleteAnchoredActivitiesIcon from '../../assets/delete-anchored-activities.svg?component';
  import ReanchorToNearestParentIcon from '../../assets/reanchor-to-nearest-parent.svg?component';
  import ReanchorToPlanStartIcon from '../../assets/reanchor-to-plan-start.svg?component';
  import { activityDirectivesList, activityDirectivesMap } from '../../stores/activities';
  import type {
    ActivityDirective,
    ActivityDirectiveDeletionMap,
    ActivityDirectiveId,
    AnchoredActivityDirectivesMap,
  } from '../../types/activity';
  import { ActivityDeletionAction } from '../../utilities/activities';
  import { getTarget } from '../../utilities/generic';
  import ActivityDirectiveIcon from '../ui/ActivityDirectiveIcon.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let width: number = 480;

  export let activityIds: ActivityDirectiveId[] = [];

  let anchoredActivitiesMap: AnchoredActivityDirectivesMap;
  let activityDirectiveDeletionMap: ActivityDirectiveDeletionMap = {};
  let activityDirectivesToDeleteMap: Record<ActivityDirectiveId, boolean> = {};
  let selectedAllAction: ActivityDeletionAction | 'custom' = 'custom';
  let isHelpOpen: boolean = false;
  let numberOfDependentActivities: number = 0;

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
  $: {
    let tempNumberOfDependentActivities = 0;
    const tempActivityDirectivesToDeleteMap: Record<ActivityDirectiveId, boolean> = {};
    activityIds.forEach((activityId: ActivityDirectiveId) => {
      tempNumberOfDependentActivities += anchoredActivitiesMap[activityId]?.length ?? 0;
      tempActivityDirectivesToDeleteMap[activityId] = activityDirectivesToDeleteMap[activityId] ?? true;
    });
    numberOfDependentActivities = tempNumberOfDependentActivities;
    activityDirectivesToDeleteMap = tempActivityDirectivesToDeleteMap;
  }

  function confirmDelete() {
    dispatch('delete', activityDirectiveDeletionMap);
  }

  function onAllChange(event: Event) {
    const { value } = getTarget(event);
    selectedAllAction = `${value}` as ActivityDeletionAction | 'custom';

    if (value !== 'custom') {
      activityDirectiveDeletionMap = activityIds.reduce(
        (previousValue: ActivityDirectiveDeletionMap, activityId: ActivityDirectiveId) => {
          return {
            [activityId]: `${value}` as ActivityDeletionAction,
            ...previousValue,
          };
        },
        {},
      );
    }
  }

  function onChange(event: Event) {
    const { name, value } = getTarget(event);
    activityDirectiveDeletionMap = {
      ...activityDirectiveDeletionMap,
      [name]: value,
    };
    selectedAllAction = 'custom';
  }

  function onToggleDelete(activityDirectiveId: ActivityDirectiveId) {
    activityDirectivesToDeleteMap = {
      ...activityDirectivesToDeleteMap,
      [activityDirectiveId]: !activityDirectivesToDeleteMap[activityDirectiveId],
    };
  }

  function onToggleHelp() {
    isHelpOpen = !isHelpOpen;
  }
</script>

<Modal height="auto" {width}>
  <ModalHeader on:close>Delete Activity {activityIds.length > 1 ? 'Directives' : 'Directive'}</ModalHeader>
  <ModalContent>
    <div class="message">
      You have selected {activityIds.length}
      {activityIds.length > 1 ? 'Activities' : 'Activity'} to delete.
      {#if numberOfDependentActivities > 0}
        {numberOfDependentActivities} of these activities have dependents. Select how you'd like to proceed.
      {/if}
    </div>
    {#if numberOfDependentActivities > 0}
      <div class="anchorHelp">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="anchorHelpToggle" on:click={onToggleHelp}>
          {#if isHelpOpen}
            Hide help
          {:else}
            Show help on selection options
          {/if}
        </div>
        <div class="globalAction">
          <div>Apply to all</div>
          <select class="st-select" name="all" value={selectedAllAction} on:change={onAllChange}>
            <option value={'custom'}>Custom</option>
            <option value={ActivityDeletionAction.ANCHOR_PLAN}>To Plan Start</option>
            <option value={ActivityDeletionAction.ANCHOR_ROOT}>To Nearest Parent</option>
            <option value={ActivityDeletionAction.DELETE_CHAIN}>Delete Chain</option>
          </select>
        </div>
        {#if isHelpOpen}
          <div class="helpChoices">
            <div class="helpChoice">
              <div>
                <div class="helpChoiceTitle">Anchor to plan start</div>
                <div class="helpChoiceDescription">
                  Leave dependent activities in place and link them to the plan start.
                </div>
              </div>
              <div><ReanchorToPlanStartIcon /></div>
            </div>
            <div class="helpChoice">
              <div>
                <div class="helpChoiceTitle">Anchor to nearest parent</div>
                <div class="helpChoiceDescription">
                  Leave dependent activities in place and look for a relevant parent to link to. If none exists, link to
                  plan start.
                </div>
              </div>
              <div><ReanchorToNearestParentIcon /></div>
            </div>
            <div class="helpChoice">
              <div>
                <div class="helpChoiceTitle">Delete all linked activities</div>
                <div class="helpChoiceDescription">
                  Delete all anchored activity directives. Simulated activities will remain in place until next plan
                  simulation.
                </div>
              </div>
              <div><DeleteAnchoredActivitiesIcon /></div>
            </div>
          </div>
        {/if}
      </div>
      <div class="anchoredForm">
        {#each activityIds as activityId}
          {#if anchoredActivitiesMap[activityId]?.length}
            <div class="anchorItem">
              <div class="directive">
                <div class="directiveToDelete" class:ignored={!activityDirectivesToDeleteMap[activityId]}>
                  <div class="directiveName">
                    <ActivityDirectiveIcon label={`${activityId} - ${$activityDirectivesMap[activityId]?.name}`} />
                  </div>
                  <div class="deleteCheckbox">
                    <label>
                      <span class="deleteLabel">Delete</span>
                      <input
                        type="checkbox"
                        checked={activityDirectivesToDeleteMap[activityId]}
                        on:change={() => onToggleDelete(activityId)}
                      />
                    </label>
                  </div>
                </div>
                <div class="dependentDirectives" class:ignored={!activityDirectivesToDeleteMap[activityId]}>
                  {#each anchoredActivitiesMap[activityId] as activityDirective}
                    <div class="dependentDirective">
                      <span class="anchorIcon"><ActivityAnchorIconSVG /></span>
                      <ActivityDirectiveIcon label={`${activityDirective.id} - ${activityDirective.name}`} />
                    </div>
                  {/each}
                </div>
              </div>
              <div class="choices">
                <select
                  class="st-select"
                  name={`${activityId}`}
                  value={activityDirectiveDeletionMap[activityId]}
                  on:change={onChange}
                >
                  <option value={ActivityDeletionAction.ANCHOR_ROOT}>To Nearest Parent</option>
                  <option value={ActivityDeletionAction.ANCHOR_PLAN}>To Plan Start</option>
                  <option value={ActivityDeletionAction.DELETE_CHAIN}>Delete Chain</option>
                </select>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
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

  .anchorHelp {
    margin: 1rem 0 0;
  }

  .anchorHelpToggle {
    color: #2f80ed;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .anchorHelpToggle:hover {
    text-decoration: underline;
  }

  .helpChoices {
    display: grid;
    grid-template-rows: repeat(3, min-content);
    row-gap: 1rem;
  }

  .helpChoice {
    border: 1px solid var(--st-gray-20);
    border-radius: 5px;
    column-gap: 5px;
    display: grid;
    grid-template-columns: auto min-content;
    padding: 8px;
  }

  .helpChoiceTitle,
  .helpChoiceDescription {
    color: var(--st-gray-60);
    font-weight: 500;
  }

  .helpChoiceDescription {
    margin-top: 8px;
    opacity: 0.7;
  }

  .globalAction {
    display: grid;
    grid-template-columns: auto 150px;
    margin-bottom: 1rem;
  }

  .anchoredForm {
    max-height: 500px;
  }

  .anchorItem {
    border-top: 1px solid var(--st-gray-20);
    display: grid;
    grid-template-columns: auto 150px;
    padding-top: 0.5rem;
  }

  .anchorIcon {
    padding: 5px;
    vertical-align: middle;
  }

  .directiveToDelete {
    align-items: center;
    background-color: #db513914;
    display: grid;
    grid-template-columns: auto 65px;
    padding: 5px;
  }

  .directiveToDelete.ignored {
    background-color: #f8f8f8;
  }
  .directiveName {
    align-items: center;
    display: grid;
    grid-template-columns: 200px min-content;
  }

  .dependentDirectives.ignored {
    opacity: 0.5;
  }

  .dependentDirective {
    margin-top: 5px;
  }

  input[type='checkbox'],
  .deleteLabel {
    vertical-align: middle;
  }

  .choices {
    padding: 2px 5px;
  }

  .choices select {
    width: 100%;
  }
</style>
