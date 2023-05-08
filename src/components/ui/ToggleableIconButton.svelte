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
  export { className as class };

  let className: string = '';

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch('toggle', !isOn);
  }
</script>

<button
  class={classNames('toggleable-icon-button ', {
    [className]: !!className,
  })}
  on:click={onClick}
  use:tooltip={{ content: isOn ? onTooltipContent : offTooltipContent, placement: 'bottom' }}
>
  <ToggleableIcon {isOn} on:click={onClick}>
    <slot />
    <slot name="offIcon" slot="offIcon" />
  </ToggleableIcon>
</button>

<style>
  .toggleable-icon-button {
    align-items: center;
    background: none;
    border: 0;
    display: inline-flex;
  }

  .toggleable-icon-button:hover {
    cursor: pointer;
  }
</style>
