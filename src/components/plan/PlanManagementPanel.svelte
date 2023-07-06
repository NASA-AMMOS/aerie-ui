<svelte:options immutable={true} />

<script lang="ts">
  import TrashIcon from '@nasa-jpl/stellar/icons/trash.svg?component';
  import { selectedActivityDirective } from '../../stores/activities';
  import { plan, planTags } from '../../stores/plan';
  import { tags } from '../../stores/tags';
  import type { User } from '../../types/app';
  import type { ViewGridSection } from '../../types/view';
  import { tooltip } from '../../utilities/tooltip';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import PanelHeaderActions from '../ui/PanelHeaderActions.svelte';
  import PlanForm from './PlanForm.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="Plan Management" />
    <PanelHeaderActions>
      {#if $selectedActivityDirective}
        <button
          class="st-button icon plan-header-delete"
          on:click|stopPropagation={() => {}}
          use:tooltip={{ content: 'Delete Plan', placement: 'top' }}
        >
          <TrashIcon />
        </button>
      {/if}
    </PanelHeaderActions>
  </svelte:fragment>
  <svelte:fragment slot="body">
    <PlanForm plan={$plan} planTags={$planTags} tags={$tags} {user} />
  </svelte:fragment>
</Panel>

<style>
  .plan-header-delete {
    border: 1px solid var(--st-gray-30);
  }

  .plan-header-delete {
    margin-left: 0.5rem;
  }
</style>
