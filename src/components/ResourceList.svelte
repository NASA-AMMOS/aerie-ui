<svelte:options immutable={true} />

<script lang="ts">
  import { resourceTypes } from '../stores/simulation';
  import ResourceListPrefix from './ResourceListPrefix.svelte';
  import TimelineItemList from './TimelineItemList.svelte';

  let resourceDataTypes: string[] = [];

  $: resourceDataTypes = [...new Set($resourceTypes.map(t => t.schema.type))];
</script>

<TimelineItemList
  items={$resourceTypes}
  chartType="line"
  typeName="resource"
  typeNamePlural="Resources"
  filterItems={(items, textFilters, selectedFilterOptions) => {
    /* TODO refactor, export FilterOption and move this to a ts function  */
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
  let:prop={item}
>
  <!-- TODO figure out slot typing here -->
  <ResourceListPrefix {item} />
</TimelineItemList>
