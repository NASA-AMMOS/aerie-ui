<svelte:options immutable={true} />

<script lang="ts">
  import CaretDownIcon from '@nasa-jpl/stellar/icons/caret_down.svg?component';

  export let autoAdjustHeight: boolean = false;

  let overlaySvg: SVGElement;
</script>

<div class="row-header">
  <CaretDownIcon class="row-header-collapse" />
  <div class="row-header-title st-typography-medium">Row Name</div>
</div>

<style>
  .row-header {
    background-color: var(--st-gray-15);
    display: flex;
  }

  :global(.row-header-collapse),
  .row-header-title {
    color: var(--st-gray-70);
  }
</style>
