<svelte:options immutable={true} />

<script lang="ts">
  import { base } from '$app/paths';
  import { createEventDispatcher } from 'svelte';
  import { plans } from '../../stores/plans';
  import type { ExternalSourceWithResolvedNames, PlanDerivationGroup } from '../../types/external-source';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 150;
  export let linked: PlanDerivationGroup[] = [];
  export let width: number = 380;
  export let source: ExternalSourceWithResolvedNames;

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
    {#if linked.length > 0}
      External Source Cannot Be Deleted
    {:else}
      Delete External Source
    {/if}
  </ModalHeader>
  <ModalContent>
    {#if linked.length > 0}
      <span style="display:block;overflow:hidden;text-overflow:ellipsis">
        This External Source is part of Derivation Group '{source.derivation_group}', which is linked with the following plans:
        {#each linked as link}
          <div style="padding-left:20px">
            <i>
              <a href="{base}/plans/{link.plan_id}">
                {$plans.find(plan => link.plan_id === plan.id)?.name}
              </a>
            </i>
          </div>
        {/each}
      </span>
    {:else}
      <span style="display:block;overflow:hidden;text-overflow:ellipsis">
        Are you sure you want to delete "{source.key}"?
        <i>What is done cannot be undone.</i>
      </span>
    {/if}
  </ModalContent>
  <ModalFooter>
    {#if linked.length > 0}
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
