<svelte:options immutable={true} />

<script lang="ts">
  interface ActivityErrorCounts {
    all: number;
    extra: number;
    invalidAnchor: number;
    invalidParameter: number;
    missing: number;
    outOfBounds: number;
    wrongType: number;
  }

  export let counts: ActivityErrorCounts | undefined;
</script>

<div>
  {#if counts?.extra}
    <span>{counts.extra} extra</span>
  {/if}
  {#if counts?.invalidParameter}
    <span>{counts.invalidParameter} validation</span>
  {/if}
  {#if counts?.missing}
    <span>{counts.missing} missing</span>
  {/if}
  {#if counts?.wrongType}
    <span>{counts.wrongType} wrong type</span>
  {/if}
  {#if counts?.invalidAnchor}
    <span>{counts.invalidAnchor} invalid anchor{counts.invalidAnchor === 1 ? '' : 's'}</span>
  {/if}
  {#if counts?.outOfBounds}
    <span>{counts.outOfBounds} out of plan bounds</span>
  {/if}
</div>
