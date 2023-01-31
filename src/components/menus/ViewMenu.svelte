<svelte:options accessors={true} immutable={true} />

<script lang="ts">
  import ChevronDownIcon from '@nasa-jpl/stellar/icons/chevron_down.svg?component';
  import ViewGridIcon from '@nasa-jpl/stellar/icons/view_grid_filled.svg?component';
  import { user as userStore } from '../../stores/app';
  import { resetOriginalView, resetView, view, viewIsModified } from '../../stores/views';
  import effects from '../../utilities/effects';
  import { Status } from '../../utilities/status';
  import NavButton from '../app/NavButton.svelte';
  import Menu from './Menu.svelte';
  import MenuItem from './MenuItem.svelte';

  let saveViewDisabled: boolean = true;
  let viewMenu: Menu;

  $: saveViewDisabled = $view?.name === '' || $view?.owner !== $userStore?.id;

  function createView() {
    if ($view) {
      effects.createView($userStore?.id, $view.definition);
    }
  }

  function editView() {
    if ($view) {
      effects.editView($userStore?.id, $view.definition);
    }
  }

  async function saveView() {
    if ($view && $view.owner === $userStore?.id && !saveViewDisabled) {
      await effects.updateView($view.id, { definition: $view.definition, name: $view.name });
      resetOriginalView();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<NavButton
  status={$viewIsModified ? Status.Modified : null}
  title={$view?.name ?? 'Default View'}
  on:click={() => viewMenu.toggle()}
>
  <ViewGridIcon />
  <div class="view-menu st-typography-body" slot="menu">
    <ChevronDownIcon />

    <Menu bind:this={viewMenu} offset={[-120, -5]}>
      <MenuItem disabled={saveViewDisabled} on:click={saveView}>Save</MenuItem>
      <MenuItem on:click={createView}>Save as</MenuItem>
      <MenuItem on:click={resetView}>Reset to default</MenuItem>
      <MenuItem>Browse saved views</MenuItem>
      <hr />
      <MenuItem on:click={editView}>Rename view</MenuItem>
      <MenuItem>Set as default for plan</MenuItem>
    </Menu>
  </div>
</NavButton>

<style>
  .view-menu {
    --aerie-menu-item-template-columns: auto;
    align-items: center;
    color: white;
    cursor: pointer;
    display: flex;
    height: inherit;
    justify-content: center;
    position: relative;
  }
</style>
