<svelte:options immutable={true} />

<script lang="ts">
  import { resourceTypes } from '../stores/simulation';
  import type { ResourceType } from '../types/simulation';
  import type { TimelineItemType } from '../types/timeline';
  import ResourceListPrefix from './ResourceListPrefix.svelte';
  import TimelineItemList from './TimelineItemList.svelte';

  let resourceDataTypes: string[] = [];

  $: resourceDataTypes = [...new Set($resourceTypes.map(t => t.schema.type))];

  // function filterItems(
  //   items: TimelineItemType[],
  //   textFilters: string[],
  //   selectedFilterOptions: Record<string, TimelineItemListFilterOption>,
  // ) {
  //   return items.filter(({ name, schema }) => {
  //     let matchesText = true;
  //     let matchesDataType = true;
  //     const itemDataType = schema.type;
  //     for (let i = 0; i < textFilters.length; i++) {
  //       const textFilter = textFilters[i];
  //       if (!name.toLowerCase().includes(textFilter.toLowerCase())) {
  //         matchesText = false;
  //       }
  //     }
  //     if (Object.keys(selectedFilterOptions).length > 0) {
  //       if (!itemDataType) {
  //         matchesDataType = false;
  //       } else {
  //         matchesDataType = !!selectedFilterOptions[itemDataType];
  //       }
  //     }
  //     return matchesText && matchesDataType;
  //   });
  // }

  function getFilterValueFromItem(item: TimelineItemType) {
    return (item as ResourceType).schema.type;
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
  <!-- TODO figure out slot typing here -->
  <ResourceListPrefix {item} />
</TimelineItemList>
