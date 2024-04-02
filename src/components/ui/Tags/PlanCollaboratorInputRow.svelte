<svelte:options immutable={true} />

<script lang="ts">
  import type { PlanCollaboratorSlim } from '../../../types/plan';
  import type { PlanCollaboratorTag } from '../../../types/tags';
  import { tooltip } from '../../../utilities/tooltip';
  import TagChip from './Tag.svelte';

  export let tag: PlanCollaboratorTag;
  export let disabled: boolean = false;
  export let collaborators: PlanCollaboratorSlim[];

  let tagPlanPrimaryUser = '';
  let filteredCollaborators: PlanCollaboratorSlim[] = [];
  $: if (tag && tag.plan && collaborators) {
    if (collaborators.find(collaborator => collaborator.collaborator === tag.plan?.owner)) {
      if (tag.plan.collaborators.length > 0) {
        tagPlanPrimaryUser = tag.plan.collaborators[0].collaborator || 'Unk';
        filteredCollaborators = tag.plan.collaborators.slice(1);
      }
    } else {
      tagPlanPrimaryUser = tag.plan.owner || 'Unk';
      filteredCollaborators = [...tag.plan.collaborators];
    }
  }
  $: collaboratorTooltipContent = filteredCollaborators.map(c => c.collaborator).join(', ');
</script>

{#if tag.plan}
  <div class="as-plan" style="position: relative">
    <div class="plan">
      {tag.plan.name}
    </div>
    <div class="as-plan-tags">
      <TagChip {disabled} tag={{ ...tag, name: tagPlanPrimaryUser }} removable={false} />
      {#if filteredCollaborators.length > 0}
        <div use:tooltip={{ content: collaboratorTooltipContent, maxWidth: 320, placement: 'right', zIndex: 99999 }}>
          <TagChip {disabled} tag={{ ...tag, name: `+${filteredCollaborators.length}` }} removable={false} />
        </div>
      {/if}
    </div>
  </div>
{:else}
  <TagChip {disabled} {tag} removable={false} />
{/if}

<style>
  .as-plan {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: space-between;
    overflow: hidden;
  }

  .as-plan-tags {
    display: flex;
    gap: 4px;
  }

  .plan {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
