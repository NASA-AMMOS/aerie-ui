<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventsDB, selectedExternalEventId } from '../../stores/external-event';
  import {
    activityEditingLocked,
    plan
  } from '../../stores/plan';
  import type { ViewGridSection } from '../../types/view';
  import GridMenu from '../menus/GridMenu.svelte';
  import Panel from '../ui/Panel.svelte';
  import ExternalEventForm from './ExternalEventForm.svelte';

  export let gridSection: ViewGridSection;
</script>

<Panel padBody={false}>
  <svelte:fragment slot="header">
    <GridMenu {gridSection} title="Selected External Event" />
  </svelte:fragment>

  <svelte:fragment slot="body">
    {#if $selectedExternalEventId && $plan !== null}
      <ExternalEventForm
        externalEvents={$externalEventsDB}
        externalEvent={$selectedExternalEventId}
        editable={!$activityEditingLocked}
      />
    {:else}
      <div class="p-2 st-typography-label">No Activity Selected</div>
    {/if}
  </svelte:fragment>
</Panel>

<style>
</style>
