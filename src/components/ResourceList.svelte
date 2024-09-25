<svelte:options immutable={true} />

<script lang="ts">
  import { plan } from '../stores/plan';
  import { resourceTypes } from '../stores/simulation';
  import type { User } from '../types/app';
  import type { ResourceType } from '../types/simulation';
  import type { TimelineItemType } from '../types/timeline';
  import effects from '../utilities/effects';
  import { featurePermissions } from '../utilities/permissions';
  import ResourceListPrefix from './ResourceListPrefix.svelte';
  import TimelineItemList from './TimelineItemList.svelte';

  export let user: User | null;

  let resourceDataTypes: string[] = [];
  let hasUploadPermission: boolean = false;

  $: resourceDataTypes = [...new Set($resourceTypes.map(t => t.schema.type))];
  $: if (user !== null && $plan !== null) {
    hasUploadPermission = featurePermissions.externalResources.canCreate(user, $plan);
  }

  function getFilterValueFromItem(item: TimelineItemType) {
    return (item as ResourceType).schema.type;
  }

  async function onUploadFile(event: CustomEvent<FileList>) {
    const { detail: uploadFiles } = event;
    if ($plan && uploadFiles?.length) {
      await effects.uploadExternalDataset($plan, uploadFiles, user);
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
  shouldShowUploadOption
  {hasUploadPermission}
  {getFilterValueFromItem}
  let:prop={item}
  on:upload={onUploadFile}
>
  <ResourceListPrefix {item} />
</TimelineItemList>
