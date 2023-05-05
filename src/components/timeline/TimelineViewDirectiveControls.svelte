<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ActivityDirectiveIcon from '../ui/ActivityDirectiveIcon.svelte';
  import ToggleableIconButton from '../ui/ToggleableIconButton.svelte';

  export let directivesVisible: boolean = true;
  export let onTooltipContent: string = '';
  export let offTooltipContent: string = '';
  export let useBorder: boolean = true;

  const dispatch = createEventDispatcher();

  function onToggleDirectiveVisibility(event: CustomEvent<boolean>) {
    const { detail } = event;
    dispatch('toggleDirectiveVisibility', detail);
  }
</script>

<ToggleableIconButton
  class="toggle-icon-button"
  isOn={directivesVisible}
  {offTooltipContent}
  {onTooltipContent}
  {useBorder}
  on:toggle={onToggleDirectiveVisibility}
>
  <ActivityDirectiveIcon backgroundColor="#ccc" size="12px" />
  <div slot="offIcon" class="off-icon">
    <ActivityDirectiveIcon backgroundColor="#ccc" size="12px" />
    <div class="toggle-slash" />
  </div>
</ToggleableIconButton>

<style>
  .off-icon {
    align-items: center;
    display: inline-flex;
    position: relative;
  }

  .toggle-slash {
    background-color: var(--st-gray-70);
    bottom: 6px;
    height: 2px;
    left: -3px;
    outline: 2px solid #fff;
    position: absolute;
    transform: rotate(-35deg);
    width: 20px;
  }

  :global(.toggle-icon-button svg g) {
    opacity: 1;
  }
</style>
