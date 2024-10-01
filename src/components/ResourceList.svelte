<svelte:options immutable={true} />

<script lang="ts">
  import CloseIcon from '@nasa-jpl/stellar/icons/close.svg?component';
  import { plan } from '../stores/plan';
  import { resourceTypes, simulationDatasetId } from '../stores/simulation';
  import type { User } from '../types/app';
  import type { ResourceType } from '../types/simulation';
  import type { TimelineItemType } from '../types/timeline';
  import effects from '../utilities/effects';
  import { permissionHandler } from '../utilities/permissionHandler';
  import { featurePermissions } from '../utilities/permissions';
  import ResourceListPrefix from './ResourceListPrefix.svelte';
  import TimelineItemList from './TimelineItemList.svelte';

  export let user: User | null;

  const uploadPermissionError: string = `You do not have permission to upload resources.`;

  let resourceDataTypes: string[] = [];
  let hasUploadPermission: boolean = false;
  let isUploadVisible: boolean = false;
  let useSelectedSimulation: boolean = false;
  let uploadFiles: FileList | undefined;
  let uploadFileInput: HTMLInputElement;

  $: resourceDataTypes = [...new Set($resourceTypes.map(t => t.schema.type))];
  $: if (user !== null && $plan !== null) {
    hasUploadPermission = featurePermissions.externalResources.canCreate(user, $plan);
  }

  function getFilterValueFromItem(item: TimelineItemType) {
    return (item as ResourceType).schema.type;
  }

  function onShowUpload() {
    isUploadVisible = true;
  }

  function onHideUpload() {
    isUploadVisible = false;
  }

  async function onUpload() {
    if (uploadFiles !== undefined) {
      if ($plan && uploadFiles?.length) {
        await effects.uploadExternalDataset(
          $plan,
          uploadFiles,
          user,
          useSelectedSimulation ? $simulationDatasetId : undefined,
        );
      }
      uploadFileInput.value = '';
      uploadFiles = undefined;
    }
  }
</script>

<TimelineItemList
  items={$resourceTypes}
  chartType="line"
  typeName="resource"
  typeNamePlural="Resources"
  filterOptions={resourceDataTypes.map(t => ({ label: t, value: t }))}
  filterName="Data Type"
  {getFilterValueFromItem}
  let:prop={item}
>
  <div slot="header" class="upload-container" hidden={!isUploadVisible}>
    <button class="close-upload" type="button" on:click={onHideUpload}>
      <CloseIcon />
    </button>
    <div class="upload-rows">
      <label for="file">Resources File</label>
      <input
        class="w-100"
        name="file"
        type="file"
        accept="application/json,.csv,.txt"
        bind:files={uploadFiles}
        bind:this={uploadFileInput}
        use:permissionHandler={{
          hasPermission: hasUploadPermission,
          permissionError: uploadPermissionError,
        }}
      />
      <label class="st-typography-body timeline-item-list-filter-option-label" for="simulation-association">
        Use selected simulation
      </label>
      <input
        bind:checked={useSelectedSimulation}
        class="simulation-checkbox"
        type="checkbox"
        name="simulation-association"
      />
    </div>
    <div class="upload-button-container">
      <button
        class="st-button secondary"
        disabled={!uploadFiles?.length}
        on:click={onUpload}
        use:permissionHandler={{
          hasPermission: hasUploadPermission,
          permissionError: uploadPermissionError,
        }}
      >
        Upload
      </button>
    </div>
  </div>
  <div slot="button">
    <button
      class="st-button secondary"
      on:click={onShowUpload}
      use:permissionHandler={{
        hasPermission: hasUploadPermission,
        permissionError: uploadPermissionError,
      }}
    >
      Upload Resources
    </button>
  </div>
  <ResourceListPrefix {item} />
</TimelineItemList>

<style>
  .upload-container {
    background: var(--st-gray-15);
    border-radius: 5px;
    margin: 5px;
    padding: 8px 11px 8px;
    position: relative;
  }

  .upload-container[hidden] {
    display: none;
  }

  .upload-container :global(.upload-rows) {
    column-gap: 8px;
    display: grid;
    grid-template-columns: max-content auto;
    justify-content: space-between;
    row-gap: 8px;
  }

  .st-button {
    gap: 4px;
    height: 20px;
  }

  .upload-container :global(.simulation-checkbox) {
    justify-self: left;
    margin: 0;
  }

  .upload-container :global(.upload-button-container) {
    display: flex;
    flex-flow: row-reverse;
    margin-top: 8px;
  }

  .upload-container :global(.close-upload) {
    background: none;
    border: 0;
    cursor: pointer;
    height: 1.3rem;
    padding: 0;
    position: absolute;
    right: 3px;
    top: 3px;
  }
</style>
