<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ExternalEventType } from '../../types/external-event';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 150;
  export let eventType: ExternalEventType;
  export let associatedSources: string[] = []; // ManageGroupsAndTypesModal already retrieves all keys
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
    {#if associatedSources.length > 0}
      External Event Type Cannot Be Deleted
    {:else}
      Delete External Event Type
    {/if}
  </ModalHeader>
  <ModalContent>
    {#if associatedSources.length > 0}
      <span>
        This External Event Type still contains the following sources which must be deleted first:
        <hr style="border: 0px" />
        {#each associatedSources as source}
          <div class="modal-content" style:padding-left=20px>
            <i>
              {source}
            </i>
          </div>
        {/each}
      </span>
    {:else}
      <span class="modal-content">
        Are you sure you want to delete "{eventType.name}"?
        <i>What is done cannot be undone.</i>
      </span>
    {/if}
  </ModalContent>
  <ModalFooter>
    {#if associatedSources.length > 0}
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
