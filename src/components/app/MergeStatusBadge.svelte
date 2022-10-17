<script lang="ts">
  import PlanIcon from '@nasa-jpl/stellar/icons/plan.svg?component';
  import { createEventDispatcher } from 'svelte';

  export let incoming: boolean | null = false;
  export let outgoing: boolean | null = false;

  const dispatch = createEventDispatcher();
</script>

<button
  class="st-button tertiary merge-status-badge st-typography-medium"
  class:outgoing
  on:click={() => dispatch('click')}
>
  <span class="status-icon" class:active={incoming}>
    <PlanIcon />
  </span>
  <span class="status-icon" class:active={outgoing}>
    <PlanIcon />
  </span>
  <span>Merge Status</span>
</button>

<style>
  .merge-status-badge {
    align-items: center;
    background: rgba(255, 255, 255, 0.24);
    border-radius: 4px;
    color: var(--st-white);
    display: flex;
    flex-direction: row;
    gap: 8px;
    height: 24px;
    justify-content: center;
    letter-spacing: 0.025em;
    line-height: 16px;
    padding: 4px 8px;
  }

  .merge-status-badge.st-button.tertiary:hover:not([disabled]) {
    background: rgba(255, 255, 255, 0.2);
  }

  .status-icon {
    color: var(--st-white);
    display: flex;
    opacity: 0.4;
  }

  .status-icon.active {
    color: #ffcf25;
    opacity: 1;
  }
</style>
