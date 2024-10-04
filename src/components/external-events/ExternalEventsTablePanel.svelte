<svelte:options immutable={true} />

<script lang="ts">
  import { externalEvents, selectExternalEvent, selectedExternalEventId } from '../../stores/external-event';
  import { viewTogglePanel } from '../../stores/views';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalEventsTable from './ExternalEventsTable.svelte';

  export let gridSection: ViewGridSection;

  function onRowDoubleClicked() {
    viewTogglePanel({ state: true, type: 'right', update: { rightComponentTop: 'ExternalEventFormPanel' } });
  }

  function onSelectionChanged() {
    selectExternalEvent($selectedExternalEventId);
  }
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="External Events Table" />
  </svelte:fragment>
  <svelte:fragment slot="body">
    <ExternalEventsTable
      items={$externalEvents}
      on:rowDoubleClicked={onRowDoubleClicked}
      on:selectionChanged={onSelectionChanged}
    />
  </svelte:fragment>
</Panel>
