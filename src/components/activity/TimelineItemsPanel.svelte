<svelte:options immutable={true} />

<script lang="ts">
  import Balloon from 'bootstrap-icons/icons/balloon.svg?component';
  import DirectiveAndSpanIcon from '../../assets/timeline-directive-and-span.svg?component';
  import TimelineLineLayerIcon from '../../assets/timeline-line-layer.svg?component';
  import type { ViewGridSection } from '../../types/view';
  import ActivityList from '../ActivityList.svelte';
  import ExternalEventTypeList from '../ExternalEventTypeList.svelte';
  import GridMenu from '../menus/GridMenu.svelte';
  import ResourceList from '../ResourceList.svelte';
  import Panel from '../ui/Panel.svelte';
  import Tab from '../ui/Tabs/Tab.svelte';
  import TabPanel from '../ui/Tabs/TabPanel.svelte';
  import Tabs from '../ui/Tabs/Tabs.svelte';

  export let gridSection: ViewGridSection;
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="Activity, Resource, External Event Types" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    <Tabs class="activity-resource-external-event-tabs" tabListClassName="activity-resource-external-event-tabs-list">
      <svelte:fragment slot="tab-list">
        <Tab class="activity-resource-external-event-tab"><DirectiveAndSpanIcon /> Activities</Tab>
        <Tab class="activity-resource-external-event-tab"><TimelineLineLayerIcon /> Resources</Tab>
        <Tab class="activity-resource-external-event-tab"><Balloon /> External Event</Tab>
      </svelte:fragment>
      <TabPanel>
        <ActivityList />
      </TabPanel>
      <TabPanel>
        <ResourceList />
      </TabPanel>
      <TabPanel>
        <ExternalEventTypeList />
      </TabPanel>
    </Tabs>
  </svelte:fragment>>
</Panel>

<style>
  :global(.tab-list.activity-resource-external-event-tabs-list) {
    background-color: var(--st-gray-10);
  }

  :global(button.activity-resource-external-event-tab) {
    align-items: center;
    display: flex;
    gap: 8px;
    text-align: left;
  }

  :global(button.activity-resource-external-event-tab:last-of-type) {
    flex: 1;
  }

  :global(button.activity-resource-external-event-tab:last-of-type.selected) {
    box-shadow: 1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-external-event-tab:first-of-type.selected) {
    box-shadow: -1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-external-event-tab:not(.selected)) {
    box-shadow: 0px -1px 0px inset var(--st-gray-20);
  }

  :global(button.activity-resource-external-event-tab.selected) {
    background-color: white;
    box-shadow:
      1px 0px 0px inset var(--st-gray-20),
      -1px 0px 0px inset var(--st-gray-20);
  }
</style>
