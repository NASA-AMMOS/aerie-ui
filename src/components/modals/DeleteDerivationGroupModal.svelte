<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DerivationGroup } from '../../types/external-source';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 150;
  export let derivationGroup: DerivationGroup;
  export let width: number = 380;

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: void;
  }>();

  function onKeydown(event: KeyboardEvent) {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      dispatch('confirm');
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<Modal {height} {width}>
  <ModalHeader on:close>
    {#if derivationGroup.sources.size > 0}
      Derivation Group Cannot Be Deleted
    {:else}
      Delete External Source
    {/if}
  </ModalHeader>
  <ModalContent>
    {#if derivationGroup.sources.size > 0}
      <span>
        This Derivation Group still contains the following sources which must be deleted first:
        <hr style="border: 0px"/>
        {#each derivationGroup.sources as source} 
          <div style="padding-left:20px">
            <i>
              {source[0]}
            </i>
          </div>
        {/each}
      </span>
    {:else}
      <span>
        Are you sure you want to delete "{derivationGroup.name}"?
        <i>What is done cannot be undone.</i>
      </span>
    {/if}
  </ModalContent>
  <ModalFooter>
    {#if derivationGroup.sources.size > 0}
      <button class="st-button" on:click={() => dispatch('close')}>
        Close
      </button>
    {:else}
      <button class="st-button secondary" on:click={() => dispatch('close')}>
        Cancel
      </button>
      <button class="st-button" on:click={() => dispatch('confirm')}>
        Delete
      </button>
    {/if}
  </ModalFooter>
</Modal>
