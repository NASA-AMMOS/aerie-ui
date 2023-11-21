<svelte:options immutable={true} />

<script lang="ts">
  // eslint-disable-next-line
  interface $$Events extends ComponentEvents<SvelteComponent> {
    resetCategory: CustomEvent<ActivityErrorCategories>;
    selectCategory: CustomEvent<ActivityErrorCategories>;
  }

  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import WarningExtraIcon from '@nasa-jpl/stellar/icons/warning_extra.svg?component';
  import WarningMissingIcon from '@nasa-jpl/stellar/icons/warning_missing.svg?component';
  import WarningUnknownIcon from '@nasa-jpl/stellar/icons/warning_unknown.svg?component';
  import { SvelteComponent, createEventDispatcher, type ComponentEvents } from 'svelte';
  import OutsideBoundsIcon from '../../assets/out-of-bounds.svg?component';
  import type { ActivityErrorCategories, ActivityErrorCounts } from '../../types/errors';
  import { isMacOs } from '../../utilities/generic';
  import { isMetaOrCtrlPressed } from '../../utilities/keyboardEvents';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { pluralize } from '../../utilities/text';
  import { tooltip } from '../../utilities/tooltip';

  type Mode = 'full' | 'compact' | 'minimal' | 'iconsOnly';

  export let counts: ActivityErrorCounts | undefined = undefined;
  export let hasPermission: boolean = true;
  export let mode: Mode = 'full';
  export let permissionError: string | undefined = undefined;
  export let selectable: boolean = false;
  export let showTotalCount: boolean = false;

  const dispatch = createEventDispatcher();

  function generateCountText(mode: Mode, count: number, category: string, itemName?: string) {
    switch (mode) {
      case 'full':
        return `${count} ${category}${itemName ? ` ${itemName}${pluralize(count)}` : ''}`;
      case 'compact':
        return `${count} ${category}`;
      case 'minimal':
        return `${count}`;
      case 'iconsOnly':
      default:
        return '';
    }
  }

  function generateTooltipHTMLString(
    mode: Mode,
    count: number,
    category: string,
    itemName: string,
    isResettable: boolean = false,
  ) {
    if (mode === 'minimal' || mode === 'iconsOnly') {
      if (mode === 'minimal' && isResettable) {
        return `<div class="activity-error-rollup-error">
            <div class="activity-error-rollup-error-reset">
                <span>Reset ${count} ${category}${
          itemName ? ` ${itemName}${pluralize(count)}` : ''
        } to mission model</span>
                <div>${isMacOs() ? '⌘' : 'CTRL'} Click</div>
              </div>
          </div>`;
      } else {
        return `<div class="activity-error-rollup-error">${generateCountText('full', count, category, itemName)}</div>`;
      }
    }

    return '';
  }

  function onSelectCategory(event: MouseEvent) {
    const { currentTarget } = event;
    if (currentTarget) {
      const { value } = currentTarget as HTMLButtonElement;

      if (selectable) {
        selectedCategory = value as ActivityErrorCategories;
      }

      if (mode === 'minimal' && isMetaOrCtrlPressed(event)) {
        dispatch('resetCategory', value);
      } else {
        dispatch('selectCategory', value);
      }
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
</script>

<div
  class="counts"
  class:selectable
  class:full={mode === 'full'}
  class:compact={mode === 'compact'}
  class:minimal={mode === 'minimal'}
  class:icons-only={mode === 'iconsOnly'}
>
  {#if showTotalCount}
    <button class="count all" class:selected={selectedCategory === 'all'} value="all" on:click={onSelectCategory}>
      All ({errorCounts.all})
    </button>
  {/if}
  {#if errorCounts.extra}
    <button
      class="count"
      class:selected={selectedCategory === 'extra'}
      value="extra"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.extra, 'extra', 'parameter'),
      }}
    >
      <WarningExtraIcon class="red-icon" />{generateCountText(mode, errorCounts.extra, 'extra', 'parameter')}
    </button>
  {/if}
  {#if errorCounts.missing}
    <button
      class="count"
      class:selected={selectedCategory === 'missing'}
      value="missing"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.missing, 'missing', 'parameter'),
      }}
    >
      <WarningMissingIcon class="red-icon" />{generateCountText(mode, errorCounts.missing, 'missing', 'parameter')}
    </button>
  {/if}
  {#if errorCounts.wrongType}
    <button
      class="count"
      class:selected={selectedCategory === 'wrongType'}
      value="wrongType"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.wrongType, 'wrongType', 'parameter'),
      }}
    >
      <WarningUnknownIcon class="red-icon" />{generateCountText(mode, errorCounts.wrongType, 'wrong', 'type')}
    </button>
  {/if}
  {#if errorCounts.invalidParameter}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidParameter'}
      class:resettable={mode === 'minimal'}
      value="invalidParameter"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.invalidParameter, 'invalid', 'parameter', true),
        disabled: !hasPermission,
      }}
      use:permissionHandler={{
        hasPermission,
        permissionError,
      }}
    >
      <WarningIcon class="orange-icon" />{generateCountText(mode, errorCounts.invalidParameter, 'invalid', 'parameter')}
    </button>
  {/if}
  {#if errorCounts.invalidAnchor}
    <button
      class="count"
      class:selected={selectedCategory === 'invalidAnchor'}
      value="invalidAnchor"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.invalidAnchor, 'invalid', 'anchor'),
      }}
    >
      <WarningIcon class="orange-icon" />{generateCountText(mode, errorCounts.invalidAnchor, 'invalid', 'anchor')}
    </button>
  {/if}
  {#if errorCounts.outOfBounds}
    <button
      class="count"
      class:selected={selectedCategory === 'outOfBounds'}
      value="outOfBounds"
      on:click={onSelectCategory}
      use:tooltip={{
        allowHTML: true,
        content: generateTooltipHTMLString(mode, errorCounts.outOfBounds, 'outside plan bounds', ''),
      }}
    >
      <OutsideBoundsIcon />{generateCountText(mode, errorCounts.outOfBounds, 'outside plan bounds')}
    </button>
  {/if}
</div>

<style>
  .counts {
    column-gap: 7px;
    display: flex;
    flex-flow: wrap;
  }

  .counts .count.resettable {
    border-radius: 9px;
  }

  .counts.selectable .count {
    cursor: pointer;
    min-height: 32px;
    padding: 0.3rem 1rem;
    width: 100%;
  }

  .count.selected {
    background-color: var(--st-gray-15, #f1f2f3);
    color: var(--st-gray-80);
  }

  .counts.minimal,
  .counts.icons-only {
    column-gap: 0;
    flex-wrap: nowrap;
  }

  .counts.minimal .count {
    padding: 0.5px 5px;
  }

  .counts.selectable .count:hover,
  .counts.minimal .count.resettable:hover {
    background-color: var(--st-gray-20, #ebecec);
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
    padding: 0;
    text-align: left;
  }

  .count.all {
    grid-template-columns: max-content;
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
