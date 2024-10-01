<svelte:options immutable={true} />

<script lang="ts">
  import { selectedPlanDerivationGroupEventTypes } from '../stores/external-source';
  import type { ExternalEventType } from '../types/external-event';
  import type { TimelineItemType } from '../types/timeline';
  import TimelineItemList from './TimelineItemList.svelte';

  let externalEventTypes: ExternalEventType[] = [];

  $: externalEventTypes = $selectedPlanDerivationGroupEventTypes.map(eventType => {
    return { name: eventType };
  });

  function getFilterValueFromItem(item: TimelineItemType) {
    return item.name;
  }
</script>

<TimelineItemList
  items={externalEventTypes}
  chartType="externalEvent"
  typeName="externalEvent"
  typeNamePlural="External Events"
  filterOptions={$selectedPlanDerivationGroupEventTypes.map(t => ({ label: t, value: t }))}
  filterName="Event Type"
  {getFilterValueFromItem}
/>
