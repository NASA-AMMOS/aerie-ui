<!--
Refactor tab input to be used as collaborator selection
User can search plans and usernames.
Ideally we'll surface all the recent plans the user accessed as top suggestions. If we don't have access to recents, could consider suggesting based on last modified plans the user has access to?
List shows plan name on the left, and usernames on the right. The first username should be the plan owner.
Searching filters plans and usernames. After a search is entered, show username matches on top. (Might need to re-evaluate this one based on some testing. If people do share based on a plan most, this could get in the way.
Adding a list of usernames from a plan adds that list, but there's no link back to the plan.
 -->
<svelte:options immutable={true} />

<script lang="ts">
  // import { createEventDispatcher } from 'svelte';
  import type { User, UserId } from '../../../types/app';
  import type { Plan, PlanCollaborator, PlanSlimmer } from '../../../types/plan';
  import type { PlanCollaboratorTag, Tag /* TagChangeType */, TagsChangeEvent } from '../../../types/tags';
  import effects from '../../../utilities/effects';
  import PlanCollaboratorInputRow from './PlanCollaboratorInputRow.svelte';
  import TagsInput from './TagsInput.svelte';

  export let collaborators: PlanCollaborator[] = [];
  export let users: UserId[] = [];
  export let plans: PlanSlimmer[] = [];
  export let plan: Plan;
  export let user: User | null;

  let inputRef: TagsInput | null;

  // TODO make into map
  $: allowableCollaborators = users.filter(user => {
    return !collaborators.find(collaborator => collaborator.collaborator === user);
  });

  let options: PlanCollaboratorTag[] = [];
  let selected: Tag[] = [];

  $: userIsCollaborator = (userId: UserId) => {
    return allowableCollaborators.indexOf(userId) < 0;
  };

  $: if (users) {
    let newOptions: PlanCollaboratorTag[] = users.map(userToTag);
    plans.forEach(p => {
      // Filter out current plan
      if (p.id !== plan.id) {
        newOptions.push(planToTag(p));
      }
    });
    // Filter out plans where owner and collaborators are already added
    newOptions = newOptions.filter(tag => {
      // If the tag is a user tag we don't need to filter on it
      if (!tag.plan) {
        return true;
      }
      // If owner is already a collaborator and there are no tag plan collaborators
      // then this tag can be skipped
      const ownerIsCollaborator = userIsCollaborator(tag.plan.owner);
      if (ownerIsCollaborator && tag.plan.collaborators.length < 1) {
        return false;
      }
      let anyTagCollaboratorsNotCollaborators = !!tag.plan.collaborators.find(
        collaborator => !userIsCollaborator(collaborator.collaborator),
      );
      return !ownerIsCollaborator || anyTagCollaboratorsNotCollaborators;
    });
    // TODO sort options
    options = newOptions;
  }
  $: selected = collaborators.map(collaborator => userToTag(collaborator.collaborator));

  function compareTags(tagA: PlanCollaboratorTag, tagB: PlanCollaboratorTag): boolean {
    const nameA = tagA.plan ? tagA.plan.name : tagA.name;
    const nameB = tagB.plan ? tagB.plan.name : tagB.name;
    return nameA === nameB;
  }

  function addTag(tag: PlanCollaboratorTag) {
    inputRef?.closeSuggestions();
    inputRef?.updatePopperPosition();
    let newCollaborators: PlanCollaborator[] = [];
    const tagPlan = tag.plan;
    if (!tagPlan) {
      // Username case
      newCollaborators.push({ collaborator: tag.name, plan_id: plan.id });
    } else {
      // Add collaborators from plan if not already a collaborator on the target plan
      const tagPlanCollaborators = tagPlan.collaborators.map(c => c.collaborator);
      tagPlanCollaborators.map(userId => {
        if (!userIsCollaborator(userId)) {
          newCollaborators.push({ collaborator: userId, plan_id: plan.id });
        }
      });

      // Add plan owner if not already a collaborator in target/source plans
      if (!userIsCollaborator(tagPlan.owner) && tagPlanCollaborators.indexOf(tagPlan.owner) < 0) {
        newCollaborators.push({ collaborator: tagPlan.owner, plan_id: plan.id });
      }
    }
    if (user) {
      effects.createPlanCollaborators(plan, newCollaborators, user);
      allowableCollaborators = allowableCollaborators.filter(
        collaborator => !newCollaborators.find(c => c.collaborator === collaborator),
      );
      selected = selected.concat(newCollaborators.map(c => userToTag(c.collaborator)));
    }
  }

  function userToTag(userId: UserId): PlanCollaboratorTag {
    return {
      color: '#EBECEC',
      created_at: '',
      id: -1,
      name: userId || 'Unk',
      owner: '',
    };
  }

  function planToTag(plan: PlanSlimmer): PlanCollaboratorTag {
    return {
      color: '#EBECEC',
      created_at: '',
      id: -1,
      name: '',
      owner: '',
      plan,
    };
  }

  async function onTagsInputChange(event: TagsChangeEvent) {
    const {
      detail: { tag, type },
    } = event;
    if (type === 'remove') {
      await effects.deletePlanCollaborator(plan, tag.name, user);
    }
  }
</script>

<TagsInput
  bind:this={inputRef}
  {addTag}
  placeholder="Search collaborators or plans"
  creatable={false}
  tagDisplayName="collaborator"
  {options}
  {compareTags}
  {selected}
  minWidth={168}
  on:change={onTagsInputChange}
  let:prop={tag}
>
  <PlanCollaboratorInputRow {tag} {collaborators} />
</TagsInput>

<style>
</style>
