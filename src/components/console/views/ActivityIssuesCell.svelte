<svelte:options immutable={true} />

<script lang="ts">
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import WarningExtraIcon from '@nasa-jpl/stellar/icons/warning_extra.svg?component';
  import WarningMissingIcon from '@nasa-jpl/stellar/icons/warning_missing.svg?component';
  import WarningUnknownIcon from '@nasa-jpl/stellar/icons/warning_unknown.svg?component';
  import OutsideBoundsIcon from '../../../assets/out-of-bounds.svg?component';
  interface ActivityErrorCellCounts {
    all: number;
    extra: number;
    invalidAnchor: number;
    invalidParameter: number;
    missing: number;
    outOfBounds: number;
    wrongType: number;
  }

  export let counts: ActivityErrorCellCounts | undefined;
</script>

<div class="counts">
  {#if counts?.extra}
    <div class="count">
      <WarningExtraIcon class="red-icon" />
      <div>{counts.extra} extra</div>
    </div>
  {/if}
  {#if counts?.invalidParameter}
    <div class="count">
      <WarningIcon class="red-icon" />
      <div>{counts.invalidParameter} validation</div>
    </div>
  {/if}
  {#if counts?.missing}
    <div class="count">
      <WarningMissingIcon class="red-icon" />
      <div>{counts.missing} missing</div>
    </div>
  {/if}
  {#if counts?.wrongType}
    <div class="count">
      <WarningUnknownIcon class="orange-icon" />
      <div>{counts.wrongType} wrong type</div>
    </div>
  {/if}
  {#if counts?.invalidAnchor}
    <div class="count">
      <WarningIcon class="orange-icon" />
      <div>{counts.invalidAnchor} invalid anchor{counts.invalidAnchor === 1 ? '' : 's'}</div>
    </div>
  {/if}
  {#if counts?.outOfBounds}
    <div class="count">
      <OutsideBoundsIcon />
      <div>{counts.outOfBounds} out of plan bounds</div>
    </div>
  {/if}
</div>

<style>
  .counts {
    column-gap: 5px;
    display: flex;
    flex-flow: wrap;
  }

  .count {
    align-items: center;
    column-gap: 2px;
    display: grid;
    grid-template-columns: min-content min-content;
  }
</style>
