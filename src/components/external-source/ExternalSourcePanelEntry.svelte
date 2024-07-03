<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventTypes } from '../../stores/external-event';
  import { createExternalSourcePlanError } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalEventType } from '../../types/external-event';
  import type { ExternalSourceWithTypeName } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import Collapse from '../Collapse.svelte';

  export let enabled: boolean;
  export let externalSource: ExternalSourceWithTypeName;
  export let user: User | null;


  let selectedSourceEventTypes: ExternalEventType[] | null = null;

  function onEnable(event: Event) {
    if (enabled) {
      effects.insertExternalSourceForPlan(externalSource.id, $plan, user);
      if (createExternalSourcePlanError !== null) {
        enabled = false;  // Unselect button if there was an error
      }
    }
    else {
      effects.deleteExternalSourceForPlan(externalSource.id, $plan, user);
      if (createExternalSourcePlanError !== null) {
        enabled = true;  // Reselect button if there was an error
      }
    }
  }

  async function getExternalEventTypes() {
    if (!selectedSourceEventTypes || selectedSourceEventTypes.length === 0) {
      selectedSourceEventTypes = (await effects.getExternalEventTypesBySource([externalSource.id], $externalEventTypes, user))
    }
  }
</script>

<div class="external-source-pairing">
  <Collapse title={externalSource.key} tooltipContent={externalSource.key} defaultExpanded={false}>
    <span slot="left">
      <input
        type="checkbox"
        bind:checked={enabled}
        style:cursor="pointer"
        on:change={onEnable}
        on:click|stopPropagation
      />
    </span>

    <!-- Collapsible details -->
    <p>
      <strong>Key:</strong> {externalSource.key}
    </p>

    <p>
      <strong>Source Type:</strong> {externalSource.source_type}
    </p>

    <p>
      <strong>Start Time:</strong> {externalSource.start_time}
    </p>

    <p>
      <strong>End Time:</strong> {externalSource.end_time}
    </p>

    <p>
      <strong>ValidAt:</strong> {externalSource.valid_at}
    </p>

    <Collapse
      className="anchor-collapse"
      defaultExpanded={false}
      title="Event Types"
      tooltipContent="View Contained Event Types"
      on:collapse={() => {getExternalEventTypes()}}
    >
      {#each selectedSourceEventTypes ? selectedSourceEventTypes : [{ id: -1, name: "None" }] as eventType}
        <i>{eventType.name}</i>
      {/each}
    </Collapse>
  </Collapse>
</div>

