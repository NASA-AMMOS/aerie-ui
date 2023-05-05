<script lang="ts">
  interface $$Events {
    toggle: CustomEvent<boolean>;
  }

  import { createEventDispatcher } from 'svelte';
  import { classNames } from '../../utilities/generic';
  import { tooltip } from '../../utilities/tooltip';
  import ToggleableIcon from './ToggleableIcon.svelte';

  export let isOn: boolean = true;
  export let onTooltipContent: string = '';
  export let offTooltipContent: string = '';
  export let useBorder: boolean = true;
  export { className as class };

  let className: string = '';

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch('toggle', !isOn);
  }
</script>

<button
  class={classNames('st-button icon', {
    'border-button': useBorder,
    [className]: !!className,
  })}
  on:click={onClick}
  use:tooltip={{ content: isOn ? onTooltipContent : offTooltipContent, placement: 'bottom' }}
>
  <div class="icon-container">
    <ToggleableIcon {isOn}>
      <slot />
      <slot name="offIcon" slot="offIcon" />
    </ToggleableIcon>
  </div>
</button>

<style>
  .st-button {
    color: var(--st-gray-70);
  }

  .st-button.border-button {
    border: 1px solid var(--st-gray-30);
  }

  .icon-container {
    align-items: center;
    display: inline-flex;
  }
</style>
