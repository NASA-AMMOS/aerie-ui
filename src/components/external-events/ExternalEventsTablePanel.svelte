<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventsDB, selectExternalEvent, selectedExternalEventId } from '../../stores/external-event';
  import { viewTogglePanel } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalEventsTable from './ExternalEventsTable.svelte';

  export let gridSection: ViewGridSection;
  export let user: User | null;

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
      bind:selectedItemId={$selectedExternalEventId}
      items={$externalEventsDB.flatMap(ee => ee.external_event)}
      {user}
      on:rowDoubleClicked={onRowDoubleClicked}
      on:selectionChanged={onSelectionChanged}
    />
  </svelte:fragment>
</Panel>

<style>
</style>
