<svelte:options immutable={true} />

<script lang="ts">
  import { PlanStatusMessages } from '../enums/planStatusMessages';
  import { activityTypes, plan, planReadOnly } from '../stores/plan';
  import type { User } from '../types/app';
  import type { Tag } from '../types/tags';
  import effects from '../utilities/effects';
  import { featurePermissions } from '../utilities/permissions';
  import TimelineItemList from './TimelineItemList.svelte';

  export let user: User | null;

  let hasPermission: boolean = false;
  let activitySubsystems: Tag[] = [];

  $: permissionError = $planReadOnly ? PlanStatusMessages.READ_ONLY : 'You do not have permission to add an activity.';
  $: if ($plan !== null) {
    hasPermission = featurePermissions.activityDirective.canCreate(user, $plan) && !$planReadOnly;
  }

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

  /* TODO why not place the directive in the middle of the view? */
  function createItem(type: string) {
    if ($plan !== null) {
      const { start_time_doy } = $plan;
      effects.createActivityDirective({}, start_time_doy, type, type, {}, $plan, user);
    }
  }
</script>

<TimelineItemList
  {hasPermission}
  {permissionError}
  items={$activityTypes}
  chartType="activity"
  typeName="activity"
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
  {createItem}
/>
