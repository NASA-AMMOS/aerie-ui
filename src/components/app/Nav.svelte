<script lang="ts">
  import AppMenu from '../../components/menus/AppMenu.svelte';
  import MergeStatusBadge from './MergeStatusBadge.svelte';

  const incomingMergeRequestCount = 1;
  const outgoingMergeRequestCount = 0;
</script>

<div class="nav">
  <div class="left">
    <AppMenu />
    <div class="divider">|</div>
    <div class="title st-typography-medium">
      <slot name="title" />
    </div>
    <div class="divider">|</div>
    {#if incomingMergeRequestCount > 0 || outgoingMergeRequestCount > 0}
      <MergeStatusBadge {incomingMergeRequestCount} {outgoingMergeRequestCount} />
    {/if}
    <slot name="left" />
  </div>
  <div class="right">
    <slot name="right" />
  </div>
</div>

<style>
  .nav {
    align-items: center;
    background: var(--st-primary);
    color: var(--st-primary-background-color);
    display: flex;
    font-size: 1rem;
    height: 42px;
    padding: 1rem;
    z-index: 2;
  }

  .divider {
    color: var(--st-gray-50);
    font-size: 12px;
  }

  .title {
    align-items: center;
    color: var(--st-gray-20);
  }

  .left {
    align-items: center;
    display: flex;
    flex-grow: 1;
    gap: 10px;
  }

  .right {
    align-items: center;
    display: inline-flex;
  }
</style>
