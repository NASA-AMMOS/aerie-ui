<script lang="ts">
  import LockIcon from '@nasa-jpl/stellar/icons/svg/lock.svg?component';
  import UnlockIcon from '@nasa-jpl/stellar/icons/svg/unlock.svg?component';
  import { onMount } from 'svelte';
  import { timelineLockStatus } from '../../stores/views';
  import { TimelineLockStatus } from '../../utilities/timeline';

  let onKeydown = e => {
    // If user holds shift while not focused on an input then activate the temporary unlock.
    // If an input is focused, we assume they're holding shift to capitalize instead.
    if (e.key === 'Shift' && e.target.tagName !== 'INPUT' && $timelineLockStatus !== TimelineLockStatus.Unlocked) {
      $timelineLockStatus = TimelineLockStatus.TemporaryUnlock;
    }
  };

  let onKeyup = e => {
    if (e.key === 'Shift' && $timelineLockStatus === TimelineLockStatus.TemporaryUnlock) {
      $timelineLockStatus = TimelineLockStatus.Locked;
    }
  };

  let onClick = () => {
    if ($timelineLockStatus === TimelineLockStatus.Locked) {
      $timelineLockStatus = TimelineLockStatus.Unlocked;
    } else {
      $timelineLockStatus = TimelineLockStatus.Locked;
    }
  };

  $: lockClassName = $timelineLockStatus === TimelineLockStatus.TemporaryUnlock ? 'temporary-unlock' : '';

  onMount(() => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('keyup', onKeyup);

    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('keyup', onKeyup);
    };
  });
</script>

<button class={`st-button icon ${lockClassName}`} on:click={onClick}>
  {#if $timelineLockStatus !== TimelineLockStatus.Locked}
    <UnlockIcon />
  {:else}
    <LockIcon />
  {/if}
</button>

<style>
  .st-button {
    border: 1px solid var(--st-gray-30);
    color: var(--st-gray-70);
  }

  .temporary-unlock,
  .temporary-unlock:hover {
    background-color: var(--st-blue);
    border-color: transparent;
    color: #ffffff;
  }
</style>
