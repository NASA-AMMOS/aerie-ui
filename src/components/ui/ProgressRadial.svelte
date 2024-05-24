<script lang="ts">
  import HourglassIcon from 'bootstrap-icons/icons/hourglass-top.svg?component';

  export let progress: number = 0; // number between 0 and 100
  export let size: number = 16;
  export let useBackground: boolean = true;

  $: radius = size / 2 - 2;
  $: circumference = radius * 2 * Math.PI;
</script>

<div
  class="radial-progress"
  class:radial-progress-background={useBackground}
  style={`width:${size}px; height:${size}px`}
>
  {#if progress}
    <svg class="radial-progress-ring" width={size} height={size}>
      <circle
        class="radial-progress-ring-circle"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray={`${circumference} ${circumference}`}
        stroke-dashoffset={circumference - (progress / 100) * circumference}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  {:else}
    <div class="indeterminate-progress">
      <HourglassIcon />
    </div>
  {/if}
</div>

<style>
  .radial-progress {
    display: flex;
  }

  .radial-progress-background {
    background-color: var(--st-utility-blue);
    border-radius: 50%;
  }

  .radial-progress-ring-circle {
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: 0.35s stroke-dashoffset;
  }

  .radial-progress-background .indeterminate-progress {
    padding: 2px;
  }

  .indeterminate-progress {
    align-items: center;
    display: flex;
    flex: 1 0 auto;
    height: 100%;
    width: 100%;
  }
</style>
