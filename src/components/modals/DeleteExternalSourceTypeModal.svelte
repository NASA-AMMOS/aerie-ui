<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DerivationGroup, ExternalSourceType } from '../../types/external-source';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 150;
  export let sourceType: ExternalSourceType;
  export let associatedDerivationGroups: DerivationGroup[] = [];
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
    {#if associatedDerivationGroups.length > 0}
      External Source Type Cannot Be Deleted
    {:else}
      Delete External Source
    {/if}
  </ModalHeader>
  <ModalContent>
    {#if associatedDerivationGroups.length > 0}
      <span>
        The following Derivation Groups paired with this External Source Type still exist and must be deleted first:
        <hr style="border: 0px" />
        {#each associatedDerivationGroups as derivationGroup}
          <div class="modal-content" style:padding-left=20px>
            <i>
              {derivationGroup.name}
            </i>
          </div>
        {/each}
      </span>
    {:else}
      <span class="modal-content">
        Are you sure you want to delete "{sourceType.name}"?
        <i>What is done cannot be undone.</i>
      </span>
    {/if}
  </ModalContent>
  <ModalFooter>
    {#if associatedDerivationGroups.length > 0}
      <button class="st-button" on:click={() => dispatch('close')}> Close </button>
    {:else}
      <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>
      <button class="st-button" on:click={() => dispatch('confirm')}> Delete </button>
    {/if}
  </ModalFooter>
</Modal>

<style>
  .modal-content {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
