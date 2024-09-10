<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createExternalEventTypeError } from '../../stores/external-event';
  import {
    createDerivationGroupError,
    createExternalSourceTypeError,
    externalSourceTypes
  } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import type { RadioButtonId } from '../../types/radio-buttons';
  import effects from '../../utilities/effects';
  import AlertError from '../ui/AlertError.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import RadioButton from '../ui/RadioButtons/RadioButton.svelte';
  import RadioButtons from '../ui/RadioButtons/RadioButtons.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let user: User | null;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  let modalColumnSize: string = modalColumnSizeNoDetail;

  let newTypeName: string = '';
  let newTypeSourceType: string = '';
  let newTypeError: string | null = null;
  let categorySelector: RadioButtonId = 'derivation-group';

  async function onCreateType() {
    switch (categorySelector) {
      case 'derivation-group':
        if (newTypeName === '') {
          newTypeError = 'Please select a source type.';
        } else if (newTypeSourceType === '') {
          newTypeError = 'Please enter a new type name.';
        } else {
          effects.createDerivationGroup({ name: newTypeName, source_type_name: newTypeSourceType }, user);
          newTypeName = '';
          newTypeSourceType = '';
          console.log($createDerivationGroupError)
        }
        break;
      case 'eet':
        if (newTypeName === '') {
          newTypeError = 'Please enter a new type name.';
        } else {
          effects.createExternalEventType({ name: newTypeName }, user);
          newTypeName = '';
        }
        break;
      default: // 'est'
        if (newTypeName === '') {
          newTypeError = 'Please enter a new type name.';
        } else {
          effects.createExternalSourceType({ name: newTypeName }, user);
          newTypeName = '';
        }
        break;
    }
  }
</script>

<Modal height={categorySelector === "derivation-group" ? 225 : 240} width={600}>
  <ModalHeader on:close>
    Create Derivation Groups or Types
  </ModalHeader>
  <ModalContent>
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="derivation-groups-modal-filter-container">
        <div style="width:100%">
          <RadioButtons
            selectedButtonId={categorySelector}
            on:select-radio-button={(event) => {
              const {
                detail: { id },
              } = event;
              categorySelector = id;
            }}
          >
            <RadioButton id="derivation-group">
              <div class="association-button">Derivation Group</div>
            </RadioButton>
            <RadioButton id="external-source-type">
              <div class="association-button">External Source Type</div>
            </RadioButton>
            <RadioButton id="external-event-type">
              <div class="association-button">External Event Type</div>
            </RadioButton>
          </RadioButtons>
        </div>
        <div style="flex-direction: column;">
          <p>
            <AlertError class="m-2" style="margin: 1.0rem 0; padding-bottom: 0px" error={newTypeError} />
            <AlertError class="m-2" error={$createExternalSourceTypeError} />
            <AlertError class="m-2" error={$createExternalEventTypeError} />
            <AlertError class="m-2" error={$createDerivationGroupError} />
          </p>
          <p style="padding-top:10px">
            Provide a name and an external source type for the new 
            {categorySelector === "derivation-group" ? "derivation group" : categorySelector === "external-source-type" ? "external source type" : "external event type"}.
          </p>
          <p>
            <i>
              {categorySelector === "derivation-group" ? 
                  "The newly created group will be empty, though you can upload sources into it." : 
                  categorySelector === "external-source-type" ? 
                    "The new external source type will not have any sources or groups associated, though that can be changed later by creating a new group or uploading a new source." : 
                    "The new external event type will not have any events, though that can be changed later by uploading a new source."}
            </i>
          </p>
          <div class="timeline-editor-layer-filter">
            <input
              bind:value={newTypeName}
              on:change={() => (newTypeError = null)}
              autocomplete="off"
              class="st-input w-100"
              name="filter-ee"
              placeholder={`New ${categorySelector === 'derivation-group' ? 'Derivation Group' : categorySelector === 'external-source-type' ? 'External Source Type' : 'External Event Type'} name`}
            />
            {#if categorySelector === 'derivation-group'}
              <select
                bind:value={newTypeSourceType}
                on:change={() => (newTypeError = null)}
                name="newTypeSourceType"
                class="st-select"
                style="width: 200px"
              >
                {#each $externalSourceTypes as sourceType}
                  <option value={sourceType.name}>{sourceType.name}</option>
                {/each}
              </select>
            {/if}
            <button class="st-button w-10" type="submit" on:click|preventDefault={onCreateType}> Create </button>
          </div>
        </div>
      </div>
    </CssGrid>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Close </button>
  </ModalFooter>
</Modal>

<style>
  .derivation-groups-modal-filter-container {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    padding-right: 8px;
    flex-direction: column;
    height: 100%;
    width: 575px;
  }

  .timeline-editor-layer-filter {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
</style>
