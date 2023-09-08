<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Plan } from '../../types/plan';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 270;
  export let width: number = 280;
  export let plan: Plan;

  const dispatch = createEventDispatcher();

  let snapshotName: string = '';
  let createButtonDisabled: boolean = true;

  $: createButtonDisabled = snapshotName === '';

  function create() {
    if (!createButtonDisabled) {
      dispatch('create', { name: snapshotName, plan });
    }
  }

  function onKeydown(event: KeyboardEvent) {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      create();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<Modal {height} {width}>
  <ModalHeader on:close>Create Snapshot</ModalHeader>
  <ModalContent style=" display: flex; flex-direction: column; gap: 8px; padding:8px 0 0 ;">
    <fieldset>
      <label for="name">Name of snapshot</label>
      <input
        bind:value={snapshotName}
        placeholder="Name of snapshot"
        autocomplete="off"
        class="st-input w-100"
        name="name"
        required
        type="text"
      />
    </fieldset>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>
    <button class="st-button" disabled={createButtonDisabled} on:click={create}> Create Snapshot </button>
  </ModalFooter>
</Modal>
