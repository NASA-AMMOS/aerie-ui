<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number = 150;
  export let width: number = 380;
  export let plan: Plan;

  const dispatch = createEventDispatcher();

  let newBranchName: string = '';
  let createButtonDisabled: boolean = true;

  $: createButtonDisabled = newBranchName === '';

  function create() {
    if (!createButtonDisabled) {
      dispatch('create', { name: newBranchName, plan });
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
  <ModalHeader on:close>New Branch</ModalHeader>
  <ModalContent>
    <fieldset>
      <label for="name">Name of branch</label>
      <input
        bind:value={newBranchName}
        placeholder="Name of branch"
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
    <button class="st-button" disabled={createButtonDisabled} on:click={create}> Create Branch </button>
  </ModalFooter>
</Modal>
