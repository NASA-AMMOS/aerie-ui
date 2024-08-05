<svelte:options immutable={true} />

<script lang="ts">
  import DirectiveIcon from '../../assets/timeline-directive.svg?component';
  import TimelineLineLayerIcon from '../../assets/timeline-line-layer.svg?component';
  import type { User } from '../../types/app';
  import type { ViewGridSection } from '../../types/view';
  import ActivityList from '../ActivityList.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import ResourceList from '../ResourceList.svelte';
  import Panel from '../ui/Panel.svelte';
  import Tab from '../ui/Tabs/Tab.svelte';
  import TabPanel from '../ui/Tabs/TabPanel.svelte';
  import Tabs from '../ui/Tabs/Tabs.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

  // let filterText: string = '';
  // let hasPermission: boolean = false;

  // $: permissionError = $planReadOnly ? PlanStatusMessages.READ_ONLY : 'You do not have permission to add an activity.';
  // $: if ($plan !== null) {
  //   hasPermission = featurePermissions.activityDirective.canCreate(user, $plan) && !$planReadOnly;
  // }
  // $: filteredActivityTypes = ($activityTypes ?? []).filter(({ name }) =>
  //   name.toLowerCase().includes(filterText.toLowerCase()),
  // );

  // async function createActivityDirectiveAtPlanStart(activityType: ActivityType) {
  //   if ($plan !== null) {
  //     const { start_time_doy } = $plan;
  //     effects.createActivityDirective({}, start_time_doy, activityType.name, activityType.name, {}, $plan, user);
  //   }
  // }

  // function onDragEnd(): void {
  //   document.getElementById('list-item-drag-image')?.remove();
  // }

  // function onDragStart(event: DragEvent, activityType: ActivityType): void {
  //   const dragImage = document.createElement('div');
  //   const text = document.createTextNode(activityType.name);
  //   dragImage.appendChild(text);
  //   dragImage.id = 'list-item-drag-image';
  //   dragImage.style.padding = '10px';
  //   dragImage.style.color = 'rgba(0, 0, 0, 0.8)';
  //   document.body.appendChild(dragImage);
  //   event.dataTransfer?.setDragImage(dragImage, 0, 0);
  //   event.dataTransfer?.setData('activityTypeName', activityType.name);
  // }
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="Activity & Resource Types" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <Tabs class="activity-resource-tabs" tabListClassName="activity-resource-tabs-list">
      <svelte:fragment slot="tab-list">
        <Tab class="activity-resource-tab"><DirectiveIcon /> Activities</Tab>
        <Tab class="activity-resource-tab"><TimelineLineLayerIcon /> Resources</Tab>
      </svelte:fragment>
      <TabPanel>
        <ActivityList {user} />
      </TabPanel>
      <TabPanel>
        <ResourceList {user} />
      </TabPanel>
    </Tabs>
  </svelte:fragment>>
</Panel>

<style>
  :global(.tab-list.activity-resource-tabs-list) {
    background-color: var(--st-gray-10);
    /* box-shadow: 0px -1px 0px inset var(--st-gray-90); */
  }

  :global(button.activity-resource-tab) {
    align-items: center;
    display: flex;
    gap: 8px;
    text-align: left;
  }

  :global(button.activity-resource-tab:last-of-type) {
    flex: 1;
  }

  :global(button.activity-resource-tab:last-of-type.selected) {
    box-shadow: 1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-tab:first-of-type.selected) {
    box-shadow: -1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-tab:not(.selected)) {
    box-shadow: 0px -1px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-tab.selected) {
    background-color: white;
    box-shadow:
      1px 0px 0px inset var(--st-gray-20),
      -1px 0px 0px inset var(--st-gray-20);
  }
</style>
