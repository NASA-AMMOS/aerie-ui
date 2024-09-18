<svelte:options immutable={true} />

<script lang="ts">
  import { selectedPlanDerivationGroupEventTypes } from '../stores/external-source';
  import type { ExternalEventType } from '../types/external-event';
  import type { TimelineItemType } from '../types/timeline';
  import TimelineItemList from './TimelineItemList.svelte';

  let externalEventTypes: ExternalEventType[] = [];

  $: $selectedPlanDerivationGroupEventTypes.map(eventType => { eventType });

  function getFilterValueFromItem(item: TimelineItemType) {
    return item.name;
  }
</script>

<TimelineItemList
  items={externalEventTypes}
  chartType="external-event"
  typeName="external event type"
  typeNamePlural="External Event Types"
  filterOptions={$selectedPlanDerivationGroupEventTypes.map(t => ({ label: t, value: t }))}
  filterName="External Event Type"
  {getFilterValueFromItem}
/>
