<svelte:options immutable={true} />

<script lang="ts">
  import BranchIcon from '@nasa-jpl/stellar/icons/branch.svg?component';
  import ChevronDownIcon from '@nasa-jpl/stellar/icons/chevron_down.svg?component';
  import effects from '../../utilities/effects';
  import Menu from '../menus/Menu.svelte';
  import MenuItem from '../menus/MenuItem.svelte';

  export let plan: Plan;

  let planMenu: Menu;

  async function createBranch() {
    await effects.duplicatePlan(plan);
  }
</script>

<div class="plan-menu">
  {#if plan.parent_id !== null}
    <div>{plan.parent_id}</div>
    <BranchIcon />
  {/if}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="grid-menu st-typography-medium" on:click|stopPropagation={() => planMenu.toggle()}>
    <div class="plan-title">{plan.name}<ChevronDownIcon /></div>
    <Menu bind:this={planMenu} hideAfterClick={false}>
      <MenuItem on:click={createBranch}>
        <div class="column-name">Create branch</div>
      </MenuItem>
      <MenuItem
        on:click={() => {
          console.log('merge');
        }}
      >
        <div class="column-name">See merge requests</div>
      </MenuItem>
    </Menu>
  </div>
</div>

<style>
  .plan-menu {
    align-items: center;
    display: flex;
    flex-flow: row;
    gap: 20px;
    margin-left: 1rem;
  }

  .grid-menu {
    --aerie-menu-item-template-columns: min-content;
    align-items: center;
    cursor: pointer;
    display: flex;
    font-size: 13px;
    gap: 5px;
    height: 24px;
    justify-content: center;
    position: relative;
    user-select: none;
  }

  .plan-title {
    align-items: center;
    color: var(--st-white);
    display: flex;
    flex-flow: row;
  }
</style>
