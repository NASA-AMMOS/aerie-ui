<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventTypes } from '../../stores/external-event';
  import { externalSourceWithTypeName } from '../../stores/external-source';
  import { createExternalSourcePlanError } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalEventType } from '../../types/external-event';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import Collapse from '../Collapse.svelte';

  export let enabled: boolean;
  export let derivationGroup: DerivationGroup;
  export let plan_id: number | undefined;
  export let user: User | null;


  let selectedSourceEventTypes: ExternalEventType[] | null = null;
  let relevantSources: ExternalSourceWithResolvedNames[] = []
  $: relevantSources = $externalSourceWithTypeName.filter(source => derivationGroup.name === source.derivation_group)

  function onEnable(event: Event) {
    if (enabled) {
      // insert
      effects.insertDerivationGroupForPlan(derivationGroup.id, $plan, user);
      if (createExternalSourcePlanError !== null) {
        enabled = false;  // Unselect button if there was an error
      }
    }
    else {
      // delete
      effects.deleteDerivationGroupForPlan(derivationGroup.id, $plan, user);
      if (createExternalSourcePlanError !== null) {
        enabled = true;  // Reselect button if there was an error
      }
    }
  }

  async function getExternalEventTypes() { // refactor
    if (!selectedSourceEventTypes || selectedSourceEventTypes.length === 0) {
      selectedSourceEventTypes = (await effects.getExternalEventTypesBySource([derivationGroup.id], $externalEventTypes, user))
    }
  }
</script>

<div class="external-source-pairing">
  <Collapse title={derivationGroup.name} tooltipContent={"Derivation group " + derivationGroup.name} defaultExpanded={false}>
    <span slot="left">
      <input
        type="checkbox"
        bind:checked={enabled}
        style:cursor="pointer"
        on:change={onEnable}
        on:click|stopPropagation
      />
    </span>

    {#if relevantSources.length}
      <Collapse title={"Contained Sources"} tooltipContent={"View sources in this group"} defaultExpanded={false}>
        {#each relevantSources as source}
          <!-- Collapsible details -->
          <Collapse title={source.key} tooltipContent={source.key} defaultExpanded={false}>
            <p>
              <strong>Key:</strong> {source.key}
            </p>

            <p>
              <strong>Source Type:</strong> {source.source_type}
            </p>

            <p>
              <strong>Start Time:</strong> {source.start_time}
            </p>

            <p>
              <strong>End Time:</strong> {source.end_time}
            </p>

            <p>
              <strong>ValidAt:</strong> {source.valid_at}
            </p>
          </Collapse>
        {/each}
      </Collapse>
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
    {:else}
      <p>No sources in this group.</p>
    {/if}
  </Collapse>
</div>

