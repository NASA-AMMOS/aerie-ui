<svelte:options immutable={true} />

<script lang="ts">
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import WarningExtraIcon from '@nasa-jpl/stellar/icons/warning_extra.svg?component';
  import WarningMissingIcon from '@nasa-jpl/stellar/icons/warning_missing.svg?component';
  import WarningUnknownIcon from '@nasa-jpl/stellar/icons/warning_unknown.svg?component';
  import { createEventDispatcher } from 'svelte';
  import OutsideBoundsIcon from '../../../assets/out-of-bounds.svg?component';
  import type { ActivityErrorCategories, ActivityErrorCounts } from '../../../types/errors';
  import { pluralize } from '../../../utilities/text';

  export let compactMode: boolean = false;
  export let counts: ActivityErrorCounts;
  export let selectable: boolean = false;
  export let showTotalCount: boolean = false;

  const dispatch = createEventDispatcher();

  function onSelectCategory(event: MouseEvent) {
    const { target } = event;
    if (target) {
      const { value } = target as HTMLButtonElement;

      selectedCategory = value as ActivityErrorCategories;

      dispatch('selectCategory', selectedCategory);
    }
  }

  let selectedCategory: ActivityErrorCategories | null = null;

  $: selectedCategory = selectable ? 'all' : null;
</script>

<div class="counts" class:selectable>
  {#if showTotalCount}
    <button class="count all" class:selected={selectedCategory === 'all'} value="all" on:click={onSelectCategory}>
      All ({counts.all})
    </button>
  {/if}
  {#if counts.extra}
    <button class="count" class:selected={selectedCategory === 'extra'} value="extra" on:click={onSelectCategory}>
      <WarningExtraIcon class="red-icon" />{counts.extra} extra{compactMode
        ? ''
        : ` parameter${pluralize(counts.extra)}`}
    </button>
  {/if}
  {#if counts.missing}
    <button class="count" class:selected={selectedCategory === 'missing'} value="missing" on:click={onSelectCategory}>
      <WarningMissingIcon class="red-icon" />{counts.missing} missing{compactMode
        ? ''
        : ` parameter${pluralize(counts.missing)}`}
    </button>
  {/if}
  {#if counts.wrongType}
    <button
      class="count"
      class:selected={selectedCategory === 'wrongType'}
      value="wrongType"
      on:click={onSelectCategory}
    >
      <WarningUnknownIcon class="red-icon" />{counts.wrongType} wrong{compactMode ? '' : ' parameter'} type{pluralize(
        counts.wrongType,
      )}
    </button>
  {/if}
  {#if counts.invalidParameter}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidParameter'}
      value="invalidParameter"
      on:click={onSelectCategory}
    >
      <WarningIcon class="orange-icon" />{counts.invalidParameter} invalid {compactMode
        ? ''
        : ` parameter${pluralize(counts.invalidParameter)}`}
    </button>
  {/if}
  {#if counts.invalidAnchor}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidAnchor'}
      value="invalidAnchor"
      on:click={onSelectCategory}
    >
      <WarningIcon class="orange-icon" />{counts.invalidAnchor} invalid anchor{pluralize(counts.invalidAnchor)}
    </button>
  {/if}
  {#if counts.outOfBounds}
    <button
      class="count"
      class:selected={selectedCategory === 'outOfBounds'}
      value="outOfBounds"
      on:click={onSelectCategory}
    >
      <OutsideBoundsIcon />{counts.outOfBounds} outside plan bounds
    </button>
  {/if}
</div>

<style>
  .counts {
    column-gap: 7px;
    display: flex;
    flex-flow: wrap;
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

  .count.all {
    grid-template-columns: max-content;
  }

  .counts.selectable .count {
    cursor: pointer;
    min-height: initial;
    padding: 0.3rem 1rem;
    width: 100%;
  }

  .counts.selectable .count:hover {
    background-color: var(--st-gray-20, #ebecec);
  }

  .counts.selectable .count.selected {
    background-color: var(--st-gray-15, #f1f2f3);
    color: var(--st-gray-80);
  }
</style>
