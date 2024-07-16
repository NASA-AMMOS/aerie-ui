<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventTypes } from '../../stores/external-event';
  import { derivationGroupPlanLinkError, externalSourceWithResolvedNames } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalEventType } from '../../types/external-event';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import Collapse from '../Collapse.svelte';

  export let enabled: boolean;
  export let derivationGroup: DerivationGroup;
  export let user: User | null;


  let selectedSourceEventTypes: ExternalEventType[] | null = null;
  let relevantSources: ExternalSourceWithResolvedNames[] = [];
  $: relevantSources = $externalSourceWithResolvedNames.filter(source => derivationGroup.name === source.derivation_group);

  function onEnable(_event: Event) {
    if (enabled) {
      // insert
      effects.insertDerivationGroupForPlan(derivationGroup.id, $plan, user);
      if (derivationGroupPlanLinkError !== null) {
        enabled = false;  // Unselect button if there was an error
      }
    } else {
      // delete
      effects.deleteDerivationGroupForPlan(derivationGroup.id, $plan, user);
      if (derivationGroupPlanLinkError !== null) {
        enabled = true;  // Reselect button if there was an error
      }
    }
  }

  async function getExternalEventTypes() {
    // refactor
    if (!selectedSourceEventTypes || selectedSourceEventTypes.length === 0) {
      selectedSourceEventTypes = await effects.getExternalEventTypesBySource(
        [derivationGroup.id],
        $externalEventTypes,
        user,
      );
    }
  }
</script>

<div class="external-source-pairing">
  <Collapse
    title={derivationGroup.name}
    tooltipContent={'Derivation group ' + derivationGroup.name}
    defaultExpanded={false}
  >
    <span slot="right">
      <p style:float="left" style:padding-top="0.1rem" style:padding-right="0.25rem" style:color="gray">
        {derivationGroup.derivedEventIds.length} derived events
      </p>
      <input
        type="checkbox"
        bind:checked={enabled}
        style:cursor="pointer"
        on:change={onEnable}
        on:click|stopPropagation
      />
    </span>

    {#if relevantSources.length}
      {#each relevantSources as source}
        <!-- Collapsible details -->
        <Collapse title={source.key} tooltipContent={source.key} defaultExpanded={false}>
          <span slot="right">
            <p style:color="gray">
              {derivationGroup.sources.get(source.key)?.event_counts} events
            </p>
          </span>
          <p>
            <strong>Key:</strong>
            {source.key}
          </p>

          <p>
            <strong>Source Type:</strong>
            {source.source_type}
          </p>

          <p>
            <strong>Start Time:</strong>
            {source.start_time}
          </p>

          <p>
            <strong>End Time:</strong>
            {source.end_time}
          </p>

          <p>
            <strong>Valid At:</strong>
            {source.valid_at}
          </p>

          <p>
            <strong>Created At:</strong>
            {source.created_at}
          </p>
        </Collapse>
      {/each}
      <Collapse
        className="anchor-collapse"
        defaultExpanded={false}
        title="Event Types"
        tooltipContent="View Contained Event Types"
        on:collapse={() => {
          getExternalEventTypes();
        }}
      >
        {#each selectedSourceEventTypes ? selectedSourceEventTypes : [{ id: -1, name: 'None' }] as eventType}
          <i>{eventType.name}</i>
        {/each}
      </Collapse>
    {:else}
      <p>No sources in this group.</p>
    {/if}
  </Collapse>
</div>
