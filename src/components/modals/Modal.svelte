<svelte:options immutable={true} />

<script lang="ts">
  export let height: number | string = 350;
  export let width: number | string = 400;

  let modal: HTMLDivElement | null = null;

  $: heightStyle = typeof height === 'number' ? `${height}px` : height;
  $: widthStyle = typeof width === 'number' ? `${width}px` : width;

  function onClickOutside(event: MouseEvent | TouchEvent) {
    // Stop propagation of events that originate from within the modal
    // to prevent the modal from closing.
    if (modal && modal.contains(event.target as Node)) {
      event.stopPropagation();
    }
  }
</script>

<div class="modal-container">
  <div
    bind:this={modal}
    class="modal st-typography-body"
    role="none"
    style:height={heightStyle}
    style:width={widthStyle}
    on:click={onClickOutside}
  >
    <slot />
  </div>
</div>

<style>
  .modal-container {
    align-items: center;
    background-color: #00000052;
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 999;
  }

  .modal {
    background-color: var(--st-primary-background-color);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    min-height: 150px;
    text-align: left;
    z-index: 1000;
  }
</style>
