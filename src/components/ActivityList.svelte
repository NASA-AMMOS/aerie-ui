<svelte:options immutable={true} />

<script lang="ts">
  import { activityTypes } from '../stores/plan';
  import type { Tag } from '../types/tags';
  import TimelineItemList from './TimelineItemList.svelte';

  let activitySubsystems: Tag[] = [];

  $: if ($activityTypes) {
    let newActivitySubsystems: Tag[] = [];
    const seenSubsystems: Record<number, boolean> = {};
    $activityTypes.forEach(t => {
      if (t.subsystem_tag && !seenSubsystems[t.subsystem_tag.id]) {
        seenSubsystems[t.subsystem_tag.id] = true;
        newActivitySubsystems.push(t.subsystem_tag);
      }
    });
    activitySubsystems = newActivitySubsystems;
  }
</script>

<TimelineItemList
  items={$activityTypes}
  chartType="activity"
  typeName="activity"
  typeNamePlural="Activities"
  filterItems={(items, textFilters, selectedFilterOptions) => {
    return items.filter(({ name, subsystem_tag }) => {
      let matchesText = true;
      let matchesSubsystem = true;
      for (let i = 0; i < textFilters.length; i++) {
        const textFilter = textFilters[i];
        if (!name.toLowerCase().includes(textFilter.toLowerCase())) {
          matchesText = false;
        }
      }
      if (Object.keys(selectedFilterOptions).length > 0) {
        if (!subsystem_tag) {
          matchesSubsystem = false;
        } else {
          matchesSubsystem = !!selectedFilterOptions[subsystem_tag.id];
        }
      }
      return matchesText && matchesSubsystem;
    });
  }}
  filterOptions={activitySubsystems.map(s => ({ color: s.color || '', label: s.name, value: s.id.toString() }))}
  filterName="Subsystem"
/>
