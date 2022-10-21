<script lang="ts">
  export let x = 0;
  export let maxWidth = 0;
  export let label = '';
</script>

<div class="timeline-cursor" style="transform: translateX({x}px)">
  <div class="timeline-cursor-label" style="max-width: {maxWidth}px">{label}</div>
</div>

<style>
  .timeline-cursor {
    height: calc(100% + 0.5rem);
    left: 0;
    opacity: 1;
    pointer-events: none;
    position: absolute;
    top: -10px;
    transform: translateX(0);
  }

  .timeline-cursor::before {
    background-color: var(--st-gray-50);
    border-radius: 100%;
    content: '';
    display: block;
    height: 9px;
    left: -4px;
    position: absolute;
    top: -0.5rem;
    width: 9px;
  }

  .timeline-cursor::after {
    background-color: var(--st-gray-50);
    content: '';
    display: block;
    height: 100%;
    left: 0;
    position: absolute;
    top: -0.5rem;
    width: 1px;
  }

  .timeline-cursor-label {
    background-color: var(--st-gray-15);
    border-radius: 16px;
    font-size: 12px;
    left: 10px;
    line-height: 16px;
    overflow: hidden;
    padding: 0 5px;
    position: relative;
    text-overflow: ellipsis;
    top: -11px;
    white-space: nowrap;
  }
</style>
