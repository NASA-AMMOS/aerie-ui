<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createExternalEventTypeError } from '../../stores/external-event';
  import {
    createDerivationGroupError,
    createExternalSourceTypeError,
    externalSourceTypes,
  } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import effects from '../../utilities/effects';
  import AlertError from '../ui/AlertError.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import Tab from '../ui/Tabs/Tab.svelte';
  import TabPanel from '../ui/Tabs/TabPanel.svelte';
  import Tabs from '../ui/Tabs/Tabs.svelte';
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

  function onCreateDerivationGroup() {
    if (newTypeName === '') {
      newTypeError = 'Please select a source type.';
    } else if (newTypeSourceType === '') {
      newTypeError = 'Please enter a new type name.';
    } else {
      effects.createDerivationGroup({ name: newTypeName, source_type_name: newTypeSourceType }, user);
      newTypeName = '';
      newTypeSourceType = '';
    }
  }

  function onCreateExternalSourceType() {
    if (newTypeName === '') {
      newTypeError = 'Please enter a new type name.';
    } else {
      effects.createExternalSourceType({ name: newTypeName }, user);
      newTypeName = '';
    }
  }

  function onCreateExternalEventType() {
    if (newTypeName === '') {
      newTypeError = 'Please enter a new type name.';
    } else {
      effects.createExternalEventType({ name: newTypeName }, user);
      newTypeName = '';
    }
  }
</script>

<Modal height={240} width={600}>
  <ModalHeader on:close>Create Derivation Groups or Types</ModalHeader>
  <ModalContent>
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="derivation-groups-modal-filter-container">
        <div style="width:100%">
          <Tabs class="creation-tabs" tabListClassName="creation-tabs-list">
            <svelte:fragment slot="tab-list">
              <Tab class="creation-tab">Derivation Group</Tab>
              <Tab class="creation-tab">External Source Type</Tab>
              <Tab class="creation-tab">External Event Type</Tab>
            </svelte:fragment>
            <TabPanel>
              <p style="padding-top:10px">Provide a name and an external source type for the new derivation group.</p>
              <p><i>The newly created group will be empty, though you can upload sources into it.</i></p>
              <div class="timeline-editor-layer-filter">
                <input
                  bind:value={newTypeName}
                  on:change={() => (newTypeError = null)}
                  autocomplete="off"
                  class="st-input w-100"
                  name="filter-ee"
                  placeholder="New Derivation Group Name"
                />
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
                <button class="st-button w-10" type="submit" on:click|preventDefault={onCreateDerivationGroup}>
                  Create
                </button>
              </div></TabPanel
            >
            <TabPanel>
              <p style="padding-top:10px">Provide a name for the new external source type.</p>
              <p><i>The newly created external source type will be empty, though you can upload sources into it.</i></p>
              <div class="timeline-editor-layer-filter">
                <input
                  bind:value={newTypeName}
                  on:change={() => (newTypeError = null)}
                  autocomplete="off"
                  class="st-input w-100"
                  name="filter-ee"
                  placeholder="New External Source Type Name"
                />
                <button class="st-button w-10" type="submit" on:click|preventDefault={onCreateExternalSourceType}>
                  Create
                </button>
              </div></TabPanel
            >
            <TabPanel>
              <p style="padding-top:10px">Provide a name for the new external event type.</p>
              <p><i>The newly created external event type will be empty, though you can upload events into it.</i></p>
              <div class="timeline-editor-layer-filter">
                <input
                  bind:value={newTypeName}
                  on:change={() => (newTypeError = null)}
                  autocomplete="off"
                  class="st-input w-100"
                  name="filter-ee"
                  placeholder="New External Event Type Name"
                />
                <button class="st-button w-10" type="submit" on:click|preventDefault={onCreateExternalEventType}>
                  Create
                </button>
              </div></TabPanel
            >
          </Tabs>
        </div>
        <div style="flex-direction: column;">
          <p>
            <AlertError class="m-2" style="margin: 1.0rem 0; padding-bottom: 0px" error={newTypeError} />
            <AlertError class="m-2" error={$createExternalSourceTypeError} />
            <AlertError class="m-2" error={$createExternalEventTypeError} />
            <AlertError class="m-2" error={$createDerivationGroupError} />
          </p>
        </div>
      </div>
    </CssGrid>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Close </button>
  </ModalFooter>
</Modal>

<style>
  :global(.tab-list.creation-tabs-list) {
    background-color: var(--st-gray-10);
  }

  :global(button.creation-tab) {
    align-items: center;
    gap: 8px;
    text-align: center;
    width: 33%;
  }

  :global(button.creation-tab:last-of-type) {
    flex: 1;
  }
  :global(button.creation-tab:last-of-type.selected) {
    box-shadow: 1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.creation-tab:first-of-type.selected) {
    box-shadow: -1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.creation-tab:not(.selected)) {
    box-shadow: 0px -1px 0px inset var(--st-gray-20);
  }

  :global(button.creation-tab.selected) {
    background-color: var(--st-gray-20);
    box-shadow:
      1px 0px 0px inset var(--st-gray-20),
      -1px 0px 0px inset var(--st-gray-20);
  }

  .derivation-groups-modal-filter-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    justify-content: flex-end;
    padding-right: 8px;
    width: 575px;
  }

  .timeline-editor-layer-filter {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-bottom: 10px;
    padding-top: 10px;
  }
</style>
