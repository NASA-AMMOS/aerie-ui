<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { classNames } from '../../utilities/generic';
  import { useActions, type ActionArray } from '../../utilities/useActions';

  export let use: ActionArray = [];
  export let className: string = 'aa';

  const dispatch = createEventDispatcher<{
    click: void;
  }>();
</script>

<div
  class={classNames('context-menu-item st-typography-body', { [className]: !!className })}
  role="none"
  on:mouseenter
  on:mouseleave
  use:useActions={use}
  on:mouseup|preventDefault={() => dispatch('click')}
>
  <slot />
</div>

<style>
  .context-menu-item {
    cursor: pointer;
    padding: 4px;
    user-select: none;
    white-space: nowrap;
  }

  .context-menu-item:hover {
    background-color: var(--st-gray-20);
    border-radius: 4px;
  }
</style>
