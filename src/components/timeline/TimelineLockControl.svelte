<script lang="ts">
  import LockIcon from '@nasa-jpl/stellar/icons/svg/lock.svg?component';
  import UnlockIcon from '@nasa-jpl/stellar/icons/svg/unlock.svg?component';
  import { onMount } from 'svelte';
  import { timelineLockStatus } from '../../stores/views';
  import { TimelineLockStatus } from '../../utilities/timeline';

  let onKeydown = e => {
    if (e.key === 'Shift' && $timelineLockStatus !== TimelineLockStatus.Unlocked) {
      timelineLockStatus.set(TimelineLockStatus.TemporaryUnlock);
    }
  };

  let onKeyup = e => {
    if (e.key === 'Shift' && $timelineLockStatus === TimelineLockStatus.TemporaryUnlock) {
      timelineLockStatus.set(TimelineLockStatus.Locked);
    }
  };

  let onClick = () => {
    if ($timelineLockStatus === TimelineLockStatus.Locked) {
      timelineLockStatus.set(TimelineLockStatus.Unlocked);
    } else {
      timelineLockStatus.set(TimelineLockStatus.Locked);
    }
  };

  onMount(() => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('keyup', onKeyup);

    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('keyup', onKeyup);
    };
  });
</script>

<button class="st-button icon" on:click={onClick}>
  {#if $timelineLockStatus !== TimelineLockStatus.Locked}
    <UnlockIcon />
  {:else}
    <LockIcon />
  {/if}
</button>
