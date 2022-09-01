<svelte:options immutable={true} />

<script lang="ts">
  let container: HTMLDivElement;
  let input: HTMLInputElement | null;
  let details: HTMLDivElement | null;
  let right: HTMLDivElement | null;

  function setChildrenStyles(elements: HTMLElement[]) {
    for (const el of elements) {
      if (el) {
        for (const child of Array.from(el.children)) {
          if (child.nodeName === 'I') {
            const i = child as HTMLElement;

            i.style.color = 'var(--st-input-icon-color)';
            i.style.cursor = 'auto';

            if (input.disabled) {
              i.style.color = 'var(--st-gray-30)';
              i.style.cursor = 'not-allowed';
            }

            if (input.classList.contains('error')) {
              i.style.color = 'var(--st-red)';
              i.style.cursor = 'auto';
            }
          }
        }
      }
    }
  }
</script>

<div bind:this={container} class="input">
  {#if $$slots.left}
    <div bind:this={left} class="left">
      <slot name="left" />
    </div>
  {/if}

  <slot>No input element provided!</slot>

  {#if $$slots.right}
    <div bind:this={right} class="right">
      <slot name="right" />
    </div>
  {/if}
</div>

<style>
  .input {
    align-items: center;
    display: inline-flex;
    position: relative;
    width: 100%;
  }

  .input > .left,
  .input > .right {
    position: absolute;
  }
</style>
