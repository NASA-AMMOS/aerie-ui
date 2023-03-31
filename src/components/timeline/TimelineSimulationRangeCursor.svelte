<script lang="ts">
  export let x = 0;
</script>

<div class="timeline-simulation-range-cursor" style="transform: translateX({x}px)">
  <div class="timeline-simulation-range-cursor-line" />
  <button class="timeline-simulation-range-cursor-icon" on:click>
    <slot />
  </button>
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
</style>
