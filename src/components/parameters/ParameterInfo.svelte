<svelte:options immutable={true} />

<script lang="ts">
  import InfoIcon from '@nasa-jpl/stellar/icons/info.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { SimpleFormParameter, ValueSource } from '../../types/parameter';
  import ContextMenu from '../context-menu/ContextMenu.svelte';
  import ValueSourceBadge from './ValueSourceBadge.svelte';

  export let formParameter: SimpleFormParameter;

  const dispatch = createEventDispatcher();

  let contextMenu: ContextMenu;
  let isIconHovered: boolean = false;
  let isTooltipHovered: boolean = false;
  let leaveTimeout: NodeJS.Timeout | null = null;
  let source: ValueSource;
  let units: string | undefined = undefined;

  $: if (formParameter) {
    source = formParameter.valueSource;
    units = formParameter.units;
  }

  function leaveCallback() {
    if (leaveTimeout != null) {
      clearTimeout(leaveTimeout);
    }

    leaveTimeout = setTimeout(() => {
      if (isIconHovered || isTooltipHovered) {
        leaveCallback();
      } else {
        contextMenu.hide();
      }
    }, 300);
  }

  function hoverCallback() {
    if (leaveTimeout != null) {
      clearTimeout(leaveTimeout);
    }
  }

  function onIconOver(e: MouseEvent) {
    isIconHovered = true;
    if (!contextMenu.isShown()) {
      contextMenu.show(e);
    }
    hoverCallback();
  }

  function onReset() {
    dispatch('reset', formParameter);
  }

  function onTooltipOver() {
    isTooltipHovered = true;
    hoverCallback();
  }

  function onIconOut() {
    isIconHovered = false;
    leaveCallback();
  }

  function onTooltipOut() {
    isTooltipHovered = false;
    leaveCallback();
  }
</script>

{#if units || source !== 'none'}
  <div class="parameter-info-container" role="contentinfo" on:mouseenter={onIconOver} on:mouseleave={onIconOut}>
    <div><InfoIcon /></div>
    <ContextMenu hideAfterClick={false} bind:this={contextMenu}>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="parameter-info-tooltip" on:mouseenter={onTooltipOver} on:mouseleave={onTooltipOut}>
        <div class="parameter-info-values">
          {#if units}
            <div class="parameter-info-label">Units</div>
            <div class="parameter-info-value">{units}</div>
          {/if}
          {#if source !== 'none'}
            <div class="parameter-info-label">Source</div>
            <div class="parameter-info-value"><ValueSourceBadge isCompact={false} {source} on:reset={onReset} /></div>
          {/if}
        </div>
      </div>
    </ContextMenu>
  </div>
{/if}

<style>
  .parameter-info-tooltip {
    display: block;
    min-width: 300px;
    padding: 0.5rem;
  }

  .parameter-info-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .parameter-info-label {
    color: var(--st-gray-80, #293137);
    font-size: 12px;
    font-weight: 400;
  }
</style>
