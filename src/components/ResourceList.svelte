<svelte:options immutable={true} />

<script lang="ts">
  import { resourceTypes } from '../stores/simulation';
  import TimelineItemList from './TimelineItemList.svelte';

  let resourceDataTypes: string[] = [];

  $: resourceDataTypes = [...new Set($resourceTypes.map(t => t.schema.type))];
</script>

<TimelineItemList
  items={$resourceTypes}
  chartType="line"
  typeName="resource"
  filterItems={(items, textFilters, selectedFilterOptions) => {
    return items.filter(({ name, schema }) => {
      let matchesText = true;
      let matchesDataType = true;
      const itemDataType = schema.type;
      for (let i = 0; i < textFilters.length; i++) {
        const textFilter = textFilters[i];
        if (!name.toLowerCase().includes(textFilter.toLowerCase())) {
          matchesText = false;
        }
      }
      if (Object.keys(selectedFilterOptions).length > 0) {
        if (!itemDataType) {
          matchesDataType = false;
        } else {
          matchesDataType = !!selectedFilterOptions[itemDataType];
        }
      }
      return matchesText && matchesDataType;
    });
  }}
  filterOptions={resourceDataTypes.map(t => ({ label: t, value: t }))}
  filterName="Data Type"
>
  <!-- TODO figure out slot for resource specific labeling -->
  <!-- <ResourceListPrefix {item} slot="prefix" /> -->
</TimelineItemList>
