<svelte:options immutable={true} />

<script lang="ts">
  import { externalEventTypes } from '../../stores/external-event';
  import { currentPlanDerivationGroupFilter, externalSourceWithResolvedNames } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ExternalEventType } from '../../types/external-event';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';

  export let enabled: boolean = true;
  export let derivationGroup: DerivationGroup;
  export let user: User | null;

  let dgInFilter: boolean = false;
  let selectedSourceEventTypes: ExternalEventType[] | null = null;
  let relevantSources: ExternalSourceWithResolvedNames[] = [];

  $: relevantSources = $externalSourceWithResolvedNames.filter(source => derivationGroup.id === source.derivation_group_id);
  $: {
      if (enabled) {
        if (dgInFilter) {
          currentPlanDerivationGroupFilter.update(current => {
            return current.filter(f => f.id !== derivationGroup.id);
          });
        }
      } else {
        if (!(dgInFilter)) {
          currentPlanDerivationGroupFilter.update(current => [
            ...current,
            derivationGroup,
          ])
        }
      }
    }

  function onChange(_event: Event) {
    currentPlanDerivationGroupFilter.subscribe(filterArray => {
      dgInFilter = filterArray.some(dg => dg.id === derivationGroup.id);
    })
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

  async function deleteEmptyDerivationGroup() {
    if (enabled) {
      // delete plan derivation group association
      await effects.deleteDerivationGroupForPlan(derivationGroup.id, $plan, user);
    }
    // delete the derivation group itself
    await effects.deleteDerivationGroup(derivationGroup.id, user);
  }

  $: console.log(derivationGroup)
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
        on:change={onChange}
        on:click|stopPropagation
        use:tooltip={{ content: 'Enable group', placement: 'top' }}
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
      <!--This should be impossible, as the derivation group should have been deleted by this point. Just in case... we offer a delete button here.-->
      <p>No sources in this group.</p>
      <button
          name="delete-dg"
          class="st-button secondary"
          on:click|stopPropagation={deleteEmptyDerivationGroup}
        >
          Delete Empty Derivation Group
        </button>
    {/if}
  </Collapse>
</div>
