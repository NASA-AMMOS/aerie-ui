<svelte:options immutable={true} />

<script lang="ts">
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import WarningExtraIcon from '@nasa-jpl/stellar/icons/warning_extra.svg?component';
  import WarningMissingIcon from '@nasa-jpl/stellar/icons/warning_missing.svg?component';
  import WarningUnknownIcon from '@nasa-jpl/stellar/icons/warning_unknown.svg?component';
  import { createEventDispatcher } from 'svelte';
  import OutsideBoundsIcon from '../../assets/out-of-bounds.svg?component';
  import type { ActivityErrorCategories, ActivityErrorCounts } from '../../types/errors';
  import { isMacOs } from '../../utilities/generic';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { pluralize } from '../../utilities/text';
  import { tooltip } from '../../utilities/tooltip';

  export let counts: ActivityErrorCounts | undefined = undefined;
  export let hasPermission: boolean = true;
  export let mode: 'full' | 'compact' | 'minimal' = 'full';
  export let permissionError: string | undefined = undefined;
  export let selectable: boolean = false;
  export let showTotalCount: boolean = false;

  let resetTooltipContent = '';
  const dispatch = createEventDispatcher();

  function onSelectCategory(event: MouseEvent) {
    const { currentTarget } = event;
    if (currentTarget) {
      const { value } = currentTarget as HTMLButtonElement;

      selectedCategory = value as ActivityErrorCategories;

      dispatch('selectCategory', { event, selectedCategory });
    }
  }

  let errorCounts: ActivityErrorCounts = {
    all: 0,
    extra: 0,
    invalidAnchor: 0,
    invalidParameter: 0,
    missing: 0,
    outOfBounds: 0,
    wrongType: 0,
  };
  let selectedCategory: ActivityErrorCategories | null = null;

  $: errorCounts = counts ?? {
    all: 0,
    extra: 0,
    invalidAnchor: 0,
    invalidParameter: 0,
    missing: 0,
    outOfBounds: 0,
    wrongType: 0,
  };
  $: selectedCategory = selectable ? 'all' : null;
  $: resetTooltipContent = `<div class="activity-error-rollup-error">
      <div class="activity-error-rollup-error-reset">
          <span>Reset ${errorCounts.invalidParameter} parameter${pluralize(
    errorCounts.invalidParameter,
  )} to mission model</span>
          <div>${isMacOs() ? '⌘' : 'CTRL'} Click</div>
        </div>
    </div>`;
</script>

<div class="counts" class:selectable class:minimal={mode === 'minimal'}>
  {#if showTotalCount}
    <button
      class="count all"
      class:selected={selectedCategory === 'all'}
      class:disabled={mode === 'minimal'}
      value="all"
      on:click={onSelectCategory}
    >
      All ({errorCounts.all})
    </button>
  {/if}
  {#if errorCounts.extra}
    <button
      class="count"
      class:selected={selectedCategory === 'extra'}
      class:disabled={mode === 'minimal'}
      value="extra"
      on:click={onSelectCategory}
    >
      <WarningExtraIcon class="red-icon" />{errorCounts.extra}{`${
        mode === 'minimal' ? '' : ` extra${mode === 'compact' ? '' : ` parameter${pluralize(errorCounts.extra)}`}}`
      }`}
    </button>
  {/if}
  {#if errorCounts.missing}
    <button
      class="count"
      class:selected={selectedCategory === 'missing'}
      class:disabled={mode === 'minimal'}
      value="missing"
      on:click={onSelectCategory}
    >
      <WarningMissingIcon class="red-icon" />{errorCounts.missing}{`${
        mode === 'minimal' ? '' : ` missing${mode === 'compact' ? '' : ` parameter${pluralize(errorCounts.missing)}`}`
      }`}
    </button>
  {/if}
  {#if errorCounts.wrongType}
    <button
      class="count"
      class:selected={selectedCategory === 'wrongType'}
      class:disabled={mode === 'minimal'}
      value="wrongType"
      on:click={onSelectCategory}
    >
      <WarningUnknownIcon class="red-icon" />{errorCounts.wrongType}{`${
        mode === 'minimal'
          ? ''
          : ` wrong${mode === 'compact' ? '' : ' parameter'} type{pluralize(
        errorCounts.wrongType,
      )}`
      }`}
    </button>
  {/if}
  {#if errorCounts.invalidParameter}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidParameter'}
      value="invalidParameter"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: resetTooltipContent,
        disabled: mode !== 'minimal' || !hasPermission,
      }}
      use:permissionHandler={{
        hasPermission,
        permissionError,
      }}
    >
      <WarningIcon class="orange-icon" />{errorCounts.invalidParameter}{`${
        mode === 'minimal'
          ? ''
          : ` invalid ${mode === 'compact' ? '' : ` parameter${pluralize(errorCounts.invalidParameter)}`}`
      }`}
    </button>
  {/if}
  {#if errorCounts.invalidAnchor}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidAnchor'}
      class:disabled={mode === 'minimal'}
      value="invalidAnchor"
      on:click={onSelectCategory}
    >
      <WarningIcon class="orange-icon" />{errorCounts.invalidAnchor}{`${
        mode === 'minimal' ? '' : ` invalid anchor${pluralize(errorCounts.invalidAnchor)}`
      }`}
    </button>
  {/if}
  {#if errorCounts.outOfBounds}
    <button
      class="count"
      class:selected={selectedCategory === 'outOfBounds'}
      class:disabled={mode === 'minimal'}
      value="outOfBounds"
      on:click={onSelectCategory}
    >
      <OutsideBoundsIcon />{errorCounts.outOfBounds}{`${mode === 'minimal' ? '' : ' outside plan bounds'}`}
    </button>
  {/if}
</div>

<style>
  .counts {
    column-gap: 7px;
    display: flex;
    flex-flow: wrap;
  }

  .counts.selectable.minimal {
    column-gap: 0;
  }

  .count {
    align-items: center;
    background: none;
    border: 0;
    color: var(--st-gray-60, #545f64);
    column-gap: 2px;
    cursor: inherit;
    display: grid;
    font-weight: 500;
    grid-template-columns: min-content max-content;
    min-height: 32px;
    padding: 0;
    text-align: left;
  }

  .count.disabled {
    pointer-events: none;
  }

  .count.all {
    grid-template-columns: max-content;
  }

  .counts.selectable .count {
    cursor: pointer;
    min-height: initial;
    padding: 0.3rem 1rem;
    width: 100%;
  }

  .counts.selectable.minimal .count {
    border-radius: 9px;
    padding: 0.5px 5px;
  }

  .counts.selectable .count.selected {
    background-color: var(--st-gray-15, #f1f2f3);
    color: var(--st-gray-80);
  }

  .counts.minimal {
    flex-wrap: nowrap;
  }

  .counts.selectable.minimal .count.selected {
    background-color: initial;
    color: initial;
  }

  .counts.selectable .count:hover,
  .counts.selectable.minimal .count:hover {
    background-color: var(--st-gray-20, #ebecec);
  }

  :global(.activity-error-rollup-error) {
    align-items: center;
    color: var(--st-gray-10);
    display: flex;
    gap: 2rem;
    justify-content: center;
  }

  :global(.activity-error-rollup-error .activity-error-rollup-error-reset) {
    align-items: center;
    display: flex;
    gap: 0.3rem;
  }

  :global(.activity-error-rollup-error .activity-error-rollup-error-reset > div) {
    background-color: var(--st-gray-70);
    border-radius: 3px;
    padding: 0 2px;
  }
</style>
