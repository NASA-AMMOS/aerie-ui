<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ViewDefinition } from '../../types/view';
  import effects from '../../utilities/effects';
  import { tooltip } from '../../utilities/tooltip';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number | string = 150;
  export let width: number | string = 380;

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;
  let errors: string[] = [];
  let files: FileList;
  let viewDefinition: ViewDefinition | null;
  let viewName: string;

  async function onChange() {
    const { errors: validationErrors, definition: validViewDefinition } = await effects.loadViewFromFile(files);
    console.log(validationErrors, validViewDefinition);
    errors = validationErrors ?? [];
    viewDefinition = validViewDefinition;
  }

  function onClick() {
    fileInput.value = '';
  }

  function upload() {
    if (!errors.length) {
      dispatch('upload', { definition: viewDefinition, name: viewName });
    }
  }
</script>

<Modal {height} {width}>
  <ModalHeader on:close>Upload View JSON</ModalHeader>
  <ModalContent style="padding:0">
    <fieldset>
      <label for="name">View Name</label>
      <input bind:value={viewName} autocomplete="off" class="st-input w-100" name="name" required />
    </fieldset>
    <fieldset>
      <label for="file">View JSON File</label>
      <input
        bind:this={fileInput}
        class="w-100"
        class:error={!!errors.length}
        name="file"
        required
        type="file"
        bind:files
        on:click={onClick}
        on:change={onChange}
        use:tooltip={{ content: errors.join(', '), placement: 'bottom' }}
      />
    </fieldset>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>
    <button class="st-button" disabled={!!errors.length || !viewDefinition} on:click={upload}> Upload View </button>
  </ModalFooter>
</Modal>

<style>
  .error {
    background-color: var(--st-input-error-background-color);
    border: 1px solid var(--st-red);
    color: var(--st-red);
  }
</style>
