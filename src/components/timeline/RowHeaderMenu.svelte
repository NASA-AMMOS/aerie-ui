<svelte:options immutable={true} />

<script lang="ts">
  import ThreeDotsIcon from '@nasa-jpl/stellar/icons/three_dot_horizontal.svg?component';
  import { createEventDispatcher } from 'svelte';
  import { viewSetSelectedRow, viewTogglePanel } from '../../stores/views';
  import { getTarget } from '../../utilities/generic';
  import { tooltip } from '../../utilities/tooltip';
  import ContextMenuItem from '../context-menu/ContextMenuItem.svelte';
  import ContextMenuSeparator from '../context-menu/ContextMenuSeparator.svelte';
  import Menu from '../menus/Menu.svelte';

  export let rowId: number = 0;
  export let showDirectives: boolean = true;
  export let showSpans: boolean = true;
  export let showVisibilityOptions: boolean = false;

  let menu: Menu;

  const dispatch = createEventDispatcher();

  function onEditRow() {
    // Open the timeline editor panel on the right.
    viewTogglePanel({ state: true, type: 'right', update: { rightComponentTop: 'TimelineEditorPanel' } });

    // Set row to edit.
    viewSetSelectedRow(rowId);

    menu.hide();
  }

  function onDeleteRow() {
    menu.hide();
  }

  function onShowDirectivesAndActivitiesChange(event: Event) {
    const { value } = getTarget(event);
    const newShowDirectives = value !== 'show-spans';
    const newShowSpans = value !== 'show-directives';
    dispatch('toggleDirectiveVisibility', newShowDirectives);
    dispatch('toggleSpanVisibility', newShowSpans);
  }
</script>

<div style="position: relative">
  <button
    class="st-button secondary row-header-menu"
    use:tooltip={{ content: 'Row Settings', placement: 'top' }}
    on:click|stopPropagation={() => menu.toggle()}
  >
    <div class="button-inner"><ThreeDotsIcon /></div>
  </button>

  <Menu bind:this={menu} placement="bottom-end" hideAfterClick={false}>
    <ContextMenuItem on:click={onEditRow}>Edit Row</ContextMenuItem>
    <ContextMenuItem on:click={onDeleteRow}>Move Up</ContextMenuItem>
    <ContextMenuItem on:click={onDeleteRow}>Move Down</ContextMenuItem>
    <ContextMenuItem on:click={onDeleteRow}>Duplicate Row</ContextMenuItem>
    <ContextMenuItem on:click={onDeleteRow}>Delete Row</ContextMenuItem>

    {#if showVisibilityOptions}
      <ContextMenuSeparator />
      <div role="radiogroup" class="st-radio-group">
        <label for="show-directives" class="st-radio-option st-typography-body">
          <input
            id="show-directives"
            type="radio"
            value="show-directives"
            checked={showDirectives && !showSpans}
            on:change={onShowDirectivesAndActivitiesChange}
          />
          Show activity directives
        </label>
        <label for="show-spans" class="st-radio-option st-typography-body">
          <input
            id="show-spans"
            type="radio"
            value="show-spans"
            checked={!showDirectives && showSpans}
            on:change={onShowDirectivesAndActivitiesChange}
          />
          Show simulated activities
        </label>
        <label for="show-both" class="st-radio-option st-typography-body">
          <input
            id="show-both"
            type="radio"
            value="show-both"
            checked={showDirectives && showSpans}
            on:change={onShowDirectivesAndActivitiesChange}
          />
          Show both
        </label>
      </div>
    {/if}
  </Menu>
</div>

<style>
  .row-header-menu {
    height: 20px;
    padding: 0px 0px;
    width: 20px;
  }

  .button-inner {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  /* TODO move this to stellar at some point or at least aerie stellar overrides */
  .st-radio-group {
    display: flex;
    flex-direction: column;
  }

  .st-radio-option {
    align-items: center;
    display: flex;
    justify-content: flex-start;
    padding: 4px 8px 4px 4px;
  }

  .st-radio-option input {
    margin: 4px;
  }
</style>
