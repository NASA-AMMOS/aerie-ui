<script lang="ts">
  export let x = 0;
  export let label = '';
  export let color = '';
</script>

<div class="timeline-simulation-range-cursor" style="transform: translateX({x}px)">
  <div class="timeline-simulation-range-cursor-line" style="background: {color}" />
  <button class="timeline-simulation-range-cursor-icon" style="color: {color}" on:click>
    <slot />
  </button>
  <div class="timeline-simulation-range-cursor-label">{label}</div>
</div>

<style>
  .timeline-simulation-range-cursor {
    height: 100%;
    left: 0;
    opacity: 1;
    pointer-events: all;
    position: absolute;
    top: -10px;
    transform: translateX(0);
  }

  .timeline-simulation-range-cursor-icon {
    background-color: transparent;
    border: none;
    color: var(--st-gray-60);
    cursor: pointer;
    display: block;
    height: 16px;
    left: 0;
    left: -8px;
    margin: 0;
    padding: 0;
    pointer-events: all;
    position: absolute;
    top: -9px;
    width: 15px;
  }

  .timeline-simulation-range-cursor-line {
    background-color: var(--st-gray-70);
    display: block;
    height: 100%;
    left: -0.5px;
    opacity: 0.3;
    position: absolute;
    top: 0;
    width: 1px;
  }

  .timeline-simulation-range-cursor-label {
    background-color: var(--st-gray-15);
    border-radius: 16px;
    box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.25);
    font-size: 12px;
    left: 10px;
    letter-spacing: 0.04em;
    line-height: 16px;
    overflow: hidden;
    padding: 0 5px;
    pointer-events: all;
    position: relative;
    text-overflow: ellipsis;
    top: -11px;
    white-space: nowrap;
    z-index: 0;
  }
</style>
